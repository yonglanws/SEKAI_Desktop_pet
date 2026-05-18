<template>
  <div class="main-view">
    <div class="live2d-area">
      <Live2DCanvas ref="live2dRef" />
    </div>

    <div class="chat-panel" :class="{ collapsed: isChatCollapsed }">
      <ChatDialog
        :is-top="isTop"
        @collapsed="isChatCollapsed = $event"
        @open-settings="openSettings"
        @toggle-top="toggleWindowTop"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Live2DCanvas from '@/components/Live2DCanvas.vue'
import ChatDialog from '@/components/ChatDialog.vue'
import { settings, updateSettings } from '@/modules/settings'

const isChatCollapsed = ref(true)
const isTop = ref(false)
const live2dRef = ref<InstanceType<typeof Live2DCanvas>>()

let unsubSettings: (() => void) | null = null
let unsubReload: (() => void) | null = null

onMounted(async () => {
  const api = window.electronAPI
  if (!api) return

  try { isTop.value = await api.windowIsTop() } catch (_) { }

  unsubSettings = api.onSettingsChanged((data: any) => {
    try {
      updateSettings(data)
    } catch (e) {
      console.error('[MainView] settings sync failed:', e)
    }
  })

  unsubReload = api.onReloadModelRequest((requestId: string) => {
    live2dRef.value?.reloadCurrentModel().then((ok) => {
      api.sendReloadModelResult(requestId, { ok, error: ok ? undefined : '模型重载失败' })
    }).catch((e: any) => {
      api.sendReloadModelResult(requestId, { ok: false, error: e?.message || String(e) })
    })
  })
})

onUnmounted(() => {
  unsubSettings?.()
  unsubReload?.()
})

function openSettings() {
  window.electronAPI?.openSettings()
}

function toggleWindowTop() {
  window.electronAPI?.windowToggleTop()
  isTop.value = !isTop.value
}
</script>

<style scoped>
.main-view {
  width: 100%;
  height: 100vh;
  background: transparent;
  position: relative;
}

.live2d-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 70px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}
.live2d-area :deep(canvas) {
  pointer-events: auto;
}

.chat-panel {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 8px;
  background: var(--panel-bg);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  border-radius: 20px;
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 20;
  transition:
    max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    backdrop-filter 0.4s ease;
  max-height: 360px;
}

.chat-panel.collapsed {
  max-height: 62px;
  border-radius: 24px;
  backdrop-filter: blur(14px) saturate(1.3);
  -webkit-backdrop-filter: blur(14px) saturate(1.3);
}
</style>
