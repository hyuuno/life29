# Life29 时光记录网站

一个优雅的时间线记录网站，支持多用户发布带图片和文字的内容。

## 📁 项目结构

```
life29/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 功能脚本
├── data/
│   └── posts.json      # 数据文件（所有内容存储在这里）
├── images/             # 本地图片文件夹
└── README.md           # 说明文档
```

## 🎨 功能特点

- ✨ 优雅的垂直时间线设计
- 🎭 不同用户用不同颜色区分
- 📸 三种图片显示模式：预览、完整、隐藏
- 📱 响应式设计，支持移动端
- ⏰ 精确到分钟的时间戳
- 🔄 内容左右交替排列

## 🚀 快速开始

### 1. 上传到 GitHub

```bash
# 在本地克隆你的仓库
git clone https://github.com/你的用户名/life29.git
cd life29

# 复制所有文件到这个文件夹
# 然后提交
git add .
git commit -m "Initial commit: 时间线网站"
git push origin main
```

### 2. 启用 GitHub Pages

1. 进入仓库 → Settings → Pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 "main" 和 "/ (root)"
4. 点击 Save

等待几分钟后，你的网站就会发布在：
`https://你的用户名.github.io/life29/`

### 3. 绑定自定义域名

1. 在 GitHub Pages 设置中，Custom domain 填入：`life29.me`
2. 在你的域名服务商（如阿里云、腾讯云等）处设置 DNS：

**如果使用 A 记录：**
```
类型: A
主机记录: @
记录值: 185.199.108.153
```
还需要添加：
```
185.199.109.153
185.199.110.153
185.199.111.153
```

**或使用 CNAME 记录（推荐）：**
```
类型: CNAME
主机记录: www
记录值: 你的用户名.github.io
```

**同时添加根域名重定向：**
```
类型: A
主机记录: @
记录值: 185.199.108.153
```

3. 等待 DNS 生效（可能需要几分钟到几小时）

## 📝 如何添加内容

### 方法一：直接在 GitHub 网页编辑

1. 进入仓库，点击 `data/posts.json`
2. 点击编辑按钮（铅笔图标）
3. 按照格式添加新内容
4. 点击 "Commit changes"

### 方法二：本地编辑后推送

1. 编辑 `data/posts.json` 文件
2. 提交并推送：
```bash
git add data/posts.json
git commit -m "添加新内容"
git push
```

## 📋 数据格式说明

在 `data/posts.json` 中添加新内容：

```json
{
  "id": 7,
  "user": "user1",
  "timestamp": "2024-12-01T15:30:00",
  "text": "你的文字内容\n支持换行",
  "images": [
    "图片URL1",
    "图片URL2"
  ]
}
```

### 字段说明：

- **id**: 唯一标识符（递增数字）
- **user**: 用户标识（`user1` 或 `user2`）
- **timestamp**: 时间戳，格式：`YYYY-MM-DDTHH:mm:ss`
- **text**: 文字内容（可选，支持 `\n` 换行）
- **images**: 图片URL数组（可选，可以为空数组 `[]`）

### 时间戳格式示例：

- `2024-12-01T15:30:00` → 2024年12月1日 15:30
- `2024-11-30T09:15:00` → 2024年11月30日 09:15

## 🖼️ 图片上传方案

### 方案一：使用图床（推荐）

免费图床服务：
- [ImgBB](https://imgbb.com/)
- [SM.MS](https://sm.ms/)
- [路过图床](https://imgse.com/)

上传后复制图片直链，粘贴到 JSON 中。

### 方案二：放在 GitHub 仓库

1. 将图片上传到 `images/` 文件夹
2. 在 JSON 中使用相对路径：
```json
"images": ["images/photo1.jpg", "images/photo2.jpg"]
```

### 方案三：使用云存储

- Google Drive（需要设置公开访问）
- 阿里云 OSS
- 腾讯云 COS

## 👥 多人协作

### 添加协作者

1. 进入仓库 → Settings → Collaborators
2. 点击 "Add people"
3. 输入对方的 GitHub 用户名
4. 对方接受邀请后就可以一起编辑了

### 协作流程

双方都可以：
1. 直接在 GitHub 网页编辑 `posts.json`
2. 或者 clone 到本地编辑后 push

GitHub 会自动同步所有更改。

## 🎨 自定义

### 修改用户名称

编辑 `script.js` 第 4-7 行：

```javascript
users: {
    'user1': '你的名字',
    'user2': '对方的名字'
}
```

### 修改配色

编辑 `style.css` 第 1-20 行的 CSS 变量：

```css
:root {
    --user1-color: #b8a394;  /* 用户1主色 */
    --user1-light: #e8dfd8;  /* 用户1浅色背景 */
    --user2-color: #94a3b8;  /* 用户2主色 */
    --user2-light: #dce4ec;  /* 用户2浅色背景 */
    /* ... */
}
```

### 添加更多用户

1. 在 `script.js` 的 `users` 对象中添加：
```javascript
users: {
    'user1': '用户A',
    'user2': '用户B',
    'user3': '用户C'  // 新增
}
```

2. 在 `style.css` 中添加新用户的颜色变量和样式

## 🔧 故障排查

### 网站不显示内容

1. 检查浏览器控制台（F12）是否有错误
2. 确认 `data/posts.json` 格式正确（可用 [JSONLint](https://jsonlint.com/) 验证）
3. 确认图片 URL 是否可访问

### 域名无法访问

1. 检查 DNS 设置是否正确
2. 等待 DNS 生效（最多24小时）
3. 清除浏览器缓存

### 图片不显示

1. 确认图片 URL 可以直接在浏览器打开
2. 检查图片链接是否是 HTTPS（GitHub Pages 要求 HTTPS）
3. 某些图床可能有防盗链，建议使用 GitHub 仓库或专业图床

## 📞 需要帮助？

- 遇到问题可以在仓库创建 Issue
- 或通过 GitHub Discussions 讨论

## 📜 许可

MIT License - 自由使用和修改
