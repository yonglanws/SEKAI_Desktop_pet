<template>
  <div class="window-controls" @mousedown.stop>
    <button class="btn" @click="minimize" title="最小化">
      <svg viewBox="0 0 16 16" width="12" height="12">
        <rect x="1" y="7" width="14" height="2" fill="currentColor" />
      </svg>
    </button>
    <button class="btn" :class="{ active: isTop }" @click="toggleTop" title="置顶">
      <svg viewBox="0 0 16 16" width="12" height="12">
        <path d="M8 1 L14 7 L10 7 L10 15 L6 15 L6 7 L2 7 Z" fill="currentColor" />
      </svg>
    </button>
    <button class="btn" @click="openSettings" title="设置">
      <svg viewBox="0 0 16 16" width="12" height="12">
        <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.414 1.414M11.536 11.536l1.414 1.414M3.05 12.95l1.414-1.414M11.536 4.464l1.414-1.414" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
    <button class="btn close" @click="closeWin" title="关闭">
      <svg viewBox="0 0 16 16" width="12" height="12">
        <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isTop = ref(false)

onMounted(async () => {
  try {
    if (window.electronAPI?.windowIsTop) {
      isTop.value = await window.electronAPI.windowIsTop()
    }
  } catch (_) {}
})

function minimize() { window.electronAPI?.windowMinimize() }
function toggleTop() {
  window.electronAPI?.windowToggleTop()
  isTop.value = !isTop.value
}
function openSettings() { window.electronAPI?.openSettings() }
function closeWin() { window.electronAPI?.windowClose() }
</script>

<style scoped>
.window-controls {
  display: flex;
  gap: 2px;
  padding: 6px 8px;
  -webkit-app-region: no-drag;
}
.btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  transition: all var(--transition);
}
.btn:hover { background: var(--bg-hover); color: var(--text-secondary); }
.btn.active { color: var(--accent); background: var(--accent-dim); }
.btn.close:hover { background: rgba(243, 139, 168, 0.3); color: #f38ba8; }
</style>
