<template>
  <component :is="currentView" />
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { defineAsyncComponent } from 'vue'
import { settings } from '@/modules/settings'

const MainView = defineAsyncComponent(() => import('./views/MainView.vue'))
const SettingsView = defineAsyncComponent(() => import('./views/SettingsView.vue'))

const isSettings = computed(() => window.location.hash === '#/settings')
const currentView = computed(() => isSettings.value ? SettingsView : MainView)

function applyTheme() {
  const theme = settings.theme
  if (theme === 'auto') {
    document.documentElement.setAttribute('data-theme', 'auto')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

function applyFontSize() {
  document.documentElement.style.fontSize = settings.fontSize + 'px'
}

applyTheme()
applyFontSize()

watch(() => settings.theme, () => {
  applyTheme()
})

watch(() => settings.fontSize, () => {
  applyFontSize()
})

let mql: MediaQueryList | null = null

function onSystemThemeChange() {
  if (settings.theme === 'auto') {
    applyTheme()
  }
}

onMounted(() => {
  mql = window.matchMedia('(prefers-color-scheme: light)')
  mql.addEventListener('change', onSystemThemeChange)
})

onUnmounted(() => {
  mql?.removeEventListener('change', onSystemThemeChange)
})
</script>
