import { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage, protocol, net } from 'electron'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { initSettingsManager } from './settings-manager'
import { initModelDownloader } from './model-downloader'

let mainWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isAlwaysOnTop = false

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'model',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
  {
    scheme: 'builtin',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
])

const MIN_WIDTH = 300
const MIN_HEIGHT = 400
const MAX_WIDTH = 800
const MAX_HEIGHT = 1200
const WIN_W = 400
const WIN_H = 680

function registerModelProtocol(): void {
  protocol.handle('model', async (request) => {
    const requestUrl = new URL(request.url)
    let pathname = decodeURIComponent(requestUrl.pathname)

    let filePath: string
    if (process.platform === 'win32') {
      const host = requestUrl.hostname
      if (/^[a-zA-Z]$/.test(host)) {
        filePath = `${host.toUpperCase()}:${pathname.replace(/\//g, '\\')}`
      } else if (/^[a-zA-Z]:/.test(pathname)) {
        filePath = pathname.replace(/^\//, '').replace(/\//g, '\\')
      } else {
        filePath = pathname.replace(/^\//, '').replace(/\//g, path.sep)
      }
    } else {
      filePath = pathname.replace(/^\//, '').replace(/\//g, path.sep)
    }

    try {
      if (!fs.existsSync(filePath)) {
        console.error(`[Protocol] File not found: ${filePath}`)
        return new Response('Not Found', { status: 404 })
      }

      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.json': 'application/json',
        '.moc3': 'application/octet-stream',
        '.moc': 'application/octet-stream',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webp': 'image/webp',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
      }
      const contentType = mimeTypes[ext] || 'application/octet-stream'

      const data = fs.readFileSync(filePath)
      return new Response(data, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      console.error('[Protocol] Error serving file:', err)
      return new Response('Internal Error', { status: 500 })
    }
  })

  console.log('[Protocol] Registered "model://" protocol')

  protocol.handle('builtin', async (request) => {
    const requestUrl = new URL(request.url)
    const host = requestUrl.hostname
    const pathname = decodeURIComponent(requestUrl.pathname).replace(/^\//, '')
    const relPath = host ? `${host}/${pathname}` : pathname
    const modelsDir = getBuiltinModelsDir()
    const motionsDir = getBuiltinMotionsDir()

    const candidates: string[] = []
    candidates.push(path.join(modelsDir, relPath))
    if (host === 'motions') {
      candidates.push(path.join(motionsDir, pathname))
    }
    candidates.push(path.join(motionsDir, relPath))
    candidates.push(path.join(motionsDir, pathname))

    let filePath = ''
    for (const c of candidates) {
      if (fs.existsSync(c)) { filePath = c; break }
    }

    if (!filePath) {
      console.error(`[Builtin] File not found: ${relPath}`)
      return new Response('Not Found', { status: 404 })
    }

    try {
      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.json': 'application/json',
        '.moc3': 'application/octet-stream',
        '.moc': 'application/octet-stream',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webp': 'image/webp',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
      }
      const contentType = mimeTypes[ext] || 'application/octet-stream'

      const data = fs.readFileSync(filePath)
      return new Response(data, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      console.error('[Builtin] Error serving file:', err)
      return new Response('Internal Error', { status: 500 })
    }
  })

  console.log('[Protocol] Registered "builtin://" protocol')
}

function getRuntimeCandidates(): string[] {
  return [
    path.join(app.getAppPath(), 'runtime', 'live2dcubismcore.min.js'),
    path.join(app.getAppPath(), 'public', 'runtime', 'live2dcubismcore.min.js'),
    path.join(process.cwd(), 'runtime', 'live2dcubismcore.min.js'),
  ]
}

function findCubismRuntime(): string | null {
  for (const candidate of getRuntimeCandidates()) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function createMainWindow() {
  const workArea = screen.getPrimaryDisplay().workArea
  const winW = 400
  const winH = 680

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    useContentSize: true,
    resizable: false,
    x: workArea.x + workArea.width - winW,
    y: workArea.y + workArea.height - winH,
    transparent: true,
    frame: false,
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
    },
  })

  mainWindow.setMinimumSize(winW, winH)
  mainWindow.setMaximumSize(winW, winH)

  let locking = false
  mainWindow.on('resize', () => {
    if (locking) return
    const [cw, ch] = mainWindow!.getSize()
    if (cw !== winW || ch !== winH) {
      locking = true
      mainWindow!.setSize(winW, winH)
      setTimeout(() => { locking = false }, 0)
    }
  })

  if (process.env.NODE_ENV === 'development') {
    const devPort = process.env.VITE_PORT || '5173'
    mainWindow.loadURL(`http://localhost:${devPort}`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.setVisibleOnAllWorkspaces(true)
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  settingsWindow = new BrowserWindow({
    width: 720,
    height: 580,
    x: Math.floor((screenWidth - 720) / 2),
    y: Math.floor((screenHeight - 580) / 2),
    title: 'SEKAI Desktop Pet - 设置',
    frame: true,
    transparent: false,
    backgroundColor: '#1e1e2e',
    resizable: true,
    minimizable: true,
    maximizable: false,
    minWidth: 480,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    const devPort = process.env.VITE_PORT || '5173'
    settingsWindow.loadURL(`http://localhost:${devPort}/#/settings`)
    settingsWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/settings' })
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEbSURBVFhH7ZY9DoMwDIUDC+9gKn3BC9SxS3HYFTxAjbvEhc+QJPvSBkpKUiQb0iYZ+qTffn/58vTZ7wuWZdmPZdcr8B3HMqYjJmOq8B3HMWYYkwHnZMYYmTGFNDAzJmMKqIH5WdMLzM+Yjgf4MmYyJmOq8B3HMYYZw0YYkwHnZMQYmTF5MHIy5gAhpuNWdMBLzPmI4H+DJmMiZjqvAdxzFmBJMBZ2fMHpiYkzUDM2Oq8B3HMYYZw0YYkwHnZMQYmTF5MHIy5gAhpuNWdMBLzPmI4H+DJmMiZjqvAdxzFmBJMBZ2fMHpiYkzUDM2Oq8B3HMYYZw0YYkwHnZMQYmTF5MHIy5gAhpuNWdMBLzPmI4H+DJmMiZjq/DnLssxr/j4O+q47/sA3tEGFfCu1WIAAAAASUVORK5CYII='
  )

  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { label: '设置', click: () => createSettingsWindow() },
    { type: 'separator' },
    {
      label: isAlwaysOnTop ? '取消置顶' : '窗口置顶',
      click: () => {
        isAlwaysOnTop = !isAlwaysOnTop
        mainWindow?.setAlwaysOnTop(isAlwaysOnTop)
        createTray()
      },
    },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('SEKAI Desktop Pet')
  tray.on('double-click', () => mainWindow?.show())
}

function getBuiltinModelsDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'models')
  }
  return path.join(__dirname, '..', 'public', 'models')
}

function getBuiltinMotionsDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'motions')
  }
  return path.join(__dirname, '..', 'public', 'motions')
}

function getModelsDir(): string {
  const dir = path.join(app.getPath('userData'), 'models')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function setupIPC() {
  ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  ipcMain.handle('models:get-path', () => getModelsDir())

  ipcMain.handle('models:list-motions', (_event, modelPath: string) => {
    const groups: string[] = []
    try {
      const url = modelPath.replace('builtin:///', '')
      const modelsDir = getBuiltinModelsDir()
      const modelDir = path.dirname(path.join(modelsDir, url))
      const motionsDir = path.join(modelDir, 'motions')
      if (fs.existsSync(motionsDir)) {
        const files = fs.readdirSync(motionsDir)
        for (const f of files) {
          const match = f.match(/^(.+)\.motion3\.json$/)
          if (match) groups.push(match[1])
        }
      }
    } catch { }
    return groups
  })

  ipcMain.handle('models:verify-motions', (_event, modelPath: string, fileReferencesJson: string) => {
    const existing: string[] = []
    try {
      const refs: Record<string, Array<{ File: string }>> = JSON.parse(fileReferencesJson)
      const modelsDir = getBuiltinModelsDir()
      const url = modelPath.replace('builtin:///', '')
      const modelDir = path.dirname(path.join(modelsDir, url))
      const motionsDir = path.join(modelDir, 'motions')
      for (const group of Object.keys(refs)) {
        let found = false
        const entries = refs[group]
        if (entries && entries.length > 0) {
          const filePath = entries[0].File || ''
          const fileUrl = filePath.replace('builtin:/', '')
          if (fs.existsSync(path.join(modelsDir, fileUrl))) found = true
        }
        if (!found && fs.existsSync(path.join(motionsDir, `${group}.motion3.json`))) found = true
        if (found) existing.push(group)
      }
    } catch { }
    return existing
  })

  ipcMain.handle('models:list', () => {
    const dir = getModelsDir()
    const results: Array<{ name: string; path: string }> = []
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const subDir = path.join(dir, entry.name)
        const files = fs.readdirSync(subDir)
        const modelFile = files.find(f => f.endsWith('.model3.json') || f.endsWith('.model.json'))
        if (modelFile) {
          results.push({
            name: entry.name,
            path: path.join(subDir, modelFile),
          })
        }
      }
    } catch (e) {
      console.error('[Models] List failed:', e)
    }
    return results.filter(r => r.name === '20mizuki_normal')
  })

  ipcMain.handle('models:list-builtin', () => {
    const dir = getBuiltinModelsDir()
    const results: Array<{ name: string; builtinPath: string }> = []
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const subDir = path.join(dir, entry.name)
        const subEntries = fs.readdirSync(subDir, { withFileTypes: true })
        for (const subEntry of subEntries) {
          if (!subEntry.isDirectory()) continue
          const modelDir = path.join(subDir, subEntry.name)
          const files = fs.readdirSync(modelDir)
          const modelFile = files.find(f => f.endsWith('.model3.json') || f.endsWith('.model.json'))
          if (modelFile) {
            const relPath = `${entry.name}/${subEntry.name}/${modelFile}`
            results.push({
              name: subEntry.name.replace(/^v?\d+_/, ''),
              builtinPath: `builtin:///${relPath}`,
            })
          }
        }
      }
    } catch (e) {
      console.error('[Builtin] List failed:', e)
    }
    return results.filter(r => r.name === '20mizuki_normal')
  })

  ipcMain.on('models:open-dir', () => {
    const dir = getModelsDir()
    require('electron').shell.openPath(dir)
  })

  ipcMain.on('window-move', (_event, { deltaX, deltaY }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition()
      mainWindow.setBounds({ x: x + deltaX, y: y + deltaY, width: WIN_W, height: WIN_H })
    }
  })

  let dragStartWinX = 0
  let dragStartWinY = 0
  let dragStartWinW = 0
  let dragStartWinH = 0
  ipcMain.on('window-drag-start', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds()
      dragStartWinX = bounds.x
      dragStartWinY = bounds.y
      dragStartWinW = bounds.width
      dragStartWinH = bounds.height
    }
  })
  ipcMain.on('window-move-to', (_event, { dx, dy }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBounds({
        x: dragStartWinX + dx,
        y: dragStartWinY + dy,
        width: dragStartWinW,
        height: dragStartWinH,
      })
    }
  })

  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window-close', () => {
    mainWindow?.hide()
  })

  ipcMain.on('window-toggle-top', () => {
    isAlwaysOnTop = !isAlwaysOnTop
    mainWindow?.setAlwaysOnTop(isAlwaysOnTop)
  })

  ipcMain.handle('window-is-top', () => isAlwaysOnTop)
  ipcMain.handle('runtime:get-cubism-core', () => findCubismRuntime())

  ipcMain.on('open-settings', () => {
    createSettingsWindow()
  })

  ipcMain.on('resize-window', (_event, { width, height }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [currentW, currentH] = mainWindow.getSize()
      const newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
      const newH = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height))
      mainWindow.setSize(newW, newH)
    }
  })

  ipcMain.handle('reload-model', async () => {
    return new Promise((resolve) => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        resolve({ ok: false, error: '主窗口未打开' })
        return
      }
      const requestId = Date.now().toString(36)
      const onResult = (_e: any, result: any) => {
        if (result?.requestId === requestId) {
          ipcMain.removeListener('reload-model-result', onResult)
          resolve(result)
        }
      }
      ipcMain.on('reload-model-result', onResult)
      mainWindow.webContents.send('reload-model-request', { requestId })
      setTimeout(() => {
        ipcMain.removeListener('reload-model-result', onResult)
        resolve({ ok: false, error: '刷新超时（30秒未响应）' })
      }, 30000)
    })
  })
}

app.whenReady().then(() => {
  registerModelProtocol()
  initSettingsManager()
  initModelDownloader()
  setupIPC()
  createMainWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow()
  }
})
