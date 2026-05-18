import { reactive } from 'vue'
import type { ChatMessage, AIConfig } from '@/types'

const MOTION_TAG_REGEX = /\[动作:[^\]]+\]/g

export class MessageStore {
  messages: ChatMessage[] = reactive([])
  isLoading = false
  streamingMsgId: string | null = null
  private streamingRawContent = ''

  addMessage(role: ChatMessage['role'], content: string): ChatMessage {
    const msg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      role,
      content,
      timestamp: Date.now(),
    }
    this.messages.push(msg)
    return msg
  }

  addStreamingMessage(role: ChatMessage['role']): ChatMessage {
    const msg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      role,
      content: '',
      timestamp: Date.now(),
    }
    this.messages.push(msg)
    this.streamingMsgId = msg.id
    this.streamingRawContent = ''
    return msg
  }

  appendToStreamingMessage(chunk: string): void {
    if (!this.streamingMsgId) return
    const msg = this.messages.find(m => m.id === this.streamingMsgId)
    if (!msg) return
    this.streamingRawContent += chunk
    msg.content = this.streamingRawContent.replace(MOTION_TAG_REGEX, '')
  }

  finalizeStreamingMessage(content: string): void {
    if (!this.streamingMsgId) return
    const msg = this.messages.find(m => m.id === this.streamingMsgId)
    if (msg) msg.content = content
    this.streamingMsgId = null
    this.streamingRawContent = ''
  }

  clearMessages(): void {
    this.messages.splice(0, this.messages.length)
    this.streamingMsgId = null
    this.streamingRawContent = ''
  }

  getHistoryForAI(): Array<{ role: string; content: string }> {
    return this.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }))
  }

  setLoading(val: boolean): void {
    this.isLoading = val
  }
}

export const messageStore = new MessageStore()
