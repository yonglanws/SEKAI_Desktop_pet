import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.send('set-ignore-mouse-events', ignore),
  windowMove: (deltaX: number, deltaY: number) =>
    ipcRenderer.send('window-move', { deltaX, deltaY }),
  windowDragStart: () => ipcRenderer.send('window-drag-start'),
  windowMoveTo: (dx: number, dy: number) =>
    ipcRenderer.send('window-move-to', { dx, dy }),
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowToggleTop: () => ipcRenderer.send('window-toggle-top'),
  windowIsTop: () => ipcRenderer.invoke('window-is-top'),
  openSettings: () => ipcRenderer.send('open-settings'),
  resizeWindow: (width: number, height: number) =>
    ipcRenderer.send('resize-window', { width, height }),
  _getSize: (): [number, number] | null => {
    try {
      return [(globalThis as any).window?.innerWidth || 400, (globalThis as any).window?.innerHeight || 680]
    } catch {
      return null
    }
  },

  settingsGet: () => ipcRenderer.invoke('settings:get'),
  settingsSet: (data: any) => ipcRenderer.send('settings:set', data),
  settingsUpdate: (partial: any) => ipcRenderer.send('settings:update', partial),
  settingsReset: () => ipcRenderer.invoke('settings:reset'),
  settingsExport: () => ipcRenderer.invoke('settings:export'),
  settingsImport: (json: string) => ipcRenderer.invoke('settings:import', json),

  onSettingsChanged: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('settings:changed', handler)
    return () => ipcRenderer.removeListener('settings:changed', handler)
  },

  requestReloadModel: () => ipcRenderer.invoke('reload-model'),

  onReloadModelRequest: (callback: (requestId: string) => void) => {
    const handler = (_event: any, data: any) => callback(data.requestId)
    ipcRenderer.on('reload-model-request', handler)
    return () => ipcRenderer.removeListener('reload-model-request', handler)
  },

  sendReloadModelResult: (requestId: string, result: { ok: boolean; error?: string }) => {
    ipcRenderer.send('reload-model-result', { requestId, ...result })
  },

  getCubismRuntimePath: () => ipcRenderer.invoke('runtime:get-cubism-core'),

  modelsGetPath: () => ipcRenderer.invoke('models:get-path'),
  modelsList: () => ipcRenderer.invoke('models:list'),
  modelsListBuiltin: () => ipcRenderer.invoke('models:list-builtin'),
  modelsOpenDir: () => ipcRenderer.send('models:open-dir'),
  modelsListMotions: (modelPath: string) => ipcRenderer.invoke('models:list-motions', modelPath),
  modelsVerifyMotions: (modelPath: string, fileReferencesJson: string) => ipcRenderer.invoke('models:verify-motions', modelPath, fileReferencesJson),
})
