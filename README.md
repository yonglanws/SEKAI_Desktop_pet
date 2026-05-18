# SEKAI Desktop Pet 🐱

一款基于 Electron + Vue 3 + PixiJS 的桌面 Live2D 桌宠应用，搭载 AI 对话功能。初期开发中

## ✨ 特性

- **Live2D 模型** — 使用 PixiJS + Live2D Cubism 5 渲染，支持表情和动作切换
- **AI 对话** — 接入 OpenAI 兼容 API，支持自定义系统提示词（人设）
- **动作联动** — AI 回复时自动根据内容使用 `[动作:xxx]` 标记播放对应动作和表情
- **摸摸头** — 点击模型触发害羞/开心反应，连续点击有不同反馈
- **毛玻璃聊天框** — 美观的聊天气泡界面
- **透明窗口** — 无边框透明窗口，完美融入桌面

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm / pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run electron:dev
```

### 构建

```bash
npm run electron:build
```

## ⚙️ 配置

启动后点击聊天框旁的齿轮按钮打开设置：

| 配置项     | 说明                       |
| ------- | ------------------------ |
| API 端点  | OpenAI 兼容 API 地址         |
| API Key | 你的 API 密钥                |
| 模型      | 使用的模型名称（如 gpt-3.5-turbo） |
| 系统提示词   | 自定义 AI 人设                |
| 模型缩放    | Live2D 模型大小              |
| 鼠标追踪    | 头部跟随鼠标的灵敏度               |

## 📁 项目结构

```
SEKAI_Desktop_pet/
├── electron/          # Electron 主进程
│   ├── main.ts        # 主进程入口
│   └── preload.ts     # 预加载脚本
├── public/
│   └── models/        # Live2D 模型文件
├── src/
│   ├── components/    # Vue 组件
│   ├── modules/
│   │   ├── chat/      # AI 对话模块
│   │   ├── live2d/    # Live2D 管理模块
│   │   └── settings/  # 设置管理
│   ├── types/         # TypeScript 类型定义
│   └── views/         # 页面视图
├── package.json
└── README.md
```

## 🎮 动作指令

AI 在回复中可使用 `[动作:动作名]` 来控制角色：

| 动作              | 效果   |
| --------------- | ---- |
| `[动作:smile]`    | 微笑   |
| `[动作:glad]`     | 开心挥手 |
| `[动作:nod]`      | 点头   |
| `[动作:wink]`     | 眨眼   |
| `[动作:shy]`      | 害羞   |
| `[动作:blushed]`  | 脸红   |
| `[动作:surprise]` | 惊讶   |
| `[动作:think]`    | 思考   |
| `[动作:tilthead]` | 歪头   |
| `[动作:sleepy]`   | 困倦   |

## 🛠 技术栈

- **Electron** — 桌面窗口
- **Vue 3** — UI 框架
- **PixiJS 8** — WebGL 渲染
- **pixi-live2d-engine** — Live2D Cubism 5 引擎
- **Vite** — 构建工具

## 📄 License

GPLv3
