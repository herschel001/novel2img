# Novel2Img - AI生图浏览器插件

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/novel2img)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-green.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

## 📋 项目简介

Novel2Img 是一个强大的Chrome浏览器插件，专门为创作者和设计师打造。让你在浏览网页时随时随地生成精美图片，提升创作效率。

## 🚀 主要功能

### ✨ 当前版本 (v1.0.0) 功能特性

- **🎨 一键生图**: 在任何网页上通过插件弹窗快速生成图片
- **🖼️ 多图选择**: 一次生成3张不同的图片供用户选择
- **📋 一键复制**: 生成后可直接复制图片，在任意编辑器中粘贴使用
- **🔍 大图预览**: 点击放大镜查看高清大图，支持键盘ESC关闭
- **💾 状态持久化**: 切换标签页或关闭浏览器后自动保存生成进度和结果
- **🖼️ 多服务集成**: 集成魔搭（ModelScope）等主流AI生图服务
- **💾 本地管理**: 生成的图片可选择保存到浏览器下载文件夹
- **⚡ 实时预览**: 弹出窗口实时显示生成进度和结果
- **🔧 灵活配置**: 支持图片尺寸设置等个性化选项
- **📱 响应式界面**: 适配不同屏幕尺寸，提供一致的用户体验

### 🎯 支持的AI服务

- **魔搭（ModelScope）**
  - `Qwen/Qwen-Image` - 千问生图模型（推荐）


### 📐 支持的图片规格

- `512x512` - 标准正方形（社交媒体头像）
- `1024x1024` - 高清正方形（海报、壁纸）
- `768x512` - 横向矩形（横幅、封面）
- `512x768` - 纵向矩形（移动端壁纸）

## 🔧 安装与配置

### 系统要求

- Chrome浏览器 >= 88.0
- 支持Manifest V3的现代浏览器
- 稳定的网络连接

### 安装方式

#### 方式一：开发者模式安装（推荐）

1. 下载项目源码到本地
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目根目录文件夹
6. 插件安装完成！

#### 方式二：Chrome Web Store（计划中）

- 即将上架Chrome应用商店，敬请期待

### API密钥配置

插件需要配置AI服务的API密钥才能正常工作。

#### 获取魔搭API密钥

1. 访问 [魔搭社区](https://modelscope.cn/)
2. 注册并登录账户
3. 进入个人中心 → API Token
4. 创建新的Token

#### 在插件中配置密钥

1. 点击浏览器工具栏中的插件图标
2. 在弹出窗口中点击「设置」
3. 输入你的API密钥
4. 点击「保存」完成配置

**测试密钥**: `ms-7bf36b6e-acbb-4d95-9d7f-fa707cc652fb`
> ⚠️ 注意：这是测试密钥，有使用限制。建议申请个人专用密钥以获得更好体验。

## 📖 使用说明

### 快速开始

1. **安装插件**：按照上述安装步骤完成插件安装
2. **配置密钥**：设置你的API密钥
3. **开始生图**：选择以下任一方式开始使用

### 使用方式

#### 插件弹窗

1. 点击浏览器工具栏中的插件图标
2. 在弹出窗口中输入提示词
3. 调整生成参数（尺寸等）
4. 点击「开始生成」
5. 选择喜欢的图片，点击「复制图片」或「下载到本地」
6. 在任意编辑器中粘贴使用（Ctrl+V）

#### 🔍 大图查看

1. 在图片选择界面中，点击左上角放大镜图标
2. 在大图界面中直接操作：复制或下载
3. 按ESC键或点击背景关闭大图

#### 💾 状态持久化

插件具有强大的状态持久化功能：

- **生成中状态保存**: 如果在生成过程中切换标签页，再回来时会显示实时进度和已耗时间
- **结果状态恢复**: 生成完成后关闭浏览器，重新打开时图片仍然存在
- **智能超时处理**: 生成时间过长（超过5分钟）会自动提示可能已经超时
- **自动状态清理**: 30分钟后自动清理过期状态，保持系统整洁

使用场景示例：
- 生成图片时接到电话 → 回来时看到生成进度
- 生成完成后去吃饭 → 回来时图片还在
- 生成完成后关闭电脑 → 第二天打开还能看到图片

### 功能演示

#### 生成示例
- **提示词**: `"坐在窗边写作业的少女，温暖的阳光，美丽的画面"`
- **尺寸**: `1024x1024`
- **模型**: `Qwen/Qwen-Image`
- **预期效果**: 生成温馨的学习场景图片

#### 生成进度显示
```
🚀 开始生成图片...
📝 提示词: "坐在窗边写作业的少女，温暖的阳光，美丽的画面"
⏳ 任务提交中...
🔄 正在生成第 1 张图片...
🔄 正在生成第 2 张图片...
🔄 正在生成第 3 张图片...
✅ 生成完成！共 3 张图片
💡 点击选择喜欢的图片，然后复制或下载
```

## 📁 项目结构

```
novel2img/
├── README.md                 # 项目说明文档
├── manifest.json            # Chrome插件配置文件
├── popup/                   # 插件弹窗界面
│   ├── popup.html          # 弹窗HTML结构
│   ├── popup.js            # 弹窗交互逻辑
│   └── popup.css           # 弹窗样式文件
├── background/              # 后台脚本
│   └── background.js       # 后台服务逻辑
├── icons/                   # 插件图标资源
│   ├── icon16.png          # 16x16 图标
│   ├── icon48.png          # 48x48 图标
│   └── icon128.png         # 128x128 图标
├── lib/                     # 公共库文件
│   ├── api-client.js       # API调用封装
│   └── utils.js            # 工具函数
```

## 🔍 技术架构

### 插件架构

本插件采用Chrome Extension Manifest V3架构：

1. **Background Script**: 处理API调用和数据管理
2. **Popup**: 提供主要的用户界面和设置面板

### 核心组件

```javascript
// Background Script - API调用示例
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateImage') {
        generateImageAsync(request.prompt, request.options)
            .then(result => sendResponse({success: true, data: result}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true; // 异步响应
    }
});
```

### 权限说明

插件需要以下权限：
- `activeTab`: 访问当前活动标签页
- `storage`: 保存用户设置、API密钥和生成状态（实现状态持久化）
- `downloads`: 下载生成的图片
- `host_permissions`: 访问AI服务API

## 🐛 常见问题

### Q: 插件安装后无法使用
**A**: 
1. 确认已开启开发者模式
2. 检查插件是否已启用
3. 刷新网页后重试
4. 查看浏览器控制台是否有错误信息

### Q: 生成图片失败
**A**: 
1. 检查API密钥是否正确配置
2. 确认网络连接正常
3. 提示词是否包含敏感内容
4. 查看插件弹窗中的错误提示

### Q: 图片下载位置在哪里？
**A**: 图片默认下载到浏览器设置的下载文件夹，文件名格式为 `novel2img_generated_[时间戳].jpg`

### Q: 如何提高图片生成质量？
**A**: 
1. 使用详细、具体的描述词
2. 指定艺术风格（如"水彩画风格"、"写实风格"）
3. 添加光线描述（如"柔和光线"、"黄金时刻"）
4. 选择合适的图片尺寸

### Q: 支持哪些语言的提示词？
**A**: 目前主要支持中文和英文提示词，中文描述效果良好，无需翻译

### Q: 切换标签页后生成进度或结果丢失怎么办？
**A**: 
插件已内置状态持久化功能，无需担心：
1. **生成中**: 切换标签页再回来时会显示实时进度和已耗时间
2. **生成完成**: 关闭浏览器或插件后再打开，图片结果仍然存在
3. **超时保护**: 超过5分钟的生成任务会自动提示可能已超时
4. **自动清理**: 30分钟后自动清理过期状态，保持系统整洁

## 🔄 版本历史

### v1.0.0 (2024-08-28) - 首发版本
- ✨ 基础插件架构和Manifest V3支持
- 🎨 魔搭API集成和异步生图功能
- 🖼️ 一次生成3张图片供用户选择
- 📋 一键复制图片功能，支持粘贴到任意编辑器
- 📱 响应式弹窗界面设计
- 💾 API密钥安全存储
- 📥 灵活的图片下载功能
- 🔧 完整的错误处理机制

## 📝 开发计划

### v1.1.0 - 功能增强版（计划中）
- 🎨 支持更多AI服务（Midjourney、DALL-E等）
- 📊 生成历史记录和管理
- 🎛️ 高级参数配置（步数、引导强度等）
- 🖼️ 批量生成和模板功能
- 🌐 多语言界面支持

### v1.2.0 - 专业版（规划中）
- 🔄 图片编辑和后处理功能
- 📁 云存储集成（支持同步到网盘）
- 🤖 智能提示词建议
- 📈 使用统计和分析
- 🎯 针对特定网站的优化集成

## 🤝 贡献指南

欢迎参与项目开发！

### 如何贡献
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发环境
1. 克隆项目到本地
2. 在Chrome中加载开发版插件
3. 修改代码后刷新插件进行测试

## 🔒 隐私与安全

- **API密钥**: 仅存储在本地浏览器中，不会上传到任何服务器
- **生成记录**: 所有操作记录仅保存在本地
- **网络请求**: 仅向配置的AI服务发送必要的生成请求
- **权限最小化**: 插件仅请求必要的浏览器权限

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [Chrome扩展程序开发文档](https://developer.chrome.com/docs/extensions/)
- [魔搭社区](https://modelscope.cn/)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/mv3/)
- [Qwen-Image模型文档](https://modelscope.cn/models/Qwen/Qwen-Image)

## 💬 反馈与支持

- 🐛 [报告Bug](https://github.com/your-repo/novel2img/issues)
- 💡 [功能建议](https://github.com/your-repo/novel2img/discussions)
- 📧 邮件联系: your-email@example.com

---

**🎯 快速开始**: 安装插件后点击工具栏图标，开始你的第一次AI生图体验！