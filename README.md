# SEKAI Desktop Pet

一款基于 Electron + Vue 3 + PixiJS 的《世界计划》主题桌面 Live2D 桌宠应用，搭载 AI 对话功能。

## 特性

- **Live2D 模型渲染** — 使用 PixiJS + Live2D Cubism 5 渲染，支持表情和动作切换
- **模型下载管理** — 从 sekai.best 在线浏览并下载角色模型，按团体/角色分组，支持下载进度显示和删除
- **角色专属人设** — 26 位角色各有独立 AI 提示词，切换模型后自动适配对应角色语气
- **AI 对话** — 接入 OpenAI 兼容 API，支持自定义系统提示词，`{name}` 占位符自动替换为角色名
- **动作联动** — AI 回复时自动根据 `[动作:xxx]` 标记播放对应动作和表情
- **闲置动画** — 可开关的自动闲置动作，不同角色有不同动作风格（如宵崎奏偏向沉思/安静）
- **摸摸头** — 点击模型触发害羞/开心反应，连续点击有不同反馈
- **TTS 语音** — 支持语音合成，AI 回复时可自动朗读
- **毛玻璃聊天框** — 美观的聊天气泡界面
- **透明窗口** — 无边框透明窗口，完美融入桌面

## 快速开始

### 环境要求

- Node.js 18+
- npm / pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
node dev.js
```

### 构建

```bash
npm run electron:build
```

## 配置

启动后点击聊天框旁的齿轮按钮打开设置：

### AI 配置

| 配置项     | 说明                                                |
| ------- | ------------------------------------------------- |
| API 端点  | OpenAI 兼容 API 地址                                  |
| API Key | 你的 API 密钥                                         |
| 模型      | 使用的模型名称（如 gpt-3.5-turbo）                          |
| 系统提示词   | 自定义 AI 人设，支持 `{name}` 占位符自动替换为当前角色名              |

### Live2D 配置

| 配置项       | 说明                    |
| --------- | --------------------- |
| 模型缩放      | Live2D 模型大小           |
| 鼠标追踪      | 头部跟随鼠标的灵敏度            |
| 自动闲置动作    | 开关闲置时自动播放动作           |
| 纹理 LOD    | 模型纹理精度                |

### 模型下载

在设置页的「模型下载」标签页中，可以：
- 自定义模型保存目录
- 按团体（Leo/need、MORE MORE JUMP!、VBS、WxS、25时、虚拟歌手）浏览角色
- 选择并下载角色模型，支持下载进度显示
- 管理已下载模型，支持删除

## 项目结构

```
SEKAI_Desktop_pet/
├── electron/                  # Electron 主进程
│   ├── main.ts                # 主进程入口、窗口管理、协议注册
│   ├── preload.ts             # 预加载脚本
│   ├── model-downloader.ts    # 模型下载器
│   └── settings-manager.ts    # 设置持久化
├── public/
│   ├── models/                # 内置 Live2D 模型
│   └── motions/               # 共享动作库
├── src/
│   ├── components/            # Vue 组件
│   │   ├── ChatDialog.vue     # 聊天对话框
│   │   ├── Live2DCanvas.vue   # Live2D 渲染画布
│   │   └── WindowControls.vue # 窗口控制按钮
│   ├── data/
│   │   └── character-prompts/ # 角色专属 AI 提示词（.md 文件）
│   ├── modules/
│   │   ├── chat/              # AI 对话模块
│   │   ├── live2d/            # Live2D 管理模块
│   │   ├── settings/          # 设置管理
│   │   └── tts/               # TTS 语音合成
│   ├── types/                 # TypeScript 类型定义
│   └── views/                 # 页面视图
├── package.json
└── README.md
```

## 角色提示词

每个角色的 AI 提示词保存在 `src/data/character-prompts/` 目录下的独立 `.md` 文件中，格式如下：

```markdown
---
name: 初音未来
---

你是游戏世界计划的初音未来，是一位充满活力和好奇心的虚拟歌手...
```

编辑对应角色的 `.md` 文件即可自定义角色人设，新增角色只需添加新的 `.md` 文件。

## 动作指令

AI 在回复中可使用 `[动作:动作名]` 来控制角色：

| 动作              | 效果   |
| --------------- | ---- |
| `[动作:smile]`    | 微笑   |
| `[动作:glad]`     | 开心   |
| `[动作:nod]`      | 点头   |
| `[动作:wink]`     | 眨眼   |
| `[动作:shy]`      | 害羞   |
| `[动作:blushed]`  | 脸红   |
| `[动作:surprise]` | 惊喜   |
| `[动作:think]`    | 思考   |
| `[动作:tilthead]` | 歪头   |
| `[动作:sleepy]`   | 困倦   |
| `[动作:pose]`     | 摆姿势  |
| `[动作:greeting]` | 打招呼  |
| `[动作:delicious]`| 好吃   |

## 技术栈

- **Electron** — 桌面窗口
- **Vue 3** — UI 框架（Composition API）
- **PixiJS 8** — WebGL 渲染
- **pixi-live2d-engine** — Live2D Cubism 5 引擎
- **Vite** — 构建工具
- **TypeScript** — 类型安全

## License

GPLv3
