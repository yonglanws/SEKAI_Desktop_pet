<template>
  <div ref="canvasContainer" class="live2d-canvas" @mousedown="onDragStart">
    <div v-if="!isReady" class="live2d-placeholder">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <circle cx="12" cy="9" r="4"/>
        <path d="M5 20c0-4 3-7 7-7s7 3 7 7"/>
        <circle cx="18" cy="5" r="2" fill="currentColor" opacity="0.3"/>
      </svg>
      <span>等待加载...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { live2dManager } from '@/modules/live2d'
import { settings } from '@/modules/settings'

const canvasContainer = ref<HTMLElement>()
const isReady = ref(false)
let isDragging = false
let dragAccX = 0
let dragAccY = 0
let rafId = 0

onMounted(async () => {
  if (!canvasContainer.value) return
  try {
    await live2dManager.init(canvasContainer.value)
    isReady.value = true
    const modelPath = settings.live2d.selectedModel
    if (modelPath) {
      try { await live2dManager.loadModel(modelPath) } catch (e) { console.warn('Model load failed:', e) }
    }
  } catch (err) {
    console.error('Live2D init error:', err)
  }
  document.addEventListener('mouseleave', onMouseLeave)
})

onUnmounted(() => {
  live2dManager.destroy()
  document.removeEventListener('mouseleave', onMouseLeave)
})

watch(() => settings.live2d.modelScale, (scale) => { live2dManager.setScale(scale) })
watch(() => settings.live2d.selectedModel, async (path) => {
  if (path && isReady.value) {
    try { await live2dManager.loadModel(path) } catch (e) { console.error(e) }
  }
})

async function reloadCurrentModel(): Promise<boolean> {
  if (!isReady.value) return false
  const path = settings.live2d.selectedModel
  if (!path) return false
  try {
    await live2dManager.loadModel(path)
    return true
  } catch (e) {
    console.error('[Live2DCanvas] reload failed:', e)
    return false
  }
}

defineExpose({ reloadCurrentModel })

function onDragStart(e: MouseEvent) {
  if (!settings.interaction.dragEnabled) return
  isDragging = true
  dragAccX = 0
  dragAccY = 0
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onMouseLeave() {
  live2dManager.resetFocus()
}

function onDragMove(e: MouseEvent) {
  if (!isDragging) return
  dragAccX += e.movementX
  dragAccY += e.movementY
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    if (Math.abs(dragAccX) < 0.5 && Math.abs(dragAccY) < 0.5) return
    window.electronAPI?.windowMove(dragAccX, dragAccY)
    dragAccX = 0
    dragAccY = 0
  })
}

function onDragEnd() {
  isDragging = false
  if (Math.abs(dragAccX) > 0.5 || Math.abs(dragAccY) > 0.5) {
    window.electronAPI?.windowMove(dragAccX, dragAccY)
  }
  dragAccX = 0
  dragAccY = 0
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}
</script>

<style scoped>
.live2d-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;
  -webkit-app-region: no-drag;
}
.live2d-canvas:active { cursor: grabbing; }

.live2d-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  user-select: none;
  pointer-events: none;
}

.live2d-canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-app-region: no-drag;
  pointer-events: auto;
}
</style>
