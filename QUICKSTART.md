# Life29 快速开始指南

## 🚀 5分钟快速部署

### 方式一：本地运行（最简单）

```bash
# 1. 解压文件
unzip life29-gdrive.zip
cd life29-gdrive

# 2. 配置 Google API（见下方详细步骤）
# 编辑 config.js，填入你的客户端 ID

# 3. 启动本地服务器
python -m http.server 8000

# 4. 打开浏览器
# 访问 http://localhost:8000
```

### 方式二：部署到 GitHub Pages（推荐）

```bash
# 1. 创建 GitHub 仓库
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/life29.git
git push -u origin main

# 2. 在 GitHub 仓库设置中启用 Pages
# Settings → Pages → Source 选择 main 分支

# 3. 访问
# https://你的用户名.github.io/life29
```

---

## ⚙️ Google API 配置（核心步骤）

### 简化版（5步完成）

#### 1️⃣ 访问 Google Cloud Console
https://console.cloud.google.com/

#### 2️⃣ 创建项目
- 点击顶部项目选择器
- 点击"新建项目"
- 项目名称：`Life29`
- 点击"创建"

#### 3️⃣ 启用 API
- 搜索并启用 **Google Drive API**
- 直接访问：https://console.cloud.google.com/apis/library/drive.googleapis.com

#### 4️⃣ 配置 OAuth 同意屏幕
- 进入：OAuth 同意屏幕
- 选择"外部"→ 创建
- 应用名称：`Life29`
- 用户支持邮箱：你的邮箱
- 开发者联系信息：你的邮箱
- 保存并继续（其他都可以跳过）
- 添加测试用户：你的邮箱

#### 5️⃣ 创建客户端 ID
- 进入：凭据 → 创建凭据 → OAuth 客户端 ID
- 应用类型：**Web 应用**
- 名称：`Life29`
- 已获授权的 JavaScript 来源：
  ```
  http://localhost:8000
  https://你的用户名.github.io
  ```
- 点击"创建"
- **复制客户端 ID**

#### 6️⃣ 配置项目
编辑 `config.js`：
```javascript
const GOOGLE_CONFIG = {
    clientId: '粘贴你的客户端ID.apps.googleusercontent.com',
    // ...
};
```

---

## 📖 详细教程

如需图文详细教程，请查看：
- **GOOGLE_OAUTH_TUTORIAL.md** - OAuth 配置详细步骤
- **GDRIVE_SETUP.md** - 完整设置说明

---

## ✅ 完成检查清单

- [ ] Google Cloud 项目已创建
- [ ] Google Drive API 已启用
- [ ] OAuth 同意屏幕已配置
- [ ] OAuth 客户端 ID 已创建
- [ ] config.js 已填入客户端 ID
- [ ] 本地测试成功（能登录）
- [ ] GitHub 仓库已创建（可选）
- [ ] GitHub Pages 已启用（可选）

---

## 🎯 使用流程

1. **首次访问**：点击"登录 Google"
2. **授权**：允许应用访问 Google Drive
3. **使用**：点击"添加记录"开始记录生活
4. **分享**：把网址分享给朋友，他们登录后也能看到

---

## 💡 重要说明

### ✅ 数据存储
- 所有数据存在你的 Google Drive
- 文件名：`life29-posts.json`
- 图片文件夹：`life29-images`

### ✅ 权限说明
- 应用只能访问自己创建的文件
- 不会访问你的其他 Google Drive 文件
- 完全安全

### ✅ 多人使用
- 每个人都需要登录自己的 Google 账号
- 所有人共享同一份数据
- 第一个登录的人会在自己的 Drive 创建文件
- 其他人需要有该文件的访问权限

### ⚠️ 测试用户限制
- 应用在"测试"状态时，只有添加的测试用户能登录
- 如需更多人使用，在 OAuth 同意屏幕添加他们的邮箱
- 或者发布应用（需要 Google 审核）

---

## 🆘 遇到问题？

### 问题1：提示"此应用未经验证"
- 点击"高级" → "前往 Life29（不安全）"
- 这是正常的，因为应用在测试阶段

### 问题2：无法登录
- 检查 config.js 中的客户端 ID 是否正确
- 检查是否添加了正确的授权来源 URI
- 检查该用户是否在测试用户列表中

### 问题3：GitHub Pages 部署后无法登录
- 确保在 OAuth 客户端添加了 GitHub Pages 的 URL
- URL 格式：`https://用户名.github.io`（不要加项目名）

---

## 📞 获取帮助

查看详细文档：
- GOOGLE_OAUTH_TUTORIAL.md
- GDRIVE_SETUP.md
- README.md

祝使用愉快！🎉
