export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface AIConfig {
  apiEndpoint: string
  apiKey: string
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
}

export interface Live2DModelConfig {
  name: string
  path: string
  thumbnail: string
  description: string
}

export interface TTSConfig {
  enabled: boolean
  apiEndpoint: string
  gptWeightsPath: string
  sovitsWeightsPath: string
  textLang: string
  refAudioPath: string
  promptText: string
  promptLang: string
  topK: number
  topP: number
  temperature: number
  speedFactor: number
  textSplitMethod: string
  mediaType: string
  streamingMode: number
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  language: string
  live2d: {
    selectedModel: string
    modelScale: number
    enableLipSync: boolean
    enableBreath: boolean
    enableEyeBlink: boolean
    mouseTrackingSensitivity: number
    autoIdleMotion: boolean
    textureLOD: 'full' | 'single-auto' | 'false'
    highPrecisionMask: boolean
    cubismMemoryMB: number
    customModelDir: string
  }
  ai: AIConfig
  tts: TTSConfig
  interaction: {
    hoverFeedback: boolean
    clickResponse: boolean
    dragEnabled: boolean
    doubleClickAction: 'motion' | 'expression' | 'none'
  }
  performance: {
    targetFPS: number
    reduceWhenHidden: boolean
    minimizeToTray: boolean
  }
}

export const defaultSettings: AppSettings = {
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
  tts: {
    enabled: false,
    apiEndpoint: 'http://127.0.0.1:9880',
    gptWeightsPath: '',
    sovitsWeightsPath: '',
    textLang: 'zh',
    refAudioPath: '',
    promptText: '',
    promptLang: 'zh',
    topK: 5,
    topP: 1,
    temperature: 1,
    speedFactor: 1.0,
    textSplitMethod: 'cut5',
    mediaType: 'wav',
    streamingMode: 0,
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

export interface ElectronAPI {
  windowMove: (deltaX: number, deltaY: number) => void
  windowMinimize: () => void
  windowClose: () => void
  windowToggleTop: () => void
  windowIsTop: () => Promise<boolean>
  openSettings: () => void
  resizeWindow: (width: number, height: number) => void

  settingsGet: () => Promise<any>
  settingsSet: (data: any) => void
  settingsUpdate: (partial: any) => void
  settingsReset: () => Promise<any>
  settingsExport: () => Promise<string>
  settingsImport: (json: string) => Promise<boolean>

  onSettingsChanged: (callback: (data: any) => void) => () => void

  requestReloadModel: () => Promise<{ ok: boolean; error?: string }>
  onReloadModelRequest: (callback: (requestId: string) => void) => () => void
  sendReloadModelResult: (requestId: string, result: { ok: boolean; error?: string }) => void

  getCubismRuntimePath: () => Promise<string | null>

  modelsGetPath: () => Promise<string>
  modelsList: () => Promise<Array<{ name: string; path: string }>>
  modelsListBuiltin: () => Promise<Array<{ name: string; builtinPath: string }>>
  modelsOpenDir: () => void
  modelsListMotions: (modelPath: string) => Promise<string[]>
  modelsVerifyMotions: (modelPath: string, fileReferencesJson: string) => Promise<string[]>

  downloaderFetchList: () => Promise<{ ok: boolean; data?: any[]; error?: string }>
  downloaderChooseDir: (defaultPath?: string) => Promise<{ ok: boolean; path?: string }>
  downloaderStart: (args: { models: any[]; saveRoot: string; concurrency?: number }) =>
    Promise<{ ok: boolean; taskIds?: string[]; error?: string }>
  downloaderCancel: (taskId: string) => Promise<{ ok: boolean }>
  downloaderCancelAll: () => Promise<{ ok: boolean }>
  downloaderScanLocal: (dir: string) => Promise<{
    ok: boolean
    data?: Array<{ name: string; modelBase: string; path: string; localPath: string }>
  }>
  downloaderDeleteModel: (localPath: string) => Promise<{ ok: boolean; error?: string }>
  onDownloaderProgress: (callback: (data: any) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
