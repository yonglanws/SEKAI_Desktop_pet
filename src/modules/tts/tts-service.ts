import type { TTSConfig } from '@/types'

function normalizeEndpoint(url: string): string {
  let ep = url.trim()
  if (!ep) return ''
  if (!ep.startsWith('http://') && !ep.startsWith('https://')) {
    ep = 'http://' + ep
  }
  return ep.replace(/\/+$/, '')
}

export class TTSService {
  private currentAudio: HTMLAudioElement | null = null

  async testConnection(config: TTSConfig): Promise<{ ok: boolean; message: string }> {
    const endpoint = normalizeEndpoint(config.apiEndpoint)
    if (!endpoint) {
      return { ok: false, message: '未配置 API 端点' }
    }
    if (!config.refAudioPath) {
      return { ok: false, message: '未配置参考音频路径' }
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${endpoint}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '你好',
          text_lang: config.textLang,
          ref_audio_path: config.refAudioPath,
          prompt_text: config.promptText || '',
          prompt_lang: config.promptLang,
          top_k: config.topK,
          top_p: config.topP,
          temperature: config.temperature,
          text_split_method: config.textSplitMethod,
          media_type: config.mediaType,
          streaming_mode: 0,
          speed_factor: config.speedFactor,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('audio')) {
          return { ok: true, message: '连接成功！服务正常运行' }
        }
        const text = await response.text()
        try {
          const json = JSON.parse(text)
          return { ok: false, message: json.message || '服务返回异常' }
        } catch {
          return { ok: true, message: '连接成功！服务正常运行' }
        }
      } else {
        let errMsg = `HTTP ${response.status}`
        try {
          const json = await response.json()
          errMsg = json.message || errMsg
        } catch {}
        return { ok: false, message: errMsg }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ok: false, message: '连接超时（10秒），请检查服务是否启动' }
      }
      return { ok: false, message: `连接失败: ${error.message}` }
    }
  }

  async switchModel(config: TTSConfig): Promise<{ ok: boolean; message: string }> {
    const endpoint = normalizeEndpoint(config.apiEndpoint)
    if (!endpoint) {
      return { ok: false, message: '未配置 API 端点' }
    }

    const results: string[] = []

    if (config.gptWeightsPath) {
      try {
        const resp = await fetch(`${endpoint}/set_gpt_weights?weights_path=${encodeURIComponent(config.gptWeightsPath)}`)
        if (resp.ok) {
          results.push('GPT 模型切换成功')
        } else {
          let msg = `GPT 模型切换失败 (HTTP ${resp.status})`
          try { const j = await resp.json(); msg = `GPT: ${j.message || msg}` } catch {}
          results.push(msg)
        }
      } catch (e: any) {
        results.push(`GPT 模型切换失败: ${e.message}`)
      }
    }

    if (config.sovitsWeightsPath) {
      try {
        const resp = await fetch(`${endpoint}/set_sovits_weights?weights_path=${encodeURIComponent(config.sovitsWeightsPath)}`)
        if (resp.ok) {
          results.push('SoVITS 模型切换成功')
        } else {
          let msg = `SoVITS 模型切换失败 (HTTP ${resp.status})`
          try { const j = await resp.json(); msg = `SoVITS: ${j.message || msg}` } catch {}
          results.push(msg)
        }
      } catch (e: any) {
        results.push(`SoVITS 模型切换失败: ${e.message}`)
      }
    }

    if (results.length === 0) {
      return { ok: false, message: '未配置任何模型路径' }
    }

    const allOk = results.every(r => r.includes('成功'))
    return { ok: allOk, message: results.join('；') }
  }

  async synthesize(text: string, config: TTSConfig): Promise<string | null> {
    if (!config.enabled) return null

    const endpoint = normalizeEndpoint(config.apiEndpoint)
    if (!endpoint || !config.refAudioPath) return null

    try {
      const response = await fetch(`${endpoint}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          text_lang: config.textLang,
          ref_audio_path: config.refAudioPath,
          prompt_text: config.promptText || '',
          prompt_lang: config.promptLang,
          top_k: config.topK,
          top_p: config.topP,
          temperature: config.temperature,
          text_split_method: config.textSplitMethod,
          media_type: config.mediaType,
          streaming_mode: config.streamingMode,
          speed_factor: config.speedFactor,
        }),
      })

      if (!response.ok) {
        let errMsg = `TTS 请求失败: HTTP ${response.status}`
        try {
          const json = await response.json()
          errMsg = `TTS 请求失败: ${json.message || errMsg}`
        } catch {}
        console.error('[TTS]', errMsg)
        return null
      }

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)
      return audioUrl
    } catch (error: any) {
      console.error('[TTS] Synthesis failed:', error.message)
      return null
    }
  }

  async speak(text: string, config: TTSConfig): Promise<boolean> {
    const audioUrl = await this.synthesize(text, config)
    if (!audioUrl) return false

    return this.playAudio(audioUrl)
  }

  playAudio(audioUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.stopAudio()

      const audio = new Audio(audioUrl)
      this.currentAudio = audio

      audio.onended = () => {
        this.cleanupAudio(audioUrl)
        resolve(true)
      }

      audio.onerror = () => {
        this.cleanupAudio(audioUrl)
        console.error('[TTS] Audio playback failed')
        resolve(false)
      }

      audio.play().catch(() => {
        this.cleanupAudio(audioUrl)
        resolve(false)
      })
    })
  }

  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.src = ''
      this.currentAudio = null
    }
  }

  private cleanupAudio(audioUrl: string): void {
    if (this.currentAudio === null || this.currentAudio.src === audioUrl) {
      this.currentAudio = null
    }
    try {
      URL.revokeObjectURL(audioUrl)
    } catch {}
  }
}

export const ttsService = new TTSService()
