<template>
  <div class="main-view" ref="mainView">
    <div class="live2d-area">
      <Live2DCanvas ref="live2dRef" />
    </div>

    <div
      class="chat-panel"
      :class="{ collapsed: isChatCollapsed }"
      :style="chatPanelStyle"
    >
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Live2DCanvas from '@/components/Live2DCanvas.vue'
import ChatDialog from '@/components/ChatDialog.vue'
import { settings, updateSettings } from '@/modules/settings'
import { live2dManager } from '@/modules/live2d'

const isChatCollapsed = ref(true)
const isTop = ref(false)
const live2dRef = ref<InstanceType<typeof Live2DCanvas>>()
const mainView = ref<HTMLElement>()
const modelBottomY = ref(0)

let unsubSettings: (() => void) | null = null
let unsubReload: (() => void) | null = null
let bottomRafId = 0

const chatPanelStyle = computed(() => {
  if (!isChatCollapsed.value) return {}
  const viewH = mainView.value?.clientHeight || window.innerHeight
  const bottomPx = viewH - modelBottomY.value - 60
  const clamped = Math.max(8, Math.min(bottomPx, viewH - 62))
  return { bottom: `${clamped}px` }
})

function updateModelBottom() {
  modelBottomY.value = live2dManager.getModelBottomY()
  if (isChatCollapsed.value) {
    bottomRafId = requestAnimationFrame(updateModelBottom)
  }
}

watch(isChatCollapsed, (collapsed) => {
  if (collapsed) {
    if (!bottomRafId) updateModelBottom()
  } else {
    if (bottomRafId) {
      cancelAnimationFrame(bottomRafId)
      bottomRafId = 0
    }
  }
})

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

  setTimeout(() => updateModelBottom(), 500)
})

onUnmounted(() => {
  unsubSettings?.()
  unsubReload?.()
  if (bottomRafId) cancelAnimationFrame(bottomRafId)
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
  bottom: 0;
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
  backdrop-filter: blur(72px) saturate(1.5);
  -webkit-backdrop-filter: blur(72px) saturate(1.5);
  border-radius: 20px;
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 20;
  transition:
    bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    backdrop-filter 0.4s ease,
    background 0.4s ease;
  max-height: 360px;
}

.chat-panel.collapsed {
  max-height: 62px;
  border-radius: 24px;
  background: var(--panel-bg-solid);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
</style>
