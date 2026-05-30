<template>
  <div class="settings-view">
    <!-- 左侧导航栏 -->
    <aside class="settings-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <h2>设置</h2>
        </div>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="nav-icon" v-html="tab.icon"></span>
          <span class="nav-label">{{ tab.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <button class="footer-btn primary" @click="saveAndApply">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存并应用
        </button>
        <div class="footer-actions">
          <button class="footer-btn" @click="doExport" title="导出配置">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <label class="footer-btn" title="导入配置">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <input type="file" accept=".json" @change="doImport" style="display:none" />
          </label>
          <button class="footer-btn danger" @click="resetSettings" title="恢复默认">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="settings-main" :key="activeTab">
      <!-- Live2D -->
      <div v-if="activeTab === 'live2d'" class="main-content content-enter live2d-page">
        <div class="page-header">
          <div class="page-header-text">
            <h1>已下载模型</h1>
            <p class="page-subtitle">选择并管理本地 Live2D 模型 · 共 {{ localModels.length }} 个</p>
          </div>
          <div class="page-header-actions">
            <button class="icon-btn" @click="chooseModelDir" title="浏览模型目录">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="icon-btn" @click="refreshLocalModels" title="刷新">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
        </div>

        <div v-if="localModels.length > 0 && !localCharDetail" class="live2d-model-page">
          <div class="char-grid">
            <div
              v-for="ch in allLocalCharacters"
              :key="ch.key"
              class="char-tile"
              :class="{ active: selectedLocalPath && ch.models.some(m => m.path === selectedLocalPath) }"
              @click="openLocalCharDetail(ch)"
            >
              <div class="char-tile-avatar">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/></svg>
              </div>
              <div class="char-tile-info">
                <div class="char-tile-name">{{ ch.label }}</div>
                <div class="char-tile-group">{{ ch.groupName }}</div>
              </div>
              <div class="char-tile-count">{{ ch.models.length }}</div>
              <svg class="char-tile-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>

        <div v-else-if="localCharDetail" class="live2d-model-page content-enter">
          <div class="detail-header">
            <button class="back-btn" @click="closeLocalCharDetail">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              返回
            </button>
            <div class="detail-title">
              <div class="detail-avatar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/></svg>
              </div>
              <div>
                <div class="detail-name">{{ localCharDetail.label }}</div>
                <div class="detail-group">{{ localCharDetail.groupName }} · {{ localCharDetail.models.length }} 个模型</div>
              </div>
            </div>
          </div>
          <div class="char-detail-models">
            <div
              v-for="m in localCharDetail.models"
              :key="m.localPath"
              class="local-model-item detail-item"
              :class="{ active: selectedLocalPath === m.path }"
              @click="selectLocalModel(m.path)"
            >
              <div class="local-model-dot" :class="{ active: selectedLocalPath === m.path }"></div>
              <div class="local-model-info">
                <div class="local-model-name">{{ m.name }}</div>
                <div class="local-model-base">{{ m.modelBase }}</div>
              </div>
              <button class="delete-model-btn" @click.stop="deleteLocalModel(m)" title="删除模型">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="settings.live2d.customModelDir" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="empty-title">暂无已下载模型</div>
          <div class="empty-desc">前往「模型下载」页面获取模型</div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="empty-title">未设置模型目录</div>
          <div class="empty-desc">点击右上角浏览按钮选择模型存放目录</div>
        </div>
      </div>

      <!-- 模型下载 -->
      <div v-if="activeTab === 'download'" class="main-content content-enter download-page">
        <div class="page-header">
          <div class="page-header-text">
            <h1>模型下载</h1>
            <p class="page-subtitle">
              <template v-if="modelList.length > 0">已载入 {{ modelList.length }} 个模型 · 已选 {{ selectedKeys.size }} 个</template>
              <template v-else>浏览并下载 PJSK Live2D 模型</template>
            </p>
          </div>
          <div class="page-header-actions">
            <button class="icon-btn" @click="chooseModelDir" title="浏览保存目录">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="primary-btn" :disabled="loadingList" @click="fetchModelList">
              <span v-if="loadingList" class="spin">⟳</span>
              {{ loadingList ? '加载中...' : (modelList.length > 0 ? '刷新列表' : '获取列表') }}
            </button>
          </div>
        </div>

        <div v-if="listError" class="banner error">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ listError }}
        </div>

        <div v-else-if="modelList.length > 0" class="banner success">
          <span>已载入 {{ modelList.length }} 个模型 · 已选 {{ selectedKeys.size }} 个</span>
          <div class="banner-actions">
            <button v-if="selectedKeys.size > 0" class="mini-btn" @click="clearSelection">清空</button>
            <button class="primary-btn small" :disabled="downloading || selectedKeys.size === 0" @click="startDownload">
              {{ downloading ? '下载中...' : `下载 ${selectedKeys.size}` }}
            </button>
            <button v-if="downloading" class="mini-btn danger" @click="cancelAllDownloads">取消</button>
          </div>
        </div>

        <div v-if="downloadTasks.length > 0" class="download-progress-section">
          <div class="section-header">
            <span class="section-title">下载进度</span>
            <div class="section-actions">
              <button class="mini-btn" @click="clearFinishedTasks" :disabled="!hasFinishedTasks">清除完成</button>
              <button class="mini-btn" @click="tasksCollapsed = !tasksCollapsed">{{ tasksCollapsed ? '展开' : '折叠' }}</button>
            </div>
          </div>
          <div class="dl-summary">
            <div class="dl-summary-row">
              <span class="dl-summary-label">总体进度</span>
              <span class="dl-summary-value">{{ summary.completed }}/{{ summary.total }} <b>{{ summary.percent }}%</b></span>
            </div>
            <div class="dl-summary-bar"><div class="dl-summary-bar-fill" :style="{ width: summary.percent + '%' }"></div></div>
            <div class="dl-summary-stats">
              <span class="stat-pill running" v-if="summary.running > 0">下载中 {{ summary.running }}</span>
              <span class="stat-pill success" v-if="summary.success > 0">完成 {{ summary.success }}</span>
              <span class="stat-pill error" v-if="summary.error > 0">失败 {{ summary.error }}</span>
              <span class="stat-pill cancelled" v-if="summary.cancelled > 0">取消 {{ summary.cancelled }}</span>
            </div>
          </div>
          <div v-show="!tasksCollapsed" class="dl-task-list">
            <div class="dl-task" v-for="t in downloadTasks" :key="t.taskId" :class="['status-' + t.status]">
              <div class="dl-task-head">
                <span class="dl-task-name" :title="t.modelKey">{{ t.modelKey }}</span>
                <span class="dl-task-right">
                  <span class="dl-task-percent">{{ t.total > 0 ? taskPercent(t) + '%' : '...' }}</span>
                  <span :class="['dl-task-status', t.status]">{{ statusLabel(t.status) }}</span>
                </span>
              </div>
              <div class="dl-task-bar">
                <div :class="['dl-task-bar-fill', t.status, { indeterminate: t.status === 'running' && t.total === 0 }]"
                  :style="{ width: (t.status === 'running' && t.total === 0) ? '40%' : (taskPercent(t) === 0 ? '4px' : taskPercent(t) + '%') }"
                ></div>
              </div>
              <div class="dl-task-meta">
                <span class="meta-pill">{{ t.done }}/{{ t.total || '?' }}</span>
                <span v-if="t.skipped > 0" class="meta-pill skipped">跳过 {{ t.skipped }}</span>
                <span v-if="t.failed > 0" class="meta-pill failed">失败 {{ t.failed }}</span>
                <span v-if="t.currentFile" class="dl-task-file" :title="t.currentFile">{{ truncateFile(t.currentFile) }}</span>
                <span v-if="t.message" class="dl-task-msg">{{ t.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="availableGroups.length > 0" class="download-browse-section">
          <div class="section-header">
            <span class="section-title">浏览模型</span>
            <div class="section-actions">
              <div class="search-field">
                <input v-model="filterKeyword" type="text" placeholder="搜索模型..." />
                <button v-if="filterKeyword" class="mini-btn" @click="filterKeyword = ''">清除</button>
              </div>
              <button class="mini-btn" @click="expandAllChars">全部展开</button>
              <button class="mini-btn" @click="collapseAllChars">全部折叠</button>
            </div>
          </div>
          <div class="group-list">
            <div v-for="group in availableGroups" :key="group.id" class="group-block" :class="{ collapsed: collapsedGroups.has(group.id) }">
              <div class="group-header" @click="toggleGroupCollapse(group.id)">
                <div class="group-title">
                  <svg class="group-arrow" viewBox="0 0 12 12" width="12" height="12">
                    <path d="M3 4l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="group-short">{{ group.short }}</span>
                  <span class="group-name">{{ group.name }}</span>
                  <span class="group-count">{{ group.totalCount }}</span>
                </div>
                <div class="group-actions" @click.stop>
                  <button class="group-btn" @click="selectGroup(group)">+ 全选</button>
                  <button class="group-btn deselect" @click="deselectGroup(group)">取消</button>
                </div>
              </div>
              <div v-show="!collapsedGroups.has(group.id)" class="char-list">
                <template v-if="group.id !== 'other'">
                  <div v-for="ch in group.characters" :key="ch.key" class="char-card" :class="{ active: expandedChar === ch.key, disabled: ch.count === 0 }">
                    <div class="char-card-header" @click="toggleCharExpand(ch)">
                      <div class="char-card-title">
                        <svg class="char-arrow" viewBox="0 0 12 12" width="12" height="12">
                          <path d="M3 4l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span class="char-name">{{ ch.label }}</span>
                        <span class="char-count">{{ ch.count }}</span>
                      </div>
                      <div class="char-card-actions" @click.stop>
                        <button class="mini-btn" :disabled="ch.count === 0" @click="selectCharacterModels(ch)">全选</button>
                        <button class="mini-btn" :disabled="ch.count === 0" @click="deselectCharacterModels(ch)">取消</button>
                      </div>
                    </div>
                    <div v-if="expandedChar === ch.key" class="char-models">
                      <div v-if="getCharModels(ch).length === 0" class="char-models-empty">暂无可用款式</div>
                      <div class="model-grid">
                        <div v-for="m in getCharModels(ch)" :key="m.modelBase + '/' + m.modelName" class="dl-item"
                          :class="{ selected: selectedKeys.has(m.modelBase + '/' + m.modelName) }" @click="toggleSelect(m)">
                          <input type="checkbox" :checked="selectedKeys.has(m.modelBase + '/' + m.modelName)" @click.stop="toggleSelect(m)" />
                          <div class="dl-item-info">
                            <div class="dl-item-name">{{ m.modelName }}</div>
                            <div class="dl-item-base">{{ m.modelBase }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="other-group-actions">
                    <button class="mini-btn" @click="selectGroup(group)">全选未识别 {{ group.totalCount }}</button>
                    <span class="other-tip">这些模型未匹配到团体</span>
                  </div>
                  <div class="model-grid">
                    <div v-for="m in getOtherModels()" :key="m.modelBase + '/' + m.modelName" class="dl-item"
                      :class="{ selected: selectedKeys.has(m.modelBase + '/' + m.modelName) }" @click="toggleSelect(m)">
                      <input type="checkbox" :checked="selectedKeys.has(m.modelBase + '/' + m.modelName)" @click.stop="toggleSelect(m)" />
                      <div class="dl-item-info">
                        <div class="dl-item-name">{{ m.modelName }}</div>
                        <div class="dl-item-base">{{ m.modelBase }}</div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filterKeyword.trim() && filteredList.length > 0" class="download-search-section">
          <div class="section-header">
            <span class="section-title">搜索结果（{{ filteredList.length }} 个）</span>
            <button class="mini-btn" @click="filterKeyword = ''">清除</button>
          </div>
          <div class="model-grid">
            <div v-for="m in filteredList" :key="m.modelBase + '/' + m.modelName" class="dl-item"
              :class="{ selected: selectedKeys.has(m.modelBase + '/' + m.modelName) }" @click="toggleSelect(m)">
              <input type="checkbox" :checked="selectedKeys.has(m.modelBase + '/' + m.modelName)" @click.stop="toggleSelect(m)" />
              <div class="dl-item-info">
                <div class="dl-item-name">{{ m.modelName }}</div>
                <div class="dl-item-base">{{ m.modelBase }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loadingList && modelList.length === 0 && !listError" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div class="empty-title">模型列表为空</div>
          <div class="empty-desc">点击「获取列表」加载可用模型</div>
        </div>
      </div>

      <!-- AI 对话 -->
      <div v-if="activeTab === 'ai'" class="main-content content-enter">
        <div class="page-header">
          <div class="page-header-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <div class="page-header-text">
            <h1>AI 对话</h1>
            <p class="page-subtitle">配置大语言模型连接与角色行为</p>
          </div>
        </div>
        <div class="setting-card">
          <div class="card-header">
            <div class="card-header-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <div class="card-title">API 连接</div>
          </div>
          <div class="setting-row">
            <div class="setting-field">
              <label class="field-label">API 端点</label>
              <input v-model="settings.ai.apiEndpoint" type="text" placeholder="https://api.openai.com/v1/chat/completions" />
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-field">
              <label class="field-label">API Key</label>
              <input v-model="settings.ai.apiKey" type="password" placeholder="sk-..." />
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-field">
              <label class="field-label">模型名称</label>
              <input v-model="settings.ai.model" type="text" placeholder="gpt-3.5-turbo" />
            </div>
          </div>
        </div>
        <div class="setting-card">
          <div class="card-header">
            <div class="card-header-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <div class="card-title">角色与行为</div>
          </div>
          <div class="setting-row">
            <div class="setting-field">
              <label class="field-label">系统提示词</label>
              <textarea v-model="settings.ai.systemPrompt" rows="4" placeholder="你是游戏世界计划的{name}，请以此人物的语气回答用户的问题。" />
            </div>
          </div>
          <div class="setting-row two-col">
            <div class="setting-field">
              <label class="field-label">Temperature <span class="field-value">{{ settings.ai.temperature.toFixed(2) }}</span></label>
              <input type="range" min="0" max="2" step="0.05" v-model.number="settings.ai.temperature" />
            </div>
            <div class="setting-field">
              <label class="field-label">最大 Token</label>
              <input type="number" min="64" max="4096" v-model.number="settings.ai.maxTokens" />
            </div>
          </div>
        </div>
      </div>

      <!-- 外观 -->
      <div v-if="activeTab === 'appearance'" class="main-content content-enter">
        <div class="page-header">
          <div class="page-header-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          </div>
          <div class="page-header-text">
            <h1>外观</h1>
            <p class="page-subtitle">调整主题、字体与语言</p>
          </div>
        </div>
        <div class="setting-card">
          <div class="card-header">
            <div class="card-header-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </div>
            <div class="card-title">显示</div>
          </div>
          <div class="setting-row two-col">
            <div class="setting-field">
              <label class="field-label">主题</label>
              <select v-model="settings.theme">
                <option value="dark">深色</option><option value="light">浅色</option><option value="auto">跟随系统</option>
              </select>
            </div>
            <div class="setting-field">
              <label class="field-label">语言</label>
              <select v-model="settings.language">
                <option value="zh-CN">简体中文</option><option value="en-US">English</option><option value="ja-JP">日本語</option>
              </select>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-field">
              <label class="field-label">字体大小 <span class="field-value">{{ settings.fontSize }}px</span></label>
              <input type="range" min="10" max="20" step="1" v-model.number="settings.fontSize" />
            </div>
          </div>
        </div>
      </div>

      <!-- 交互 -->
      <div v-if="activeTab === 'interaction'" class="main-content content-enter">
        <div class="page-header">
          <div class="page-header-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div class="page-header-text">
            <h1>交互</h1>
            <p class="page-subtitle">配置鼠标与触摸交互行为</p>
          </div>
        </div>
        <div class="setting-card">
          <div class="card-header">
            <div class="card-header-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </div>
            <div class="card-title">交互行为</div>
          </div>
          <div class="toggle-grid">
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
          <div class="setting-row">
            <div class="setting-field">
              <label class="field-label">双击动作</label>
              <select v-model="settings.interaction.doubleClickAction">
                <option value="motion">播放动作</option><option value="expression">切换表情</option><option value="none">无</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 性能 -->
      <div v-if="activeTab === 'performance'" class="main-content content-enter">
        <div class="page-header">
          <div class="page-header-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div class="page-header-text">
            <h1>性能</h1>
            <p class="page-subtitle">优化渲染性能与资源占用</p>
          </div>
        </div>
        <div class="setting-card">
          <div class="card-header">
            <div class="card-header-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div class="card-title">性能优化</div>
          </div>
          <div class="setting-row">
            <div class="setting-field">
              <label class="field-label">目标帧率 <span class="field-value">{{ settings.performance.targetFPS }} FPS</span></label>
              <input type="range" min="15" max="60" step="5" v-model.number="settings.performance.targetFPS" />
            </div>
          </div>
          <div class="toggle-grid">
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { settings, resetSettings, exportSettings, importSettings } from '@/modules/settings'

interface ModelEntry {
  modelBase: string
  modelName: string
  modelPath: string
  modelFile: string
}

interface DownloadTask {
  taskId: string
  modelKey: string
  modelName: string
  total: number
  done: number
  failed: number
  skipped: number
  status: 'running' | 'success' | 'error' | 'cancelled'
  message?: string
  currentFile?: string
}

interface LocalModel {
  name: string
  modelBase: string
  path: string
  localPath: string
}

const activeTab = ref('live2d')
const modelSwitching = ref(false)
const modelSwitchResult = ref<{ ok: boolean; message: string } | null>(null)

const localModels = ref<LocalModel[]>([])
const selectedLocalPath = ref('')

const modelList = ref<ModelEntry[]>([])
const loadingList = ref(false)
const listError = ref('')
const filterKeyword = ref('')
const selectedKeys = ref<Set<string>>(new Set())
const downloadConcurrency = ref(4)
const downloading = ref(false)
const downloadTasks = ref<DownloadTask[]>([])
const taskMap = new Map<string, number>()

const collapsedGroups = ref<Set<string>>(new Set())
const tasksCollapsed = ref(false)
const expandedChar = ref<string>('')

const localCharDetail = ref<LocalCharViewExtended | null>(null)

let unsubProgress: (() => void) | null = null

const tabs = [
  { id: 'live2d', label: '已下载模型', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/></svg>' },
  { id: 'download', label: '模型下载', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' },
  { id: 'ai', label: 'AI 对话', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' },
  { id: 'appearance', label: '外观', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>' },
  { id: 'interaction', label: '交互', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { id: 'performance', label: '性能', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
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

const filteredList = computed(() => {
  const kw = filterKeyword.value.trim().toLowerCase()
  if (!kw || kw === 'all') return modelList.value
  return modelList.value.filter(m =>
    m.modelBase.toLowerCase().includes(kw) || m.modelName.toLowerCase().includes(kw)
  )
})

interface CharacterDef {
  key: string
  label: string
  ids?: number[]
  aliases?: string[]
}

interface GroupDef {
  id: string
  name: string
  short: string
  characters: CharacterDef[]
}

const CHARACTER_GROUPS: GroupDef[] = [
  { id: 'ln', name: 'Leo/need', short: 'L/n', characters: [
    { key: 'ichika', label: '星乃一歌', ids: [1], aliases: ['ick', 'ichika'] },
    { key: 'saki', label: '天马咲希', ids: [2], aliases: ['saki', 'sk'] },
    { key: 'honami', label: '望月穗波', ids: [3], aliases: ['hnm', 'honami'] },
    { key: 'shiho', label: '日野森志步', ids: [4], aliases: ['shiho', 'sh'] },
  ]},
  { id: 'mmj', name: 'MORE MORE JUMP!', short: 'MMJ', characters: [
    { key: 'minori', label: '花里实乃理', ids: [5], aliases: ['mnr', 'minori'] },
    { key: 'haruka', label: '桐谷遥', ids: [6], aliases: ['hrk', 'haruka'] },
    { key: 'airi', label: '桃井爱莉', ids: [7], aliases: ['airi'] },
    { key: 'shizuku', label: '日野森雫', ids: [8], aliases: ['szk', 'shizuku'] },
  ]},
  { id: 'vbs', name: 'Vivid BAD SQUAD', short: 'VBS', characters: [
    { key: 'kohane', label: '小豆泽心羽', ids: [9], aliases: ['khn', 'kohane'] },
    { key: 'an', label: '白石杏', ids: [10], aliases: ['an'] },
    { key: 'akito', label: '东云彰人', ids: [11], aliases: ['akt', 'akito'] },
    { key: 'toya', label: '青柳冬弥', ids: [12], aliases: ['toya'] },
  ]},
  { id: 'ws', name: 'Wonderlands × Showtime', short: 'WxS', characters: [
    { key: 'tsukasa', label: '天马司', ids: [13], aliases: ['tks', 'tsukasa'] },
    { key: 'emu', label: '凤笑梦', ids: [14], aliases: ['emu'] },
    { key: 'nene', label: '草薙宁宁', ids: [15], aliases: ['nene'] },
    { key: 'rui', label: '神代类', ids: [16], aliases: ['rui'] },
  ]},
  { id: 'n25', name: '25時、ナイトコードで。', short: '25H', characters: [
    { key: 'kanade', label: '宵崎奏', ids: [17], aliases: ['knd', 'kanade'] },
    { key: 'mafuyu', label: '朝比奈真冬', ids: [18], aliases: ['mfy', 'mafuyu'] },
    { key: 'ena', label: '东云绘名', ids: [19], aliases: ['ena'] },
    { key: 'mizuki', label: '晓山瑞希', ids: [20], aliases: ['mzk', 'mizuki'] },
  ]},
  { id: 'vs', name: '虚拟歌手', short: 'VIRTUAL SINGER', characters: [
    { key: 'miku', label: '初音未来', ids: [21], aliases: ['miku', 'hatsune', 'hatsunemiku'] },
    { key: 'rin', label: '镜音铃', ids: [22], aliases: ['rin', 'kagaminerin'] },
    { key: 'len', label: '镜音连', ids: [23], aliases: ['len', 'kagaminelen'] },
    { key: 'luka', label: '巡音流歌', ids: [24], aliases: ['luka', 'megurineluka'] },
    { key: 'meiko', label: 'MEIKO', ids: [25], aliases: ['meiko'] },
    { key: 'kaito', label: 'KAITO', ids: [26], aliases: ['kaito'] },
  ]},
]

const ID_TO_CHAR = new Map<number, CharacterDef>()
const ALIAS_TO_CHAR = new Map<string, CharacterDef>()
for (const g of CHARACTER_GROUPS) {
  for (const ch of g.characters) {
    if (ch.ids) for (const id of ch.ids) ID_TO_CHAR.set(id, ch)
    if (ch.aliases) { for (const a of ch.aliases) ALIAS_TO_CHAR.set(a.toLowerCase(), ch) }
    ALIAS_TO_CHAR.set(ch.key.toLowerCase(), ch)
  }
}

const SORTED_ALIASES = Array.from(ALIAS_TO_CHAR.keys()).sort((a, b) => b.length - a.length)

function resolveCharacter(modelBase: string): CharacterDef | null {
  const lower = modelBase.toLowerCase()
  const stripped = lower.replace(/^v\d+_?/, '')
  const idMatch = stripped.match(/^0*(\d{1,3})/)
  if (idMatch) {
    const id = parseInt(idMatch[1], 10)
    const ch = ID_TO_CHAR.get(id)
    if (ch) return ch
  }
  for (const alias of SORTED_ALIASES) {
    if (alias.length < 2) continue
    const re = new RegExp(`(?:^|[^a-z])${alias}(?:[^a-z]|$)`, 'i')
    if (re.test(lower)) return ALIAS_TO_CHAR.get(alias) || null
  }
  return null
}

interface GroupView {
  id: string
  name: string
  short: string
  totalCount: number
  characters: Array<CharacterDef & { count: number }>
}

const groupedCharacters = computed<GroupView[]>(() => {
  const counter = new Map<string, number>()
  const unmatched = new Map<string, number>()
  for (const m of modelList.value) {
    const ch = resolveCharacter(m.modelBase)
    if (ch) counter.set(ch.key, (counter.get(ch.key) || 0) + 1)
    else unmatched.set(m.modelBase, (unmatched.get(m.modelBase) || 0) + 1)
  }
  const groups: GroupView[] = []
  for (const g of CHARACTER_GROUPS) {
    const chars = g.characters.map(ch => ({ ...ch, count: counter.get(ch.key) || 0 }))
    groups.push({ id: g.id, name: g.name, short: g.short, totalCount: chars.reduce((s, c) => s + c.count, 0), characters: chars })
  }
  if (unmatched.size > 0) {
    const others: Array<CharacterDef & { count: number }> = []
    for (const [base, cnt] of unmatched.entries()) others.push({ key: base, label: base, count: cnt })
    others.sort((a, b) => a.label.localeCompare(b.label))
    groups.push({ id: 'other', name: '未识别', short: 'OTHER', totalCount: others.reduce((s, c) => s + c.count, 0), characters: others })
  }
  return groups
})

const availableGroups = computed(() => groupedCharacters.value.filter(g => g.totalCount > 0))

interface LocalCharView {
  key: string
  label: string
  models: LocalModel[]
}

interface LocalModelGroupView {
  id: string
  name: string
  short: string
  totalCount: number
  characters: LocalCharView[]
  models: LocalModel[]
}

interface LocalCharViewExtended extends LocalCharView {
  groupName: string
  groupShort: string
}

const allLocalCharacters = computed<LocalCharViewExtended[]>(() => {
  const result: LocalCharViewExtended[] = []
  for (const gDef of CHARACTER_GROUPS) {
    for (const chDef of gDef.characters) {
      const models: LocalModel[] = []
      for (const m of localModels.value) {
        const resolved = resolveCharacter(m.modelBase)
        if (resolved && resolved.key === chDef.key) models.push(m)
      }
      if (models.length > 0) {
        result.push({ key: chDef.key, label: chDef.label, models, groupName: gDef.name, groupShort: gDef.short })
      }
    }
  }
  const otherModels = localModels.value.filter(m => !resolveCharacter(m.modelBase))
  if (otherModels.length > 0) {
    result.push({ key: 'other', label: '未识别', models: otherModels, groupName: '其他', groupShort: 'OTHER' })
  }
  return result
})

const localModelGroups = computed<LocalModelGroupView[]>(() => {
  const groups: LocalModelGroupView[] = []
  for (const gDef of CHARACTER_GROUPS) {
    const characters: LocalCharView[] = []
    let totalCount = 0
    for (const chDef of gDef.characters) {
      const models: LocalModel[] = []
      for (const m of localModels.value) {
        const resolved = resolveCharacter(m.modelBase)
        if (resolved && resolved.key === chDef.key) models.push(m)
      }
      if (models.length > 0) {
        characters.push({ key: chDef.key, label: chDef.label, models })
        totalCount += models.length
      }
    }
    if (totalCount > 0) {
      groups.push({ id: gDef.id, name: gDef.name, short: gDef.short, totalCount, characters, models: [] })
    }
  }
  const otherModels = localModels.value.filter(m => !resolveCharacter(m.modelBase))
  if (otherModels.length > 0) {
    groups.push({ id: 'other', name: '未识别', short: 'OTHER', totalCount: otherModels.length, characters: [], models: otherModels })
  }
  return groups
})

function modelMatchesCharacter(modelBase: string, ch: CharacterDef): boolean {
  if (ch.key === modelBase) return true
  const resolved = resolveCharacter(modelBase)
  return resolved?.key === ch.key
}

function selectGroup(group: GroupView) {
  if (group.totalCount === 0) return
  const next = new Set(selectedKeys.value)
  for (const ch of group.characters) {
    if (ch.count === 0) continue
    for (const m of modelList.value) {
      if (modelMatchesCharacter(m.modelBase, ch)) next.add(`${m.modelBase}/${m.modelName}`)
    }
  }
  selectedKeys.value = next
}

function deselectGroup(group: GroupView) {
  if (group.totalCount === 0) return
  const next = new Set(selectedKeys.value)
  for (const ch of group.characters) {
    if (ch.count === 0) continue
    for (const m of modelList.value) {
      if (modelMatchesCharacter(m.modelBase, ch)) next.delete(`${m.modelBase}/${m.modelName}`)
    }
  }
  selectedKeys.value = next
}

function toggleSelect(m: ModelEntry) {
  const key = `${m.modelBase}/${m.modelName}`
  const next = new Set(selectedKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selectedKeys.value = next
}

function clearSelection() { selectedKeys.value = new Set() }

function toggleGroupCollapse(id: string) {
  const next = new Set(collapsedGroups.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsedGroups.value = next
}

function expandAllChars() { collapsedGroups.value = new Set() }
function collapseAllChars() { expandedChar.value = ''; collapsedGroups.value = new Set(availableGroups.value.map(g => g.id)) }

function getCharModels(ch: CharacterDef): ModelEntry[] { return modelList.value.filter(m => modelMatchesCharacter(m.modelBase, ch)) }
function getOtherModels(): ModelEntry[] { return modelList.value.filter(m => !resolveCharacter(m.modelBase)) }

function toggleCharExpand(ch: CharacterDef & { count: number }) {
  if (ch.count === 0) return
  expandedChar.value = expandedChar.value === ch.key ? '' : ch.key
}

function selectCharacterModels(ch: CharacterDef & { count: number }) {
  if (ch.count === 0) return
  const next = new Set(selectedKeys.value)
  for (const m of getCharModels(ch)) next.add(`${m.modelBase}/${m.modelName}`)
  selectedKeys.value = next
}

function deselectCharacterModels(ch: CharacterDef & { count: number }) {
  if (ch.count === 0) return
  const next = new Set(selectedKeys.value)
  for (const m of getCharModels(ch)) next.delete(`${m.modelBase}/${m.modelName}`)
  selectedKeys.value = next
}

function selectLocalModel(path: string) { selectedLocalPath.value = path; applyLocalModel() }

function openLocalCharDetail(ch: LocalCharViewExtended) {
  localCharDetail.value = ch
}

function closeLocalCharDetail() {
  localCharDetail.value = null
}

const hasFinishedTasks = computed(() => downloadTasks.value.some(t => t.status !== 'running'))

function clearFinishedTasks() {
  const remaining: DownloadTask[] = []
  taskMap.clear()
  for (const t of downloadTasks.value) {
    if (t.status === 'running') { taskMap.set(t.taskId, remaining.length); remaining.push(t) }
  }
  downloadTasks.value = remaining
}

async function fetchModelList() {
  if (!window.electronAPI) return
  loadingList.value = true; listError.value = ''
  try {
    const result = await window.electronAPI.downloaderFetchList()
    if (result.ok && result.data) {
      modelList.value = result.data
      const next = new Set(collapsedGroups.value); next.add('other'); collapsedGroups.value = next
    } else { listError.value = result.error || '获取失败' }
  } catch (e: any) { listError.value = e?.message || String(e) }
  finally { loadingList.value = false }
}

async function chooseModelDir() {
  if (!window.electronAPI) return
  const result = await window.electronAPI.downloaderChooseDir(settings.live2d.customModelDir)
  if (result.ok && result.path) { settings.live2d.customModelDir = result.path; await refreshLocalModels() }
}

async function refreshLocalModels() {
  if (!window.electronAPI) return
  const dir = settings.live2d.customModelDir
  if (!dir) { localModels.value = []; return }
  try {
    const result = await window.electronAPI.downloaderScanLocal(dir)
    if (result.ok && result.data) localModels.value = result.data
  } catch (e) { console.error('[Settings] scan local failed:', e) }
}

function applyLocalModel() { if (selectedLocalPath.value) settings.live2d.selectedModel = selectedLocalPath.value }

async function deleteLocalModel(m: LocalModel) {
  const api = window.electronAPI
  if (!api) { alert('Electron API 未就绪'); return }
  if (typeof api.downloaderDeleteModel !== 'function') {
    alert('删除功能不可用，请重启应用后重试')
    return
  }
  try {
    const result = await api.downloaderDeleteModel(m.localPath)
    if (result.ok) {
      if (selectedLocalPath.value === m.path) {
        selectedLocalPath.value = ''
        settings.live2d.selectedModel = ''
      }
      localModels.value = localModels.value.filter(lm => lm.localPath !== m.localPath)
      await refreshLocalModels()
    } else if (result.error !== '已取消') {
      alert(`删除失败：${result.error || '未知错误'}`)
    }
  } catch (e: any) {
    console.error('[Settings] deleteLocalModel error:', e)
    alert(`删除出错：${e?.message || String(e)}`)
  }
}

async function startDownload() {
  if (!window.electronAPI) { alert('Electron API 未就绪'); return }
  const saveRoot = settings.live2d.customModelDir || ''
  if (!saveRoot) {
    const r = await window.electronAPI.downloaderChooseDir()
    if (r.ok && r.path) settings.live2d.customModelDir = r.path
    else { alert('请先选择保存目录'); return }
  }
  const models = modelList.value.filter(m => selectedKeys.value.has(`${m.modelBase}/${m.modelName}`))
  if (models.length === 0) return
  downloading.value = true; taskMap.clear()
  const placeholders: DownloadTask[] = models.map(m => ({
    taskId: 'pending-' + m.modelBase + '/' + m.modelName, modelKey: `${m.modelBase}/${m.modelName}`, modelName: m.modelName,
    total: 0, done: 0, failed: 0, skipped: 0, status: 'running' as const, message: '正在请求主进程...',
  }))
  downloadTasks.value = placeholders
  const plainModels = models.map(m => ({ modelBase: m.modelBase, modelName: m.modelName, modelPath: m.modelPath, modelFile: m.modelFile }))
  const result = await window.electronAPI.downloaderStart({ models: plainModels, saveRoot: settings.live2d.customModelDir, concurrency: downloadConcurrency.value })
  if (!result.ok) {
    downloading.value = false
    downloadTasks.value = downloadTasks.value.map(t => ({ ...t, status: 'error' as const, message: result.error || '启动失败' }))
    alert(result.error || '启动下载失败'); return
  }
  if (result.taskIds) {
    const realTasks: DownloadTask[] = []; taskMap.clear()
    for (let i = 0; i < models.length; i++) {
      const m = models[i], taskId = result.taskIds[i]
      if (!taskId) continue
      taskMap.set(taskId, realTasks.length)
      realTasks.push({ taskId, modelKey: `${m.modelBase}/${m.modelName}`, modelName: m.modelName, total: 0, done: 0, failed: 0, skipped: 0, status: 'running', message: '准备中...' })
    }
    downloadTasks.value = realTasks
  }
}

async function cancelAllDownloads() { if (!window.electronAPI) return; await window.electronAPI.downloaderCancelAll() }

function statusLabel(s: string) { return s === 'running' ? '下载中' : s === 'success' ? '完成' : s === 'error' ? '失败' : '已取消' }

function taskPercent(t: DownloadTask): number {
  if (!t.total || t.total <= 0) return t.status === 'success' ? 100 : 0
  if (t.status === 'success') return 100
  const finished = t.done + t.failed
  return Math.max(0, Math.min(100, Math.floor((finished / t.total) * 100)))
}

function truncateFile(name: string): string { return name.length <= 32 ? name : '…' + name.slice(-30) }

const summary = computed(() => {
  let total = 0, completed = 0, running = 0, success = 0, error = 0, cancelled = 0
  for (const t of downloadTasks.value) {
    if (t.status === 'running') running++
    else if (t.status === 'success') success++
    else if (t.status === 'error') error++
    else if (t.status === 'cancelled') cancelled++
    total += t.total || 0; completed += t.done + t.failed
  }
  return { total, completed, running, success, error, cancelled, percent: total > 0 ? Math.floor((completed / total) * 100) : 0 }
})

onMounted(async () => {
  if (!window.electronAPI) return
  unsubProgress = window.electronAPI.onDownloaderProgress((data: DownloadTask) => {
    const list = [...downloadTasks.value]
    const idx = taskMap.get(data.taskId)
    if (idx === undefined) { taskMap.set(data.taskId, list.length); list.push({ ...data }) }
    else if (idx >= 0 && idx < list.length) { list[idx] = { ...data } }
    else { taskMap.set(data.taskId, list.length); list.push({ ...data }) }
    downloadTasks.value = list
    const allDone = list.length > 0 && list.every(t => t.status !== 'running')
    if (allDone) { downloading.value = false; refreshLocalModels() }
  })
  await refreshLocalModels()
})

onUnmounted(() => { unsubProgress?.() })
</script>

<style scoped>
.settings-view {
  width: 100%;
  height: 100vh;
  display: flex;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 侧边栏 ===== */
.settings-sidebar {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, color-mix(in srgb, var(--bg-secondary) 97%, var(--bg-primary)) 100%);
  border-right: 1px solid var(--border);
}

.sidebar-header {
  padding: 22px 18px 14px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--accent);
}

.sidebar-logo h2 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: 4px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  position: relative;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 2px 2px 0;
  background: var(--accent);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  opacity: 0.85;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 14px 10px 18px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 500;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s ease;
}
.footer-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}
.footer-btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  font-weight: 600;
}
.footer-btn.primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 2px 12px var(--accent-dim);
  transform: translateY(-1px);
}
.footer-btn.primary:active { transform: translateY(0) scale(0.98); }
.footer-btn.danger {
  color: #f38ba8;
  background: rgba(243, 139, 168, 0.08);
  border-color: rgba(243, 139, 168, 0.2);
}
.footer-btn.danger:hover {
  background: rgba(243, 139, 168, 0.18);
  border-color: rgba(243, 139, 168, 0.4);
}

.footer-actions {
  display: flex;
  gap: 6px;
}
.footer-actions .footer-btn {
  flex: 1;
  padding: 7px;
}

/* ===== 主内容区 ===== */
.settings-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px 36px 80px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}
.settings-main::-webkit-scrollbar { width: 5px; }
.settings-main::-webkit-scrollbar-track { background: transparent; }
.settings-main::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
.settings-main::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

.main-content {
  max-width: 720px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.page-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  background: var(--accent-dim);
  color: var(--accent);
  flex-shrink: 0;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
  line-height: var(--line-height-base);
}

/* ===== 设置卡片 ===== */
.setting-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
  margin-bottom: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.setting-card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.card-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  color: var(--accent);
  flex-shrink: 0;
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.card-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 2px 10px;
  border-radius: 999px;
}

.card-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.card-title-bar .card-title {
  margin: 0;
  padding: 0;
  border: none;
}

.card-actions {
  display: flex;
  gap: 6px;
}

/* ===== 设置行 ===== */
.setting-row {
  margin-bottom: 16px;
}
.setting-row:last-child {
  margin-bottom: 0;
}
.setting-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.setting-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-value {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-variant-numeric: tabular-nums;
}

.setting-field input[type="text"],
.setting-field input[type="number"],
.setting-field input[type="password"],
.setting-field select,
.setting-field textarea {
  width: 100%;
  padding: 9px 13px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.setting-field input:hover,
.setting-field select:hover,
.setting-field textarea:hover {
  border-color: var(--border-hover);
}

.setting-field input:focus,
.setting-field select:focus,
.setting-field textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2.5px var(--accent-dim);
}

.setting-field input:focus-visible,
.setting-field select:focus-visible,
.setting-field textarea:focus-visible {
  outline: none;
}

.setting-field select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 32px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c7086' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
}

.setting-field textarea {
  resize: vertical;
  min-height: 60px;
  line-height: var(--line-height-base);
}

.setting-field input[type="range"] {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-hover);
  outline: none;
  cursor: pointer;
  padding: 0;
  border: none;
}

.setting-field input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--bg-primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}
.setting-field input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.input-with-btn {
  display: flex;
  gap: 6px;
}
.input-with-btn input {
  flex: 1;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}
.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
  border-color: var(--border-hover);
}

/* ===== 按钮 ===== */
.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
.primary-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 4px 16px var(--accent-dim);
  transform: translateY(-1px);
}
.primary-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.primary-btn.small { padding: 6px 14px; font-size: var(--font-size-xs); }

.mini-btn {
  padding: 5px 12px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.2s ease;
}
.mini-btn:hover:not(:disabled) {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--accent);
}
.mini-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mini-btn.danger { color: #f38ba8; background: rgba(243, 139, 168, 0.08); border-color: rgba(243, 139, 168, 0.2); }
.mini-btn.danger:hover { background: rgba(243, 139, 168, 0.18); border-color: rgba(243, 139, 168, 0.4); }

/* ===== 开关 ===== */
.toggle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.toggle input:checked + .toggle-track {
  background: var(--accent);
  border-color: var(--accent);
}
.toggle input:checked + .toggle-track::after {
  left: 22px;
  background: #fff;
}
.toggle:hover .toggle-track { border-color: var(--border-hover); }
.toggle:hover input:checked + .toggle-track { border-color: var(--accent-hover); background: var(--accent-hover); }
.toggle-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-left: 10px;
  transition: color 0.2s ease;
}
.toggle:hover .toggle-label { color: var(--text-primary); }

/* ===== Banner ===== */
.banner {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.banner.success {
  background: rgba(166, 227, 161, 0.1);
  color: #a6e3a1;
  border: 1px solid rgba(166, 227, 161, 0.25);
}
.banner.error {
  background: rgba(243, 139, 168, 0.1);
  color: #f38ba8;
  border: 1px solid rgba(243, 139, 168, 0.25);
}
.banner-actions { display: flex; gap: 6px; align-items: center; }

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.empty-icon {
  color: var(--text-muted);
  opacity: 0.5;
  margin-bottom: 12px;
}
.empty-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* ===== 下载进度 ===== */
.dl-summary {
  margin-bottom: 14px;
}
.dl-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.dl-summary-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-primary); }
.dl-summary-value { font-size: var(--font-size-xs); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.dl-summary-value b { color: var(--accent); font-weight: 700; margin-left: 6px; }
.dl-summary-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-hover);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}
.dl-summary-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.dl-summary-stats { display: flex; flex-wrap: wrap; gap: 6px; }
.stat-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
}
.stat-pill.running { color: var(--accent); background: var(--accent-dim); }
.stat-pill.success { color: #a6e3a1; background: rgba(166, 227, 161, 0.15); }
.stat-pill.error { color: #f38ba8; background: rgba(243, 139, 168, 0.15); }
.stat-pill.cancelled { color: var(--text-muted); background: var(--bg-hover); }

.dl-task-list { display: flex; flex-direction: column; gap: 8px; }
.dl-task {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  transition: border-color 0.2s ease;
}
.dl-task.status-success { border-color: rgba(166, 227, 161, 0.3); }
.dl-task.status-error { border-color: rgba(243, 139, 168, 0.3); }
.dl-task.status-cancelled { opacity: 0.7; }
.dl-task-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 12px; }
.dl-task-right { display: inline-flex; align-items: center; gap: 8px; }
.dl-task-percent { font-size: var(--font-size-xs); font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }
.dl-task-name { font-size: var(--font-size-xs); color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
.dl-task-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-xs); white-space: nowrap; }
.dl-task-status.running { color: var(--accent); background: var(--accent-dim); }
.dl-task-status.success { color: #a6e3a1; background: rgba(166, 227, 161, 0.15); }
.dl-task-status.error { color: #f38ba8; background: rgba(243, 139, 168, 0.15); }
.dl-task-status.cancelled { color: var(--text-muted); background: var(--bg-hover); }
.dl-task-bar { width: 100%; height: 6px; background: var(--bg-hover); border-radius: 3px; overflow: hidden; position: relative; }
.dl-task-bar-fill { height: 100%; min-width: 4px; background: var(--accent); border-radius: 3px; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.dl-task-bar-fill.running { background: linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 50%, var(--accent) 100%); background-size: 200% 100%; animation: dl-stripe 1.2s linear infinite; }
.dl-task-bar-fill.indeterminate { background: linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 50%, var(--accent) 100%); background-size: 100% 100%; animation: dl-indeterminate 1.4s ease-in-out infinite; }
.dl-task-bar-fill.success { background: #a6e3a1; }
.dl-task-bar-fill.error { background: #f38ba8; }
.dl-task-bar-fill.cancelled { background: var(--text-muted); }

@keyframes dl-stripe { 0% { background-position: 0% 0; } 100% { background-position: -200% 0; } }
@keyframes dl-indeterminate { 0% { margin-left: -45%; } 50% { margin-left: 55%; } 100% { margin-left: -45%; } }

.dl-task-meta { font-size: 11px; color: var(--text-muted); margin-top: 6px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.dl-task-file { color: var(--text-secondary); font-family: 'Consolas', monospace; background: var(--bg-hover); padding: 1px 6px; border-radius: var(--radius-xs); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dl-task-msg { color: var(--text-secondary); }
.meta-pill { display: inline-flex; align-items: center; padding: 1px 8px; border-radius: 999px; background: var(--bg-hover); color: var(--text-secondary); font-variant-numeric: tabular-nums; font-weight: 500; font-size: 11px; }
.meta-pill.skipped { color: var(--text-muted); }
.meta-pill.failed { color: #f38ba8; }

/* ===== 分组浏览 ===== */
.group-list { display: flex; flex-direction: column; gap: 10px; }
.group-block { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; transition: all 0.2s ease; }
.group-block:hover { border-color: var(--border-hover); }
.group-header { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
.group-title { display: flex; align-items: center; gap: 8px; }
.group-arrow { color: var(--text-muted); transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0; }
.group-block.collapsed .group-arrow { transform: rotate(-90deg); }
.group-short { font-size: 10px; font-weight: 700; color: var(--accent); background: var(--accent-dim); padding: 2px 8px; border-radius: var(--radius-xs); letter-spacing: 0.5px; }
.group-name { font-size: var(--font-size-sm); color: var(--text-primary); font-weight: 600; }
.group-count { font-size: 10px; font-weight: 600; color: var(--text-muted); background: var(--bg-hover); padding: 1px 8px; border-radius: 999px; margin-left: 4px; }
.group-actions { display: flex; gap: 6px; }
.group-btn { font-size: var(--font-size-xs); font-weight: 500; color: var(--text-secondary); background: var(--bg-hover); border: 1px solid var(--border); padding: 3px 10px; border-radius: var(--radius-xs); cursor: pointer; transition: all 0.2s ease; }
.group-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
.group-btn.deselect { color: var(--text-secondary); background: var(--bg-tertiary); }
.group-btn.deselect:hover { background: rgba(243, 139, 168, 0.2); color: #f38ba8; border-color: rgba(243, 139, 168, 0.4); }

.char-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; margin-top: 8px; }
.char-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; transition: all 0.2s ease; display: flex; flex-direction: column; }
.char-card.active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); grid-column: 1 / -1; }
.char-card.disabled { opacity: 0.5; }
.char-card-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; cursor: pointer; user-select: none; transition: background 0.2s ease; }
.char-card.disabled .char-card-header { cursor: not-allowed; }
.char-card:not(.disabled) .char-card-header:hover { background: var(--bg-hover); }
.char-card-title { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.char-arrow { color: var(--text-muted); transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0; transform: rotate(-90deg); }
.char-card.active .char-arrow { transform: rotate(0deg); color: var(--accent); }
.char-name { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.char-card.active .char-name { color: var(--accent); font-weight: 600; }
.char-count { font-size: 10px; background: rgba(255,255,255,0.18); padding: 1px 6px; border-radius: 8px; color: inherit; font-weight: 600; }
.char-card:not(.active) .char-count { background: var(--bg-hover); color: var(--text-muted); }
.char-card-actions { display: flex; gap: 6px; flex-shrink: 0; }
.char-models { border-top: 1px solid var(--border); background: var(--bg-tertiary); max-height: 360px; overflow-y: auto; }
.char-models::-webkit-scrollbar { width: 6px; }
.char-models::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
.char-models-empty { padding: 14px; font-size: var(--font-size-xs); color: var(--text-muted); text-align: center; }

.model-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 4px; padding: 8px; }
.model-grid .dl-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid transparent; border-radius: var(--radius-xs); cursor: pointer; transition: all 0.2s ease; }
.model-grid .dl-item:hover { background: var(--bg-hover); border-color: var(--border-hover); }
.model-grid .dl-item.selected { border-color: var(--accent); background: var(--accent-dim); }
.model-grid .dl-item input[type="checkbox"] { accent-color: var(--accent); flex-shrink: 0; }
.dl-item-info { flex: 1; min-width: 0; }
.dl-item-name { font-size: var(--font-size-xs); color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dl-item-base { font-size: 11px; color: var(--text-muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.other-group-actions { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: 4px; }
.other-tip { font-size: var(--font-size-xs); color: var(--text-muted); }

/* ===== 已下载模型 - 人物网格 ===== */
.local-model-browser { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; }
.local-model-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.local-model-count { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-muted); }
.local-model-actions { display: flex; gap: 6px; }

.char-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
.char-tile {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.char-tile:hover {
  border-color: var(--accent);
  background: var(--accent-dim);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.char-tile.active {
  border-color: var(--accent);
  background: var(--accent-dim);
  box-shadow: 0 0 0 2px var(--accent-dim);
}
.char-tile-avatar {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius);
  background: var(--accent-dim);
  color: var(--accent);
  flex-shrink: 0;
}
.char-tile-info { flex: 1; min-width: 0; }
.char-tile-name { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.char-tile-group { font-size: 10px; color: var(--text-muted); margin-top: 2px; font-weight: 500; }
.char-tile-count {
  font-size: 11px; font-weight: 700; color: var(--accent);
  background: var(--accent-dim); padding: 2px 8px;
  border-radius: 999px; flex-shrink: 0;
}
.char-tile-arrow { color: var(--text-muted); flex-shrink: 0; transition: color 0.2s ease, transform 0.2s ease; }
.char-tile:hover .char-tile-arrow { color: var(--accent); transform: translateX(2px); }

/* ===== 人物详情页 ===== */
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; margin-right: 8px;
  font-size: var(--font-size-xs); font-weight: 500;
  color: var(--text-secondary); background: var(--bg-tertiary);
  border: 1px solid var(--border); border-radius: var(--radius-xs);
  cursor: pointer; transition: all 0.2s ease;
}
.back-btn:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-hover); }
.char-detail-models { display: flex; flex-direction: column; gap: 4px; }
.char-detail-models .detail-item { padding: 10px 12px; }

.local-model-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--radius-xs); cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; }
.local-model-item:hover { background: var(--bg-hover); border-color: var(--border-hover); }
.local-model-item.active { background: var(--accent-dim); border-color: var(--accent); }
.local-model-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0; transition: background 0.2s ease, box-shadow 0.2s ease; }
.local-model-dot.active { background: var(--accent); box-shadow: 0 0 6px var(--accent-dim); }
.local-model-info { flex: 1; min-width: 0; }
.local-model-name { font-size: var(--font-size-xs); color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.local-model-base { font-size: 11px; color: var(--text-muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.delete-model-btn {
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-xs); background: transparent; border: 1px solid transparent;
  color: var(--text-muted); cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; padding: 0;
}
.delete-model-btn:hover { background: rgba(243, 139, 168, 0.15); border-color: rgba(243, 139, 168, 0.3); color: #f38ba8; }

/* ===== Live2D 独立页面 ===== */
.live2d-page .page-header { border-bottom: none; margin-bottom: 20px; padding-bottom: 0; }
.live2d-page .page-header-text h1 { font-size: 22px; }
.page-header-actions { display: flex; gap: 8px; margin-left: auto; }

.live2d-model-page { padding: 4px 0; }

.detail-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.detail-title { display: flex; align-items: center; gap: 12px; flex: 1; }
.detail-avatar {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius);
  background: var(--accent-dim);
  color: var(--accent);
  flex-shrink: 0;
}
.detail-name { font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary); }
.detail-group { font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px; }

/* ===== 模型下载独立页面 ===== */
.download-page .page-header { border-bottom: none; margin-bottom: 16px; padding-bottom: 0; }
.download-page .page-header-text h1 { font-size: 22px; }

.download-progress-section,
.download-browse-section,
.download-search-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.section-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-primary);
}
.section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 6px;
}
.search-field input {
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: var(--font-size-xs);
  width: 160px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2.5px var(--accent-dim);
  outline: none;
}
.search-field input::placeholder { color: var(--text-muted); }

/* ===== 测试结果 ===== */
.test-result { margin-left: 12px; font-size: var(--font-size-sm); font-weight: 500; }
.test-result.success { color: #a6e3a1; }
.test-result.error { color: #f38ba8; }

/* ===== 内容区入场动画 ===== */
.content-enter {
  animation: contentFadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes contentFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===== 动画 ===== */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { display: inline-block; animation: spin 1s linear infinite; }

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .settings-sidebar { width: 60px; }
  .sidebar-header { padding: 16px 8px 8px; }
  .sidebar-logo h2 { display: none; }
  .nav-label { display: none; }
  .nav-item { justify-content: center; padding: 10px; }
  .nav-item.active::before { left: -10px; width: 3px; }
  .settings-main { padding: 16px; }
  .setting-row.two-col { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>