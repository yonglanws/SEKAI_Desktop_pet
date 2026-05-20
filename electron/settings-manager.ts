import { app, ipcMain, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const SETTINGS_FILE = 'settings.json'

const defaultSettings = {
  theme: 'dark',
  fontSize: 14,
  language: 'zh-CN',
  live2d: {
    selectedModel: 'builtin:///mizuki/20mizuki_normal/20mizuki_normal.model3.json',
    modelScale: 1.0,
    enableLipSync: true,
    enableBreath: true,
    enableEyeBlink: true,
    mouseTrackingSensitivity: 0.5,
    autoIdleMotion: false,
    textureLOD: 'single-auto',
    highPrecisionMask: true,
    cubismMemoryMB: 32,
    customModelDir: '',
  },
  ai: {
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    systemPrompt: '你是游戏世界计划的{name}，请以此人物的语气回答用户的问题。',
    temperature: 0.7,
    maxTokens: 512,
  },
  interaction: {
    hoverFeedback: true,
    clickResponse: true,
    dragEnabled: true,
    doubleClickAction: 'motion',
  },
  performance: {
    targetFPS: 30,
    reduceWhenHidden: true,
    minimizeToTray: true,
  },
}

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE)
}

let cachedSettings: any = null

export function initSettingsManager() {
  ipcMain.handle('settings:get', () => {
    return readSettings()
  })

  ipcMain.on('settings:set', (_event, newSettings: any) => {
    const merged = JSON.parse(JSON.stringify(defaultSettings))
    for (const key in newSettings) {
      if (newSettings[key] !== null && newSettings[key] !== undefined && typeof newSettings[key] === 'object' && !Array.isArray(newSettings[key])) {
        merged[key] = { ...(merged[key] || {}), ...newSettings[key] }
      } else if (newSettings[key] !== undefined) {
        merged[key] = newSettings[key]
      }
    }
    cachedSettings = merged
    writeSettings(merged)
    broadcastSettings(merged)
  })

  ipcMain.on('settings:update', (_event, partial: any) => {
    const current = readSettings()
    const merged = { ...current }
    for (const key in partial) {
      if (partial[key] !== null && partial[key] !== undefined && typeof partial[key] === 'object' && !Array.isArray(partial[key])) {
        merged[key] = { ...(merged[key] || {}), ...partial[key] }
      } else if (partial[key] !== undefined) {
        merged[key] = partial[key]
      }
    }
    cachedSettings = merged
    writeSettings(merged)
    broadcastSettings(merged)
  })

  ipcMain.handle('settings:reset', () => {
    const defaults = JSON.parse(JSON.stringify(defaultSettings))
    cachedSettings = defaults
    writeSettings(defaults)
    broadcastSettings(defaults)
    return defaults
  })

  ipcMain.handle('settings:export', () => {
    const data = readSettings()
    return JSON.stringify({ _v: 1, data }, null, 2)
  })

  ipcMain.handle('settings:import', (_event, json: string) => {
    try {
      const parsed = JSON.parse(json)
      const data = parsed._v !== undefined ? parsed.data : parsed
      const current = readSettings()
      const merged = { ...current }
      for (const key in data) {
        if (data[key] !== null && data[key] !== undefined && typeof data[key] === 'object' && !Array.isArray(data[key])) {
          merged[key] = { ...(merged[key] || {}), ...data[key] }
        } else if (data[key] !== undefined) {
          merged[key] = data[key]
        }
      }
      cachedSettings = merged
      writeSettings(merged)
      broadcastSettings(merged)
      return true
    } catch {
      return false
    }
  })
}

function readSettings(): any {
  if (cachedSettings) return cachedSettings
  try {
    const filePath = getSettingsPath()
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (parsed._v !== undefined) {
        cachedSettings = parsed.data
      } else {
        cachedSettings = parsed
      }
      return cachedSettings
    }
  } catch (e) {
    console.warn('[Settings] Read failed:', e)
  }
  cachedSettings = JSON.parse(JSON.stringify(defaultSettings))
  return cachedSettings
}

function writeSettings(data: any): void {
  try {
    const filePath = getSettingsPath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const payload = { _v: 1, data }
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8')
  } catch (e) {
    console.error('[Settings] Write failed:', e)
  }
}

function broadcastSettings(settingsData: any): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('settings:changed', settingsData)
    }
  }
}
