import type { AIConfig } from '@/types'
import type { TTSConfig } from '@/types'
import { messageStore } from './message-store'

function normalizeEndpoint(url: string): string {
  let ep = url.trim()
  if (!ep) return ''
  if (!ep.startsWith('http://') && !ep.startsWith('https://')) {
    ep = 'https://' + ep
  }
  try {
    const u = new URL(ep)
    let path = u.pathname.replace(/\/+$/, '')
    if (path === '' || path === '/v1' || path === '/v1/') {
      path = '/v1/chat/completions'
    } else if (path.endsWith('/chat/completion')) {
      path = path.replace(/\/chat\/completion$/, '/chat/completions')
    } else if (!path.endsWith('/chat/completions') && !path.includes('/completions')) {
      path = path.replace(/\/+$/, '') + '/chat/completions'
    }
    return `${u.origin}${path}`
  } catch {
    return url
  }
}

const MOTION_INSTRUCTION = `\n\n你是一个性格开朗活泼的桌宠！每次回复只在开头使用一个[动作:xxx]来表现心情，不要重复使用多个动作标签。可用动作：
[动作:smile]微笑 [动作:glad]开心 [动作:nod]点头 [动作:wink]眨眼 [动作:surprise]惊喜 [动作:shy]害羞 [动作:tilthead]歪头 [动作:think]思考 [动作:blushed]脸红 [动作:delicious]好吃 [动作:greeting]打招呼 [动作:sleepy]困 [动作:pose]摆姿势
示例：[动作:smile]今天天气真好呢！我们一起出去玩吧！`

export class AIService {
  private abortController: AbortController | null = null

  async sendMessage(content: string, config: AIConfig, ttsConfig?: TTSConfig): Promise<string> {
    messageStore.addMessage('user', content)
    messageStore.setLoading(true)

    const endpoint = normalizeEndpoint(config.apiEndpoint)

    if (!endpoint) {
      const errMsg = '请求失败: 未配置 API 端点，请在设置中填写'
      messageStore.addMessage('assistant', errMsg)
      messageStore.setLoading(false)
      return errMsg
    }

    if (!config.apiKey || config.apiKey.trim() === '') {
      const errMsg = '请求失败: 未配置 API Key，请在设置中填写'
      messageStore.addMessage('assistant', errMsg)
      messageStore.setLoading(false)
      return errMsg
    }

    try {
      const systemContent = config.systemPrompt + MOTION_INSTRUCTION
      const messages = [
        { role: 'system', content: systemContent },
        ...messageStore.getHistoryForAI(),
      ]

      this.abortController = new AbortController()

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: true,
        }),
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`API Error ${response.status}: ${errText}`)
      }

      messageStore.addStreamingMessage('assistant')

      let rawReply = ''
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()!

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue

          try {
            const json = JSON.parse(trimmed.slice(6))
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              rawReply += delta
              messageStore.appendToStreamingMessage(delta)
            }
          } catch (_) {}
        }
      }

      if (!rawReply) rawReply = '(无回复)'

      let cleanReply = rawReply
      try {
        const { live2dManager } = await import('../live2d')
        cleanReply = live2dManager.parseAndPlayMotions(rawReply)
        if (cleanReply === rawReply) {
          live2dManager.playMotionForMessage(rawReply)
        }
      } catch (_) {}

      messageStore.finalizeStreamingMessage(cleanReply || rawReply)

      if (ttsConfig?.enabled && cleanReply) {
        try {
          const { ttsService } = await import('../tts')
          const audioUrl = await ttsService.synthesize(cleanReply, ttsConfig)
          if (audioUrl) {
            const { live2dManager } = await import('../live2d')
            live2dManager.speak(audioUrl)
          }
        } catch (ttsErr) {
          console.warn('[AI] TTS failed:', ttsErr)
        }
      }

      return cleanReply || rawReply
    } catch (error: any) {
      if (error.name === 'AbortError') {
        messageStore.finalizeStreamingMessage(
          messageStore.messages[messageStore.messages.length - 1]?.content || ''
        )
        return ''
      }
      const errMsg = `请求失败: ${error.message}`
      messageStore.finalizeStreamingMessage('')
      messageStore.addMessage('assistant', errMsg)
      return errMsg
    } finally {
      messageStore.setLoading(false)
      this.abortController = null
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}

export const aiService = new AIService()
