<template>
  <div class="settings-view">
    <div class="settings-header">
      <h1>设置</h1>
      <div class="header-actions">
        <button class="save-btn" @click="saveAndApply">保存并应用</button>
        <button class="action-btn" @click="doExport" title="导出配置">导出</button>
        <label class="action-btn import-label" title="导入配置">导入
          <input type="file" accept=".json" @change="doImport" style="display:none" />
        </label>
        <button class="reset-btn" @click="resetSettings">恢复默认</button>
      </div>
    </div>

    <div class="settings-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="settings-content">
      <div v-if="activeTab === 'live2d'" class="tab-panel">
        <h3>角色模型</h3>
        <div class="form-group">
          <label>模型路径</label>
          <input v-model="settings.live2d.selectedModel" type="text" placeholder="model/model3.json" />
        </div>
        <div class="form-group">
          <label>模型缩放</label>
          <div class="range-row">
            <input type="range" min="0.3" max="2" step="0.05" v-model.number="settings.live2d.modelScale" />
            <span class="range-value">{{ settings.live2d.modelScale.toFixed(2) }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>纹理 LOD</label>
          <select v-model="settings.live2d.textureLOD">
            <option value="full">完整 (full)</option>
            <option value="single-auto">自动 (single-auto)</option>
            <option value="false">关闭</option>
          </select>
        </div>
        <div class="form-group">
          <label>Cubism 内存 (MB)</label>
          <input type="number" min="16" max="256" v-model.number="settings.live2d.cubismMemoryMB" />
        </div>
        <h3>动画效果</h3>
        <div class="form-row">
          <label class="toggle">
            <input type="checkbox" v-model="settings.live2d.enableBreath" />
            <span class="toggle-track"></span>
            <span class="toggle-label">呼吸动画</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="settings.live2d.enableEyeBlink" />
            <span class="toggle-track"></span>
            <span class="toggle-label">眨眼动画</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="settings.live2d.enableLipSync" />
            <span class="toggle-track"></span>
            <span class="toggle-label">口型同步</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="settings.live2d.autoIdleMotion" />
            <span class="toggle-track"></span>
            <span class="toggle-label">待机动作</span>
          </label>
        </div>
        <div class="form-group">
          <label>鼠标追踪灵敏度</label>
          <div class="range-row">
            <input type="range" min="0" max="1" step="0.05" v-model.number="settings.live2d.mouseTrackingSensitivity" />
            <span class="range-value">{{ (settings.live2d.mouseTrackingSensitivity * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'ai'" class="tab-panel">
        <h3>AI 配置</h3>
        <div class="form-group">
          <label>API 端点</label>
          <input v-model="settings.ai.apiEndpoint" type="text" placeholder="https://api.openai.com/v1/chat/completions" />
        </div>
        <div class="form-group">
          <label>API Key</label>
          <input v-model="settings.ai.apiKey" type="password" placeholder="sk-..." />
        </div>
        <div class="form-group">
          <label>模型</label>
          <input v-model="settings.ai.model" type="text" placeholder="gpt-3.5-turbo" />
        </div>
        <div class="form-group">
          <label>系统提示词</label>
          <textarea v-model="settings.ai.systemPrompt" rows="4" placeholder="你是一个可爱的桌宠角色..." />
        </div>
        <div class="form-group">
          <label>Temperature</label>
          <div class="range-row">
            <input type="range" min="0" max="2" step="0.05" v-model.number="settings.ai.temperature" />
            <span class="range-value">{{ settings.ai.temperature.toFixed(2) }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>最大 Token</label>
          <input type="number" min="64" max="4096" v-model.number="settings.ai.maxTokens" />
        </div>
      </div>

      <div v-if="activeTab === 'tts'" class="tab-panel">
        <h3>GPT-SoVITS 语音合成</h3>
        <div class="form-row">
          <label class="toggle">
            <input type="checkbox" v-model="settings.tts.enabled" />
            <span class="toggle-track"></span>
            <span class="toggle-label">启用语音合成</span>
          </label>
        </div>
        <div class="form-group">
          <label>API 端点</label>
          <input v-model="settings.tts.apiEndpoint" type="text" placeholder="http://127.0.0.1:9880" />
        </div>
        <h3>模型权重</h3>
        <div class="form-group">
          <label>GPT 模型路径</label>
          <input v-model="settings.tts.gptWeightsPath" type="text" placeholder="GPT_SoVITS/pretrained_models/s1bert25hz-2kh-longer-epoch=68e-step=50232.ckpt" />
        </div>
        <div class="form-group">
          <label>SoVITS 模型路径</label>
          <input v-model="settings.tts.sovitsWeightsPath" type="text" placeholder="GPT_SoVITS/pretrained_models/s2G488k.pth" />
        </div>
        <div class="form-group">
          <button class="test-btn" :disabled="modelSwitching" @click="switchTTSModel">
            {{ modelSwitching ? '切换中...' : '切换模型' }}
          </button>
          <span v-if="modelSwitchResult" :class="['test-result', modelSwitchResult.ok ? 'success' : 'error']">
            {{ modelSwitchResult.message }}
          </span>
        </div>
        <h3>参考音频</h3>
        <div class="form-group">
          <label>参考音频路径</label>
          <input v-model="settings.tts.refAudioPath" type="text" placeholder="参考音频文件路径（服务端路径）" />
        </div>
        <div class="form-group">
          <label>参考音频文本</label>
          <input v-model="settings.tts.promptText" type="text" placeholder="参考音频对应的文本内容" />
        </div>
        <div class="form-group">
          <label>合成文本语言</label>
          <select v-model="settings.tts.textLang">
            <option value="zh">中文</option>
            <option value="en">英文</option>
            <option value="ja">日文</option>
            <option value="ko">韩文</option>
            <option value="yue">粤语</option>
          </select>
        </div>
        <div class="form-group">
          <label>参考音频语言</label>
          <select v-model="settings.tts.promptLang">
            <option value="zh">中文</option>
            <option value="en">英文</option>
            <option value="ja">日文</option>
            <option value="ko">韩文</option>
            <option value="yue">粤语</option>
          </select>
        </div>
        <h3>高级参数</h3>
        <div class="form-group">
          <label>Top K</label>
          <input type="number" min="1" max="100" v-model.number="settings.tts.topK" />
        </div>
        <div class="form-group">
          <label>Top P</label>
          <div class="range-row">
            <input type="range" min="0" max="1" step="0.05" v-model.number="settings.tts.topP" />
            <span class="range-value">{{ settings.tts.topP.toFixed(2) }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>Temperature</label>
          <div class="range-row">
            <input type="range" min="0.1" max="2" step="0.05" v-model.number="settings.tts.temperature" />
            <span class="range-value">{{ settings.tts.temperature.toFixed(2) }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>语速</label>
          <div class="range-row">
            <input type="range" min="0.5" max="2" step="0.05" v-model.number="settings.tts.speedFactor" />
            <span class="range-value">{{ settings.tts.speedFactor.toFixed(2) }}x</span>
          </div>
        </div>
        <div class="form-group">
          <label>文本分割方式</label>
          <select v-model="settings.tts.textSplitMethod">
            <option value="cut0">不分割</option>
            <option value="cut1">四句一切</option>
            <option value="cut2">50字一切</option>
            <option value="cut3">按中文句号切</option>
            <option value="cut4">按英文句号切</option>
            <option value="cut5">综合切分（推荐）</option>
          </select>
        </div>
        <div class="form-group">
          <label>输出格式</label>
          <select v-model="settings.tts.mediaType">
            <option value="wav">WAV</option>
            <option value="ogg">OGG</option>
            <option value="aac">AAC</option>
          </select>
        </div>
        <div class="form-group">
          <label>流式模式</label>
          <select v-model.number="settings.tts.streamingMode">
            <option :value="0">关闭</option>
            <option :value="1">最佳质量（最慢）</option>
            <option :value="2">中等质量</option>
            <option :value="3">较低质量（最快）</option>
          </select>
        </div>
        <div class="form-group" style="margin-top: 20px;">
          <button class="test-btn" :disabled="ttsTesting" @click="testTTSConnection">
            {{ ttsTesting ? '测试中...' : '测试连接' }}
          </button>
          <span v-if="ttsTestResult" :class="['test-result', ttsTestResult.ok ? 'success' : 'error']">
            {{ ttsTestResult.message }}
          </span>
        </div>
      </div>

      <div v-if="activeTab === 'appearance'" class="tab-panel">
        <h3>外观</h3>
        <div class="form-group">
          <label>主题</label>
          <select v-model="settings.theme">
            <option value="dark">深色</option>
            <option value="light">浅色</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>
        <div class="form-group">
          <label>字体大小</label>
          <div class="range-row">
            <input type="range" min="10" max="20" step="1" v-model.number="settings.fontSize" />
            <span class="range-value">{{ settings.fontSize }}px</span>
          </div>
        </div>
        <div class="form-group">
          <label>语言</label>
          <select v-model="settings.language">
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
          </select>
        </div>
      </div>

      <div v-if="activeTab === 'interaction'" class="tab-panel">
        <h3>交互</h3>
        <div class="form-row">
          <label class="toggle">
            <input type="checkbox" v-model="settings.interaction.hoverFeedback" />
            <span class="toggle-track"></span>
            <span class="toggle-label">悬停反馈</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="settings.interaction.clickResponse" />
            <span class="toggle-track"></span>
            <span class="toggle-label">点击响应</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="settings.interaction.dragEnabled" />
            <span class="toggle-track"></span>
            <span class="toggle-label">拖拽移动</span>
          </label>
        </div>
        <div class="form-group">
          <label>双击动作</label>
          <select v-model="settings.interaction.doubleClickAction">
            <option value="motion">播放动作</option>
            <option value="expression">切换表情</option>
            <option value="none">无</option>
          </select>
        </div>
      </div>

      <div v-if="activeTab === 'performance'" class="tab-panel">
        <h3>性能</h3>
        <div class="form-group">
          <label>目标帧率</label>
          <div class="range-row">
            <input type="range" min="15" max="60" step="5" v-model.number="settings.performance.targetFPS" />
            <span class="range-value">{{ settings.performance.targetFPS }} FPS</span>
          </div>
        </div>
        <div class="form-row">
          <label class="toggle">
            <input type="checkbox" v-model="settings.performance.reduceWhenHidden" />
            <span class="toggle-track"></span>
            <span class="toggle-label">隐藏时降低渲染</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="settings.performance.minimizeToTray" />
            <span class="toggle-track"></span>
            <span class="toggle-label">最小化到托盘</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { settings, resetSettings, exportSettings, importSettings } from '@/modules/settings'
import { ttsService } from '@/modules/tts'

const activeTab = ref('live2d')
const ttsTesting = ref(false)
const ttsTestResult = ref<{ ok: boolean; message: string } | null>(null)
const modelSwitching = ref(false)
const modelSwitchResult = ref<{ ok: boolean; message: string } | null>(null)

const tabs = [
  { id: 'live2d', label: 'Live2D' },
  { id: 'ai', label: 'AI 对话' },
  { id: 'tts', label: '语音' },
  { id: 'appearance', label: '外观' },
  { id: 'interaction', label: '交互' },
  { id: 'performance', label: '性能' },
]

function doExport() {
  const json = exportSettings()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sekai-pet-settings-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function saveAndApply() {
  const data = JSON.parse(JSON.stringify(settings))
  try {
    await window.electronAPI?.settingsSet(data)
    await window.electronAPI?.requestReloadModel()
    alert('设置已保存并应用！')
  } catch (e) {
    console.error('[Settings] Save failed:', e)
    alert('保存失败，请重试')
  }
}

async function testTTSConnection() {
  ttsTesting.value = true
  ttsTestResult.value = null
  try {
    ttsTestResult.value = await ttsService.testConnection(settings.tts)
  } catch (e: any) {
    ttsTestResult.value = { ok: false, message: e.message || '未知错误' }
  } finally {
    ttsTesting.value = false
  }
}

async function switchTTSModel() {
  modelSwitching.value = true
  modelSwitchResult.value = null
  try {
    modelSwitchResult.value = await ttsService.switchModel(settings.tts)
  } catch (e: any) {
    modelSwitchResult.value = { ok: false, message: e.message || '未知错误' }
  } finally {
    modelSwitching.value = false
  }
}

function doImport(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      const ok = importSettings(reader.result)
      alert(ok ? '配置导入成功！' : '导入失败，请检查文件格式')
    }
  }
  reader.readAsText(file)
  input.value = ''
}
</script>

<style scoped>
.settings-view {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Segoe UI', 'PingFang SC', sans-serif;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.settings-header h1 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.save-btn {
  padding: 7px 18px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 600;
  border: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.save-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 2px 10px var(--accent-dim);
  transform: translateY(-1px);
}

.save-btn:active {
  transform: translateY(0);
}

.action-btn {
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  border: 1px solid var(--border);
  transition: all var(--transition);
  cursor: pointer;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
  border-color: var(--border-hover);
}

.import-label {
  cursor: pointer;
}

.reset-btn {
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  background: rgba(243, 139, 168, 0.1);
  color: #f38ba8;
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: 1px solid rgba(243, 139, 168, 0.2);
  transition: all var(--transition);
  cursor: pointer;
}

.reset-btn:hover {
  background: rgba(243, 139, 168, 0.22);
  border-color: rgba(243, 139, 168, 0.4);
}

.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 6px 20px 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.tab-btn {
  padding: 8px 18px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.25s ease;
}

.tab-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: transparent;
  transition: background 0.25s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.tab-btn.active {
  color: var(--accent);
  background: var(--bg-primary);
}

.tab-btn.active::after {
  background: var(--accent);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}

.settings-content::-webkit-scrollbar { width: 4px; }
.settings-content::-webkit-scrollbar-track { background: transparent; }
.settings-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 2px;
}

.section-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 18px;
  margin-bottom: 16px;
}

.section-card h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 14px;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-card h3::before {
  content: '';
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: var(--accent);
  flex-shrink: 0;
}

.tab-panel h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 24px 0 12px;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-panel h3:first-child {
  margin-top: 0;
}

.tab-panel h3::before {
  content: '';
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: var(--accent);
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 14px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: none;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="password"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input[type="text"]:hover,
.form-group input[type="number"]:hover,
.form-group input[type="password"]:hover,
.form-group select:hover,
.form-group textarea:hover {
  border-color: var(--border-hover);
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group input[type="password"]:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.form-group select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 32px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c7086' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
  line-height: var(--line-height-base);
}

.range-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-row input[type="range"] {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-hover);
  outline: none;
  cursor: pointer;
}

.range-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--bg-primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.range-row input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px var(--accent-dim);
}

.range-row input[type="range"]::-webkit-slider-thumb:active {
  transform: scale(1.05);
}

.range-value {
  min-width: 44px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--accent);
  text-align: right;
  font-variant-numeric: tabular-nums;
  background: var(--accent-dim);
  padding: 3px 8px;
  border-radius: var(--radius-xs);
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0;
  cursor: pointer;
  user-select: none;
}

.toggle input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.toggle-track {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--bg-hover);
  border: 2px solid var(--border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.toggle input:checked + .toggle-track {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle input:checked + .toggle-track::after {
  left: 20px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle:hover .toggle-track {
  border-color: var(--border-hover);
}

.toggle:hover input:checked + .toggle-track {
  border-color: var(--accent-hover);
  background: var(--accent-hover);
}

.toggle-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-left: 10px;
  transition: color var(--transition);
}

.toggle:hover .toggle-label {
  color: var(--text-primary);
}

.test-btn {
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.test-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 2px 10px var(--accent-dim);
  transform: translateY(-1px);
}

.test-btn:active:not(:disabled) {
  transform: translateY(0);
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-result {
  margin-left: 12px;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.test-result.success {
  color: #a6e3a1;
}

.test-result.error {
  color: #f38ba8;
}
</style>
