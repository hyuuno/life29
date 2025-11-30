# Life29 - Google Drive 版

个人时光记录网站，数据整齐存储在 Google Drive 的专属文件夹中。

## 📂 文件夹结构

所有数据都存储在你的 Google Drive 中的**独立文件夹**里：

```
你的 Google Drive 根目录/
└── Life29/                      ← 主文件夹（可在 config.js 中自定义）
    ├── posts.json               ← 所有记录数据
    └── images/                  ← 图片文件夹
        ├── 1701234567890_photo1.jpg
        ├── 1701234567891_photo2.jpg
        └── ...
```

### ✅ 整洁有序
- 所有 Life29 相关文件都在一个文件夹里
- 不会散落在 Drive 根目录
- 方便备份和管理

## ⚙️ 自定义文件夹名称

编辑 `config.js` 文件：

```javascript
const GOOGLE_CONFIG = {
    // 主文件夹名称（可以改成任何你喜欢的名字）
    mainFolderName: 'Life29',          // 改成 '生活记录'、'Memories' 等
    
    // 数据文件名
    dataFileName: 'posts.json',
    
    // 图片子文件夹名
    imagesFolderName: 'images',        // 改成 'photos'、'图片' 等
};
```

### 示例配置：

**中文文件夹：**
```javascript
mainFolderName: '生活记录',
imagesFolderName: '照片',
```
结果：`Google Drive / 生活记录 / posts.json` 和 `照片/`

**英文文件夹：**
```javascript
mainFolderName: 'Memories',
imagesFolderName: 'Photos',
```
结果：`Google Drive / Memories / posts.json` 和 `Photos/`

## 🚀 快速开始

### 1. 启动本地服务器

```bash
python -m http.server 8000
```

### 2. 打开浏览器

访问：`http://localhost:8000`

### 3. 登录并授权

- 点击"登录 Google"
- 授权应用访问 Google Drive
- 应用会自动在你的 Drive 创建文件夹

### 4. 开始使用

- 点击"添加记录"
- 填写内容并上传图片
- 所有数据自动保存到 Drive

## 📋 Client ID 配置

你的 OAuth Client ID 已配置：
```
1097251788392-il09f5pitva37upe7sevvk2ttulqmde5.apps.googleusercontent.com
```

## ⚠️ 添加测试用户

使用前必须在 Google Cloud Console 添加测试用户：

1. 访问：https://console.cloud.google.com/
2. 选择 `life29` 项目
3. 左侧菜单：**API 和服务** → **OAuth 同意屏幕**
4. 找到 **"测试用户"**
5. 点击 **"+ ADD USERS"**
6. 输入 Gmail 邮箱
7. 保存

## 💾 数据管理

### 查看数据
打开 Google Drive，进入 `Life29` 文件夹即可看到所有数据

### 备份数据
直接下载 `posts.json` 文件和 `images` 文件夹

### 分享访问
如果想让朋友也能使用：
1. 在 Google Drive 中右键 `Life29` 文件夹
2. 点击"共享"
3. 添加朋友的 Gmail
4. 给予"编辑"权限
5. 朋友也需要在测试用户列表中

## 🌐 部署到 GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/life29.git
git push -u origin main

# 在 GitHub 仓库设置中启用 Pages
```

访问：`https://你的用户名.github.io/life29`

## 🎯 工作原理

```
用户登录
    ↓
应用检查 Google Drive 中是否有 Life29 文件夹
    ↓
没有？→ 自动创建 Life29/posts.json 和 Life29/images/
有？→ 直接使用
    ↓
添加记录 → 保存到 Life29/posts.json
上传图片 → 保存到 Life29/images/
    ↓
所有授权用户看到相同数据
```

## 📖 详细教程

- **QUICKSTART.md** - 快速开始
- **GOOGLE_OAUTH_TUTORIAL.md** - OAuth 配置详细步骤
- **GDRIVE_SETUP.md** - 技术说明

## ✨ 特点

✅ 数据整齐存放在独立文件夹  
✅ 可自定义文件夹名称  
✅ 完全免费（Google Drive 15GB）  
✅ 无需服务器  
✅ 自动备份  
✅ 多人共享  

开始记录你的生活吧！🎉
