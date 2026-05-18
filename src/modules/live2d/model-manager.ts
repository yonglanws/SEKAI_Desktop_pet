import type { AppSettings } from '@/types'
import { settings } from '@/modules/settings'

function resolveModelPath(raw: string): string {
  if (raw.startsWith('builtin:///')) return raw
  if (raw.startsWith('model:///')) return raw.replace('model:///', 'builtin:///')
  return `builtin:///${raw.replace(/^\//, '')}`
}

async function loadModelSettingsObject(modelPath: string) {
  const resolved = resolveModelPath(modelPath)
  const response = await fetch(resolved)
  if (!response.ok) throw new Error(`Failed to load model settings: ${response.status}`)
  const json = await response.json()
  json.url = resolved
  return json
}

async function ensureCubismRuntime() {
  if ((window as any).Live2DCubismCore) return
  const api = (window as any).electronAPI
  const cubismPath = api ? await api.getCubismRuntimePath() : null
  const src = cubismPath || '/runtime/live2dcubismcore.min.js'
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load Cubism runtime from ${src}`))
    document.head.appendChild(script)
  })
}

export class Live2DManager {
  private app: any = null
  private model: any = null
  private container: HTMLElement | null = null
  private isReady = false
  private lastError: string | null = null
  private clickHandler: ((e: MouseEvent) => void) | null = null
  private armTrackingHandler: (() => void) | null = null
  private armParamCache: Map<string, any> = new Map()
  private live2dModule: any = null
  private visibilityHandler: (() => void) | null = null
  private savedMaxFPS: number = 0

  async init(container: HTMLElement): Promise<void> {
    if (this.isReady && this.app) return

    this.container = container
    this.lastError = null

    try {
      await ensureCubismRuntime()
      const pixiModule = await import('pixi.js')
      const live2dModule = await import('untitled-pixi-live2d-engine/cubism')
      const { Application, extensions } = pixiModule
      const { Live2DModel, Live2DPlugin, configureCubismSDK } = live2dModule

      configureCubismSDK({ memorySizeMB: settings.live2d.cubismMemoryMB })
      extensions.add(Live2DPlugin)
      this.app = new Application()

      const containerWidth = container.clientWidth || 400
      const containerHeight = container.clientHeight || 600

      await this.app.init({
        backgroundAlpha: 0,
        background: '#00000000',
        preference: 'webgl',
        autoDensity: false,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        antialias: true,
        width: containerWidth,
        height: containerHeight,
      })

      const canvas = this.app.canvas as HTMLCanvasElement
      if (canvas) {
        canvas.style.display = 'block'
        container.appendChild(canvas)
      }

      this.live2dModule = live2dModule

      this.isReady = true

      const targetFPS = settings.performance.targetFPS
      if (targetFPS > 0 && this.app.ticker) {
        this.app.ticker.maxFPS = targetFPS
      }
      this.setupVisibilityHandling()

      await this.loadModel(settings.live2d.selectedModel)
    } catch (err: any) {
      console.error('[Live2D] Init failed:', err)
      this.lastError = err?.message || String(err)
    }
  }

  private setupVisibilityHandling() {
    if (!settings.performance.reduceWhenHidden) return
    this.visibilityHandler = () => {
      if (!this.app?.ticker) return
      if (document.hidden) {
        this.savedMaxFPS = this.app.ticker.maxFPS
        this.app.ticker.stop()
      } else {
        this.app.ticker.start()
        this.app.ticker.maxFPS = this.savedMaxFPS || settings.performance.targetFPS
      }
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  private cleanupVisibility() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
  }

  private fitModelToScreen() {
    if (!this.model || !this.app) return
    const baseScale = Math.min(this.app.screen.width / 400, this.app.screen.height / 600, 1.0)
    const fitScale = 0.12 * baseScale
    const userScale = settings.live2d.modelScale
    this.model.scale.set(fitScale * userScale, fitScale * userScale)
    this.model.anchor.set(0.5, 0.5)
    this.model.position.set(this.app.screen.width / 2, this.app.screen.height / 2)
  }

  async loadModel(modelPath: string): Promise<void> {
    if (!this.app) throw new Error('Live2DManager not initialized')

    if (this.model) {
      if (this.cleanupArmTracking) this.cleanupArmTracking()
      this.app.stage.removeChild(this.model)
      try { this.model.destroy?.() } catch (_) {}
      this.model = null
      this.knownMotionGroups = []
      this.failedMotions = new Set()
    }

    const resolvedPath = resolveModelPath(modelPath)

    try {
      const Live2DModel = this.live2dModule?.Live2DModel
      if (!Live2DModel) throw new Error('Live2D module not loaded')
      const textureLOD = settings.live2d.textureLOD
      const lodValue = textureLOD === 'false' ? false : (textureLOD as any)
      const modelSettings = await loadModelSettingsObject(modelPath)

      const configGroups = Object.keys(modelSettings?.FileReferences?.Motions || {})
      this.knownMotionGroups = configGroups
      this.failedMotions = new Set()

      this.model = await Live2DModel.from(modelSettings, { textureOptions: { lod: lodValue } })

      if (!this.model || !this.app) throw new Error('模型对象为空')

      this.fitModelToScreen()
      this.app.stage.addChild(this.model)
      this.setupModelInteraction()
      if (this.setupArmTracking) this.setupArmTracking()
      this.lastError = null

      setTimeout(() => {
        this.playMotionCombo([], ['smile'])
        setTimeout(() => this.playInteractionMotion(), 200)
      }, 300)
    } catch (error: any) {
      this.lastError = error?.message || String(error)
      console.error('[Live2D] FAIL:', this.lastError, error)
      throw error
    }
  }

  private setupModelInteraction() {
    if (!this.model || !this.app) return
    this.cleanupInteraction()
    const canvas = this.app?.canvas as HTMLCanvasElement
    if (!canvas) return

    this.clickHandler = (_e: MouseEvent) => {
      if (!this.model || !settings.interaction.clickResponse) return
      this.playMotionCombo(['blushed', 'shy', 'nod', 'pose'], ['smile', 'blushed', 'wink'])
    }

    canvas.addEventListener('click', this.clickHandler)
  }

  private cleanupInteraction() {
    const canvas = this.app?.canvas as HTMLCanvasElement
    if (this.clickHandler && canvas) {
      canvas.removeEventListener('click', this.clickHandler)
      this.clickHandler = null
    }
  }

  private setupArmTracking() {
    if (!this.model) return
    this.cleanupArmTracking()
    this.armParamCache.clear()

    const internalModel = (this.model as any)?.internalModel
    if (!internalModel) return

    const idManager = internalModel.idManager
    if (!idManager) return

    const armParamNames = ['ParamArmRA', 'ParamArmLA', 'ParamArmRB', 'ParamArmLB', 'ParamHandR', 'ParamHandL']
    for (const name of armParamNames) {
      const id = idManager.getId(name)
      if (id) this.armParamCache.set(name, id)
    }

    this.armTrackingHandler = () => {
      const fc = (this.model as any)?.internalModel?.focusController
      const coreModel = (this.model as any)?.internalModel?.coreModel
      if (!fc || !coreModel) return

      const x = fc.x
      const y = fc.y

      const idArmRA = this.armParamCache.get('ParamArmRA')
      if (idArmRA) coreModel.addParameterValueById(idArmRA, x * 10)

      const idArmLA = this.armParamCache.get('ParamArmLA')
      if (idArmLA) coreModel.addParameterValueById(idArmLA, -x * 10)

      const idArmRB = this.armParamCache.get('ParamArmRB')
      if (idArmRB) coreModel.addParameterValueById(idArmRB, y * 5)

      const idArmLB = this.armParamCache.get('ParamArmLB')
      if (idArmLB) coreModel.addParameterValueById(idArmLB, y * 5)

      const idHandR = this.armParamCache.get('ParamHandR')
      if (idHandR) coreModel.addParameterValueById(idHandR, Math.max(0, x) * 0.3)

      const idHandL = this.armParamCache.get('ParamHandL')
      if (idHandL) coreModel.addParameterValueById(idHandL, Math.max(0, -x) * 0.3)
    }

    internalModel.on('beforeModelUpdate', this.armTrackingHandler)
  }

  private cleanupArmTracking() {
    if (this.armTrackingHandler) {
      const internalModel = (this.model as any)?.internalModel
      if (internalModel) internalModel.off('beforeModelUpdate', this.armTrackingHandler)
      this.armTrackingHandler = null
    }
    this.armParamCache.clear()
  }

  playMotion(group: string, index: number): void {
    if (this.failedMotions.has(group)) return
    this.model?.motion(group, index, 3)?.then((ok: boolean) => {
      if (!ok) this.failedMotions.add(group)
    }).catch(() => { this.failedMotions.add(group) })
  }
  playExpression(id: string): void { this.model?.expression(id) }
  playParallelMotion(motions: Array<{ group: string; index: number }>): void {
    this.model?.parallelMotion(motions)?.catch((err: any) => {
      console.warn('[Live2D] parallelMotion failed:', err)
      for (const m of motions) this.failedMotions.add(m.group)
    })
  }

  playInteractionMotion(): void {
    this.playMotionCombo(['glad', 'nod', 'greeting'], ['smile'])
  }

  private knownMotionGroups: string[] = []
  private failedMotions: Set<string> = new Set()

  private getAllMotionGroups(): string[] {
    if (this.knownMotionGroups.length > 0) return this.knownMotionGroups
    const m = this.model as any
    const motions = m?.settings?.motions || m?.internalModel?.settings?.motions || {}
    this.knownMotionGroups = Object.keys(motions)
    return this.knownMotionGroups
  }

  private pickOne(keywords: string[], pool: string[]): string | null {
    if (pool.length === 0) return null
    for (const kw of keywords) {
      const matches = pool.filter(g => g.toLowerCase().includes(kw.toLowerCase()))
      if (matches.length > 0) {
        return matches[Math.floor(Math.random() * matches.length)]
      }
    }
    return null
  }

  private playMotionCombo(bodyKeywords: string[], faceKeywords: string[]): void {
    const all = this.getAllMotionGroups().filter(g => !this.failedMotions.has(g))
    if (all.length === 0) return

    const bodyGroup = bodyKeywords.length > 0 ? this.pickOne(bodyKeywords, all) : null
    const faceGroup = faceKeywords.length > 0 ? this.pickOne(faceKeywords, all) : null

    const motions: Array<{ group: string; index: number }> = []
    if (bodyGroup) motions.push({ group: bodyGroup, index: 0 })
    if (faceGroup && faceGroup !== bodyGroup) motions.push({ group: faceGroup, index: 0 })

    if (motions.length === 0) return

    if (motions.length === 1) {
      this.playMotion(motions[0].group, motions[0].index)
    } else {
      this.playParallelMotion(motions)
    }
  }

  parseAndPlayMotions(text: string): string {
    const motionRegex = /\[动作:([^\]]+)\]/g

    const keywordMap: Record<string, { body: string[]; face: string[] }> = {
      smile: { body: ['glad', 'nod', 'pose'], face: ['smile', 'happy'] },
      angry: { body: ['angry', 'pose', 'shake'], face: ['angry', 'coldeyes'] },
      sad: { body: ['sad', 'pose'], face: ['sad', 'cry'] },
      cry: { body: ['sad'], face: ['cry'] },
      shy: { body: ['shy', 'blushed', 'pose'], face: ['shy', 'blushed'] },
      surprise: { body: ['forward', 'surprise', 'pose'], face: ['surprise', 'notice'] },
      serious: { body: ['think', 'pose'], face: ['serious', 'coldeyes'] },
      sleepy: { body: ['sleep', 'pose'], face: ['sleepy'] },
      wink: { body: ['pose'], face: ['wink'] },
      trouble: { body: ['trouble', 'pose'], face: ['trouble', 'worry'] },
      nod: { body: ['nod'], face: ['smile'] },
      shakehead: { body: ['shakehead', 'shakehand', 'shake'], face: ['sad'] },
      tilthead: { body: ['tilthead'], face: ['wink'] },
      glad: { body: ['glad', 'nod'], face: ['smile'] },
      think: { body: ['think', 'tilthead'], face: ['serious'] },
      delicious: { body: ['delicious', 'pose'], face: ['smile'] },
      greeting: { body: ['greeting', 'wandahoi', 'nod'], face: ['smile'] },
      sleep: { body: ['sleep'], face: ['sleepy'] },
      blushed: { body: ['blushed', 'shy'], face: ['blushed', 'shy'] },
      pose: { body: ['pose', 'nod'], face: ['smile'] },
    }

    const match = motionRegex.exec(text)
    if (match) {
      const name = match[1].trim().toLowerCase()
      const mapping = keywordMap[name]
      if (mapping) {
        this.playMotionCombo(mapping.body, mapping.face)
      }
    }

    return text.replace(motionRegex, '').trim()
  }

  playMotionForMessage(text: string): void {
    if (/\[动作:/.test(text)) return
    const t = text.toLowerCase()

    let body: string[], face: string[]
    if (/开心|高兴|快乐|太好了|好耶|嘻嘻|哈哈|棒|厉害|真好|喜欢|可爱/.test(t)) { body = ['glad', 'nod']; face = ['smile'] }
    else if (/生气|愤怒|讨厌|烦|气死/.test(t)) { body = ['angry', 'shake']; face = ['angry'] }
    else if (/难过|伤心|哭|抱歉|对不起/.test(t)) { body = ['sad']; face = ['sad', 'cry'] }
    else if (/害羞|脸红|不好意思/.test(t)) { body = ['shy', 'blushed']; face = ['shy', 'blushed'] }
    else if (/惊讶|什么|真的吗/.test(t)) { body = ['forward', 'surprise']; face = ['surprise', 'notice'] }
    else if (/思考|想想|也许/.test(t)) { body = ['think', 'tilthead']; face = ['serious'] }
    else if (/点头|好的|可以|对/.test(t)) { body = ['nod']; face = ['smile'] }
    else if (/摇头|不行|不要/.test(t)) { body = ['shakehand', 'shakehead']; face = ['sad'] }
    else if (/你好|嗨|再见/.test(t)) { body = ['greeting', 'wandahoi']; face = ['smile'] }
    else { body = ['tilthead', 'nod']; face = ['smile'] }

    this.playMotionCombo(body, face)
  }
  async playLastFrame(motions: Array<{ group: string; index: number }>): Promise<void> { await this.model?.parallelLastFrame(motions) }
  async speak(audioUrl: string): Promise<void> { this.model?.speak(audioUrl) }
  focus(x: number, y: number): void { this.model?.focus(x, y) }
  resetFocus(): void {
    const fc = (this.model as any)?.internalModel?.focusController
    if (fc) fc.focus(0, 0)
  }

  setScale(scale: number): void {
    settings.live2d.modelScale = scale
    this.fitModelToScreen()
  }

  destroy(): void {
    this.cleanupVisibility()
    this.cleanupInteraction()
    if (this.cleanupArmTracking) this.cleanupArmTracking()
    if (this.model) { try { this.model.destroy?.() } catch (_) {}; this.model = null }
    if (this.app) { this.app.destroy(true); this.app = null }
    this.isReady = false
    this.container = null
    this.live2dModule = null
  }
}

export const live2dManager = new Live2DManager()
