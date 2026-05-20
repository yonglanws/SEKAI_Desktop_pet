/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'untitled-pixi-live2d-engine' {
  export class Live2DModel {
    static from(source: string | object, options?: any): Promise<Live2DModel>
    anchor: { set(x: number, y: number): void }
    position: { set(x: number, y: number): void }
    scale: { set(x: number, y: number): void }
    motion(group: string, index: number, options?: any): void
    expression(id: string): void
    speak(audioUrl: string): void
    parallelMotion(motions: Array<{ group: string; index: number }>): void
    parallelLastFrame(motions: Array<{ group: string; index: number }>): Promise<void>
    motionLastFrame(group: string, index: number): Promise<void>
    on(event: string, callback: Function): void
    internalModel: any
    x: number
    y: number
    width: number
    height: number
    focus(x: number, y: number, instant?: boolean): void
    tap(x: number, y: number): void
    destroy(): void
  }

  export class Live2DPlugin {
    static type: string
  }

  export function configureCubismSDK(options: { memorySizeMB?: number }): void
}

declare module 'untitled-pixi-live2d-engine/cubism' {
  export { Live2DModel } from 'untitled-pixi-live2d-engine'
}

declare module 'untitled-pixi-live2d-engine/cubism-legacy' {
  export { Live2DModel } from 'untitled-pixi-live2d-engine'
}

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
  }
  ai: AIConfig
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
    selectedModel: '',
    modelScale: 1.0,
    enableLipSync: true,
    enableBreath: true,
    enableEyeBlink: true,
    mouseTrackingSensitivity: 0.5,
    autoIdleMotion: false,
    textureLOD: 'single-auto',
    highPrecisionMask: true,
    cubismMemoryMB: 32,
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

export interface ElectronAPI {
  setIgnoreMouseEvents: (ignore: boolean) => void
  windowMove: (deltaX: number, deltaY: number) => void
  windowDragStart: () => void
  windowMoveTo: (dx: number, dy: number) => void
  windowMinimize: () => void
  windowClose: () => void
  windowToggleTop: () => void
  windowIsTop: () => Promise<boolean>
  openSettings: () => void
  resizeWindow: (width: number, height: number) => void
  _getSize: () => [number, number] | null

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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
