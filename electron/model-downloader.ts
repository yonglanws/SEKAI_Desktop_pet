import { app, ipcMain, BrowserWindow, dialog, net } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const MODEL_LIST_URL = 'https://storage.sekai.best/sekai-live2d-assets/live2d/model_list.json'
const MODEL_BASE_URL = 'https://storage.sekai.best/sekai-live2d-assets/live2d/model'
const MOTION_BASE_URL = 'https://storage.sekai.best/sekai-live2d-assets/live2d/motion'

const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 800

interface ModelEntry {
  modelBase: string
  modelName: string
  modelPath: string
  modelFile: string
}

interface DownloadProgress {
  taskId: string
  modelKey: string
  modelName: string
  total: number
  done: number
  failed: number
  skipped: number
  status: 'running' | 'success' | 'error' | 'cancelled'
  message?: string
  currentFile?: string
}

const activeTasks = new Map<string, { cancelled: boolean }>()

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function fetchBufferOnce(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      url,
      method: 'GET',
      redirect: 'follow',
      useSessionCookies: false,
    })
    request.setHeader('User-Agent', 'SEKAI-Desktop-Pet/1.0 (Electron)')
    request.setHeader('Accept', '*/*')
    const chunks: Buffer[] = []
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { request.abort() } catch (_) { }
      reject(new Error(`Request timeout (${REQUEST_TIMEOUT_MS}ms): ${url}`))
    }, REQUEST_TIMEOUT_MS)

    request.on('redirect', (_status, _method, _redirectUrl) => {
      try { request.followRedirect() } catch (_) { }
    })

    request.on('response', (response) => {
      const statusCode = response.statusCode
      if (statusCode && statusCode >= 400) {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(new Error(`HTTP ${statusCode} for ${url}`))
        return
      }
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      response.on('end', () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(Buffer.concat(chunks))
      })
      response.on('error', (err: Error) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(err)
      })
      response.on('aborted' as any, () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(new Error('Response aborted: ' + url))
      })
    })
    request.on('error', (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(err)
    })
    request.on('abort', () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new Error('Request aborted: ' + url))
    })
    request.end()
  })
}

async function fetchBuffer(url: string, retries = MAX_RETRIES): Promise<Buffer> {
  let lastError: any
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetchBufferOnce(url)
    } catch (e) {
      lastError = e
      if (attempt < retries - 1) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
      }
    }
  }
  throw lastError
}

async function fetchJson<T = any>(url: string): Promise<T> {
  const buf = await fetchBuffer(url)
  return JSON.parse(buf.toString('utf-8')) as T
}

async function downloadFile(url: string, savePath: string, skipIfExists = true): Promise<'downloaded' | 'skipped'> {
  if (skipIfExists && fs.existsSync(savePath)) {
    const stat = fs.statSync(savePath)
    if (stat.size > 0) return 'skipped'
  }
  const data = await fetchBuffer(url)
  const dir = path.dirname(savePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const tmpPath = savePath + '.tmp'
  fs.writeFileSync(tmpPath, data)
  fs.renameSync(tmpPath, savePath)
  return 'downloaded'
}

function broadcast(channel: string, payload: any) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload)
    }
  }
}

function buildMotionBaseUrl(modelPath: string): string {
  const parts = modelPath.split('/')
  const parentPath = parts.slice(0, -1).join('/')
  const folder = parts[parts.length - 2]?.replace(/_/g, '') || ''
  return `${MOTION_BASE_URL}/${parentPath}/${folder}_motion_base/`
}

function tryRemoveEmpty(dir: string) {
  try {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir)
    if (entries.length === 0) fs.rmdirSync(dir)
  } catch (_) { }
}

async function downloadModel(
  taskId: string,
  model: ModelEntry,
  saveRoot: string,
  concurrency: number,
): Promise<void> {
  const cancelToken = activeTasks.get(taskId)
  const modelKey = `${model.modelBase}/${model.modelName}`
  const modelDir = path.join(saveRoot, model.modelBase, model.modelName)

  console.log(`[Downloader] Start task ${taskId}: ${modelKey} → ${modelDir}`)

  const progress: DownloadProgress = {
    taskId,
    modelKey,
    modelName: model.modelName,
    total: 0,
    done: 0,
    failed: 0,
    skipped: 0,
    status: 'running',
  }

  let lastEmit = 0
  const emit = (force = false) => {
    const now = Date.now()
    if (force || now - lastEmit >= 50) {
      lastEmit = now
      broadcast('downloader:progress', { ...progress })
    }
  }

  try {
    const model3JsonUrl = `${MODEL_BASE_URL}/${model.modelPath}/${model.modelFile}`
    const model3JsonPath = path.join(modelDir, model.modelFile)
    progress.currentFile = model.modelFile
    emit(true)

    console.log(`[Downloader] Fetching model3.json: ${model3JsonUrl}`)
    const model3Json: any = await fetchJson(model3JsonUrl)
    if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir, { recursive: true })
    fs.writeFileSync(model3JsonPath, JSON.stringify(model3Json, null, 2), 'utf-8')
    progress.done++
    emit(true)

    if (cancelToken?.cancelled) throw new Error('cancelled')

    const refs = model3Json?.FileReferences || {}
    const baseTasks: Array<{ url: string; save: string }> = []

    if (refs.Moc) {
      baseTasks.push({
        url: `${MODEL_BASE_URL}/${model.modelPath}/${refs.Moc}`,
        save: path.join(modelDir, refs.Moc),
      })
    }
    if (refs.Physics) {
      baseTasks.push({
        url: `${MODEL_BASE_URL}/${model.modelPath}/${refs.Physics}`,
        save: path.join(modelDir, refs.Physics),
      })
    }
    if (Array.isArray(refs.Textures)) {
      for (const tex of refs.Textures) {
        baseTasks.push({
          url: `${MODEL_BASE_URL}/${model.modelPath}/${tex}`,
          save: path.join(modelDir, tex),
        })
      }
    }

    const motionTasks: Array<{ url: string; save: string }> = []
    const motionRefs: Record<string, Array<{ FadeInTime: number; FadeOutTime: number; File: string }>> = {}
    try {
      const motionBaseUrl = buildMotionBaseUrl(model.modelPath)
      const buildMotionData: Record<string, string[]> = await fetchJson(`${motionBaseUrl}BuildMotionData.json`)
      const motionDir = path.join(modelDir, 'motions')
      const motionTypeMap: Record<string, string> = { expressions: 'facial', motions: 'motion' }
      for (const [typ, motions] of Object.entries(buildMotionData)) {
        if (!Array.isArray(motions)) continue
        const subDir = motionTypeMap[typ] || 'motion'
        for (const motion of motions) {
          const motionFile = `${motion}.motion3.json`
          motionRefs[motion] = [{
            FadeInTime: 0.5,
            FadeOutTime: 0.5,
            File: `motions/${motionFile}`,
          }]
          motionTasks.push({
            url: `${motionBaseUrl}${subDir}/${motionFile}`,
            save: path.join(motionDir, motionFile),
          })
        }
      }
      console.log(`[Downloader] Built motion refs (own motions): ${Object.keys(motionRefs).length}, files: ${motionTasks.length}`)
    } catch (e) {
      progress.message = 'BuildMotionData 获取失败，使用默认动作引用'
    }

    if (Object.keys(motionRefs).length > 0) {
      try {
        if (!model3Json.FileReferences) model3Json.FileReferences = {}
        model3Json.FileReferences.Motions = {
          ...(model3Json.FileReferences.Motions || {}),
          ...motionRefs,
        }
        fs.writeFileSync(model3JsonPath, JSON.stringify(model3Json, null, 2), 'utf-8')
        console.log(`[Downloader] Merged ${Object.keys(motionRefs).length} motions into model3.json (own motions)`)
      } catch (e: any) {
        console.warn('[Downloader] Failed to merge motions into model3.json:', e?.message)
      }
    }

    const allTasks = [...baseTasks, ...motionTasks]
    progress.total = allTasks.length + 1
    console.log(`[Downloader] Total ${allTasks.length} files to download for ${modelKey}`)
    emit(true)

    let index = 0
    const worker = async () => {
      while (index < allTasks.length) {
        if (cancelToken?.cancelled) return
        const cur = index++
        const task = allTasks[cur]
        progress.currentFile = path.basename(task.save)
        try {
          const r = await downloadFile(task.url, task.save)
          if (r === 'skipped') progress.skipped++
          progress.done++
        } catch (e) {
          progress.failed++
        }
        emit()
      }
    }
    const workerCount = Math.max(1, Math.min(concurrency || 4, 16))
    const workers: Promise<void>[] = []
    for (let i = 0; i < workerCount; i++) workers.push(worker())
    await Promise.all(workers)

    if (cancelToken?.cancelled) {
      progress.status = 'cancelled'
      progress.message = '已取消'
    } else if (progress.failed > 0) {
      progress.status = 'error'
      progress.message = `完成（${progress.failed} 个文件失败）`
    } else {
      progress.status = 'success'
      progress.message = progress.skipped > 0
        ? `下载完成（跳过 ${progress.skipped} 个已存在文件）`
        : '下载完成'
    }
  } catch (e: any) {
    console.error(`[Downloader] Task ${taskId} failed:`, e?.message || e)
    if (cancelToken?.cancelled) {
      progress.status = 'cancelled'
      progress.message = '已取消'
    } else {
      progress.status = 'error'
      progress.message = e?.message || String(e)
    }
  } finally {
    progress.currentFile = undefined
    if (progress.status === 'cancelled' && progress.done === 0 && progress.failed === 0) {
      try {
        if (fs.existsSync(modelDir)) {
          fs.rmSync(modelDir, { recursive: true, force: true })
        }
        tryRemoveEmpty(path.dirname(modelDir))
      } catch (_) { }
    }
    console.log(`[Downloader] Task ${taskId} ended: status=${progress.status}, done=${progress.done}, failed=${progress.failed}, total=${progress.total}`)
    emit(true)
    activeTasks.delete(taskId)
  }
}

export function initModelDownloader() {
  ipcMain.handle('downloader:fetch-model-list', async () => {
    try {
      const data = await fetchJson<ModelEntry[]>(MODEL_LIST_URL)
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) }
    }
  })

  ipcMain.handle('downloader:choose-dir', async (_event, defaultPath?: string) => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(win!, {
      title: '选择模型保存目录',
      defaultPath: defaultPath || app.getPath('userData'),
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false }
    }
    return { ok: true, path: result.filePaths[0] }
  })

  ipcMain.handle('downloader:start', async (_event, args: {
    models: ModelEntry[]
    saveRoot: string
    concurrency?: number
  }) => {
    if (!args?.saveRoot) return { ok: false, error: '保存目录无效' }
    if (!Array.isArray(args.models) || args.models.length === 0) {
      return { ok: false, error: '未选择任何模型' }
    }
    if (!fs.existsSync(args.saveRoot)) {
      try {
        fs.mkdirSync(args.saveRoot, { recursive: true })
      } catch (e: any) {
        return { ok: false, error: '创建保存目录失败：' + (e?.message || String(e)) }
      }
    }
    const taskIds: string[] = []
    for (const model of args.models) {
      const taskId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      taskIds.push(taskId)
      activeTasks.set(taskId, { cancelled: false })
      downloadModel(taskId, model, args.saveRoot, args.concurrency || 4).catch(() => { })
    }
    return { ok: true, taskIds }
  })

  ipcMain.handle('downloader:cancel', async (_event, taskId: string) => {
    const tk = activeTasks.get(taskId)
    if (tk) tk.cancelled = true
    return { ok: true }
  })

  ipcMain.handle('downloader:cancel-all', async () => {
    for (const tk of activeTasks.values()) tk.cancelled = true
    return { ok: true }
  })

  ipcMain.handle('downloader:scan-local', async (_event, dir: string) => {
    const results: Array<{ name: string; modelBase: string; path: string; localPath: string }> = []
    try {
      if (!dir || !fs.existsSync(dir)) return { ok: true, data: results }
      const baseEntries = fs.readdirSync(dir, { withFileTypes: true })
      for (const baseEntry of baseEntries) {
        if (!baseEntry.isDirectory()) continue
        const baseDir = path.join(dir, baseEntry.name)
        const subEntries = fs.readdirSync(baseDir, { withFileTypes: true })
        for (const subEntry of subEntries) {
          if (!subEntry.isDirectory()) continue
          const modelDir = path.join(baseDir, subEntry.name)
          const files = fs.readdirSync(modelDir)
          const model3 = files.find(f => f.endsWith('.model3.json') || f.endsWith('.model.json'))
          if (model3) {
            const fullPath = path.join(modelDir, model3)
            const normalized = fullPath.replace(/\\/g, '/')
            results.push({
              name: subEntry.name,
              modelBase: baseEntry.name,
              path: `model:///${normalized}`,
              localPath: fullPath,
            })
          }
        }
      }
    } catch (e) {
      console.error('[Downloader] Scan failed:', e)
    }
    return { ok: true, data: results }
  })

  ipcMain.handle('downloader:delete-model', async (_event, localPath: string) => {
    try {
      if (!localPath || typeof localPath !== 'string') return { ok: false, error: '路径无效' }
      const resolved = path.resolve(localPath)
      const modelDir = path.dirname(resolved)
      const modelName = path.basename(modelDir)

      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        const choice = await dialog.showMessageBox(win, {
          type: 'warning',
          title: '删除模型',
          message: `确定要删除模型「${modelName}」吗？`,
          detail: `路径：${modelDir}\n\n此操作不可恢复。`,
          buttons: ['取消', '删除'],
          defaultId: 0,
          cancelId: 0,
          noLink: true,
        })
        if (choice.response !== 1) return { ok: false, error: '已取消' }
      }

      if (!fs.existsSync(modelDir)) return { ok: false, error: '模型目录不存在' }
      fs.rmSync(modelDir, { recursive: true, force: true })
      if (fs.existsSync(modelDir)) return { ok: false, error: '删除后目录仍存在，文件可能被占用' }
      tryRemoveEmpty(path.dirname(modelDir))
      console.log(`[Downloader] Deleted model: ${modelDir}`)
      return { ok: true }
    } catch (e: any) {
      console.error('[Downloader] Delete failed:', e)
      return { ok: false, error: e?.message || String(e) }
    }
  })
}
