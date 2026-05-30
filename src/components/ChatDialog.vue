<template>
  <div class="chat-dialog">
    <div class="chat-body" :class="{ hidden: isChatCollapsed }">
      <div ref="chatArea" class="chat-area" @wheel.stop>
        <TransitionGroup name="msg">
          <div
            v-for="msg in messageStore.messages"
            :key="msg.id"
            :class="['message', msg.role]"
          >
            <div class="msg-avatar">
              <svg v-if="msg.role === 'user'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 6-7 8-7s8 3 8 7"/></svg>
              <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <div class="msg-bubble">
              <div class="msg-content">
                {{ msg.content }}<span v-if="msg.id === messageStore.streamingMsgId" class="streaming-cursor"></span>
              </div>
              <div class="msg-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </div>
          <div v-if="messageStore.isLoading && !messageStore.streamingMsgId" key="loading" class="message assistant loading">
            <div class="msg-avatar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <div class="msg-bubble">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
    <div class="input-area" @mousedown.stop>
      <button
        class="icon-btn"
        :class="{ pinned: isTop }"
        @click.stop="toggleCollapse"
        :title="isChatCollapsed ? '展开对话' : '折叠对话'"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path v-if="isChatCollapsed" d="M5 15l7-7 7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path v-else d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button
        class="icon-btn"
        :class="{ pinned: isTop }"
        @click.stop="emit('toggleTop')"
        :title="isTop ? '取消置顶' : '窗口置顶'"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path v-if="isTop" d="M16 9V4h1V2H7v2h1v5l-2 6v2h5.5v5l1.5-2.5 1.5 2.5v-5H20v-2l-2-6z" fill="currentColor"/>
          <path v-else d="M16 9V4h1V2H7v2h1v5l-2 6v2h12v-2l-2-6zM12 19c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1z" fill="currentColor"/>
        </svg>
      </button>
      <div class="input-wrapper">
        <textarea
          v-model="inputText"
          class="chat-input"
          placeholder="说点什么..."
          rows="1"
          @keydown.enter.prevent="handleSend"
          @input="autoResize"
          ref="inputRef"
        />
      </div>
      <button class="icon-btn" @click.stop="emit('openSettings')" title="设置">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="icon-btn send-btn" :disabled="!canSend" @click="handleSend">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { messageStore, aiService } from '@/modules/chat'
import { settings } from '@/modules/settings'

const props = defineProps<{
  isTop: boolean
}>()

const emit = defineEmits<{
  collapsed: [val: boolean]
  openSettings: []
  toggleTop: []
}>()

const inputText = ref('')
const isChatCollapsed = ref(true)
const inputRef = ref<HTMLTextAreaElement>()
const chatArea = ref<HTMLElement>()

const canSend = computed(() => inputText.value.trim().length > 0 && !messageStore.isLoading)

watch(() => messageStore.messages.length, () => {
  nextTick(() => {
    chatArea.value?.scrollTo({ top: chatArea.value.scrollHeight, behavior: 'smooth' })
  })
})

watch(() => {
  const msgs = messageStore.messages
  return msgs.length > 0 ? msgs[msgs.length - 1].content : ''
}, () => {
  if (messageStore.streamingMsgId) {
    nextTick(() => {
      chatArea.value?.scrollTo({ top: chatArea.value.scrollHeight, behavior: 'smooth' })
    })
  }
})

function toggleCollapse() {
  isChatCollapsed.value = !isChatCollapsed.value
  emit('collapsed', isChatCollapsed.value)
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || messageStore.isLoading) return

  inputText.value = ''
  autoResize()

  if (isChatCollapsed.value) {
    isChatCollapsed.value = false
    emit('collapsed', false)
  }

  try {
    const { live2dManager } = await import('@/modules/live2d')
    live2dManager.playInteractionMotion()
  } catch (_) { }

  await aiService.sendMessage(text, settings.ai)
}

function autoResize() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 80) + 'px'
}

function formatTime(ts?: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.chat-dialog {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.chat-body {
  overflow: hidden;
  max-height: 280px;
  transition:
    max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
}

.chat-body.hidden {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.chat-area {
  height: 100%;
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}
.chat-area::-webkit-scrollbar { width: 4px; }
.chat-area::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}
.chat-area::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}
.chat-area::-webkit-scrollbar-thumb:hover {
  background: var(--chat-scrollbar-hover);
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  animation: msgSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  max-width: 100%;
}
.message.user { flex-direction: row-reverse; }
.message.assistant { flex-direction: row; }

.msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  opacity: 0.85;
  transition: transform 0.2s ease;
}
.message:hover .msg-avatar {
  transform: scale(1.05);
}

.message.user .msg-avatar {
  background: var(--chat-user-avatar-bg);
  color: var(--accent);
  box-shadow: var(--chat-user-avatar-glow);
}

.message.assistant .msg-avatar {
  background: var(--chat-assistant-avatar-bg);
  color: var(--text-secondary);
}

.msg-bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 20px;
  word-break: break-word;
  position: relative;
  line-height: 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.message:hover .msg-bubble {
  transform: translateY(-1px);
}

.message.user .msg-bubble {
  background: var(--chat-user-bubble);
  border: 1px solid var(--chat-user-border);
  border-bottom-right-radius: 6px;
  box-shadow: var(--chat-user-shadow);
}

.message.assistant .msg-bubble {
  background: var(--chat-assistant-bubble);
  border: 1px solid var(--chat-assistant-border);
  border-bottom-left-radius: 6px;
  box-shadow: var(--chat-assistant-shadow);
}

.msg-content {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing);
}

.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--accent);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: cursorBlink 0.8s step-end infinite;
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.msg-time {
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0.6;
  margin-top: 6px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.message.user .msg-time {
  text-align: left;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  flex-shrink: 0;
  border-top: 1px solid var(--chat-input-area-border);
  background: var(--chat-input-area-bg);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.55;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-btn:hover {
  opacity: 1;
  background: var(--chat-btn-hover-bg);
  color: var(--accent);
}
.icon-btn:active {
  transform: scale(0.92);
}
.icon-btn.pinned {
  opacity: 1;
  color: var(--accent);
  background: var(--chat-pin-active-bg);
}
.icon-btn.send-btn {
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: #fff;
  opacity: 1;
  box-shadow: var(--send-btn-shadow);
}
.icon-btn.send-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
  box-shadow: none;
  filter: grayscale(0.4);
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
}
.icon-btn.send-btn:not(:disabled):hover {
  transform: scale(1.08);
  box-shadow: var(--send-btn-shadow-hover);
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: #fff;
}
.icon-btn.send-btn:not(:disabled):active {
  transform: scale(0.92);
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.chat-input {
  width: 100%;
  min-height: 36px;
  max-height: 80px;
  padding: 8px 14px;
  font-size: var(--font-size-sm);
  line-height: 1.5;
  border-radius: 12px;
  background: var(--chat-input-bg);
  border: 1px solid var(--chat-input-border);
  color: var(--text-primary);
  resize: none;
  outline: none;
  transition: all 0.25s ease;
  box-sizing: border-box;
}
.chat-input:hover {
  border-color: var(--chat-input-hover-border);
  background: var(--chat-input-hover-bg);
}
.chat-input:focus {
  border-color: var(--chat-input-focus-border);
  background: var(--chat-input-focus-bg);
  box-shadow: var(--chat-input-focus-shadow);
}
.chat-input::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 6px 4px;
  align-items: center;
}
.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.4;
  animation: typingWave 1.15s infinite ease-in-out;
  will-change: transform, opacity;
}
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.12s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.24s; }

@keyframes typingWave {
  0%, 55%, 100% { transform: translateY(0); opacity: 0.35; }
  25% { transform: translateY(-5px); opacity: 0.9; }
}

@keyframes msgSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.msg-enter-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.msg-leave-active {
  transition: all 0.16s ease-in;
  position: absolute;
}
.msg-enter-from,
.msg-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
