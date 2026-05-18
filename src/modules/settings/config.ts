import { reactive, watch } from 'vue'
import { defaultSettings, type AppSettings } from '@/types'

const STORAGE_KEY = 'sekai-desktop-pet-settings'
const SETTINGS_VERSION = 1

interface StoredData {
  _v: number
  data: AppSettings
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return clone(defaultSettings)

    const parsed = JSON.parse(raw)

    if (parsed && typeof parsed._v === 'number') {
      return migrate(parsed.data || {}, parsed._v)
    }

    if (parsed && typeof parsed === 'object' && !parsed._v) {
      return migrate(parsed, 0)
    }
  } catch (e) {
    console.warn('[Settings] Load failed:', e)
  }
  return clone(defaultSettings)
}

function migrate(data: any, fromVersion: number): AppSettings {
  const base = clone(defaultSettings)

  if (fromVersion < 1) {
    if (data.live2d?.textureLOD === undefined) {
      data.live2d = data.live2d || {}
      data.live2d.textureLOD = 'single-auto'
      data.live2d.highPrecisionMask = true
      data.live2d.cubismMemoryMB = 32
    }
    if (data.performance === undefined) {
      data.performance = { targetFPS: 30, reduceWhenHidden: true, minimizeToTray: true }
    }
    if (data.interaction === undefined) {
      data.interaction = { hoverFeedback: true, clickResponse: true, dragEnabled: true, doubleClickAction: 'motion' as const }
    }
  }

  return deepMerge(base, data)
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {} as any, source[key]!)
    } else if (source[key] !== undefined) {
      result[key] = source[key] as T[Extract<keyof T, string>]
    }
  }
  return result
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const payload: StoredData = { _v: SETTINGS_VERSION, data: { ...settings } }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (e) {
      console.warn('[Settings] Save failed:', e)
    }
    saveTimer = null
  }, 300)
}

export const settings = reactive<AppSettings>(loadSettings())

if (typeof window !== 'undefined' && (window as any).electronAPI) {
  const api = (window as any).electronAPI
  api.settingsGet().then((electronSettings: any) => {
    if (electronSettings) {
      const merged = deepMerge(clone(defaultSettings), electronSettings)
      Object.assign(settings, merged)
    }
  }).catch(() => {})
}

watch(settings, scheduleSave, { deep: true })

export function resetSettings() {
  Object.assign(settings, clone(defaultSettings))
}

export function updateSettings(partial: Partial<AppSettings>) {
  const merged = deepMerge(settings, partial)
  Object.assign(settings, merged)
}

export function exportSettings(): string {
  const payload: StoredData = { _v: SETTINGS_VERSION, data: { ...settings } }
  return JSON.stringify(payload, null, 2)
}

export function importSettings(json: string): boolean {
  try {
    const parsed = JSON.parse(json)
    const data = parsed._v !== undefined ? parsed.data : parsed
    const merged = deepMerge(clone(defaultSettings), data)
    Object.assign(settings, merged)
    return true
  } catch (e) {
    console.warn('[Settings] Import failed:', e)
    return false
  }
}
