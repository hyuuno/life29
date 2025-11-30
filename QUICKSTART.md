# 🚀 Life29 快速开始指南

## 第一步：上传文件到 GitHub

### 方式A：通过 GitHub 网页上传（最简单）

1. **进入你的 life29 仓库**
   - 访问：`https://github.com/你的用户名/life29`

2. **上传文件**
   - 点击 "Add file" → "Upload files"
   - 将所有文件拖拽到页面（保持文件夹结构）：
     ```
     index.html
     style.css
     script.js
     .gitignore
     README.md
     data/posts.json
     images/.gitkeep (创建一个空文件占位)
     ```
   - 点击 "Commit changes"

### 方式B：通过命令行（推荐）

```bash
# 1. 克隆仓库到本地
git clone https://github.com/你的用户名/life29.git
cd life29

# 2. 复制所有文件到这个文件夹

# 3. 提交并推送
git add .
git commit -m "🎉 初始化时间线网站"
git push origin main
```

## 第二步：启用 GitHub Pages

1. 进入仓库页面
2. 点击 **Settings**（设置）
3. 左侧菜单找到 **Pages**
4. 在 "Build and deployment" 下：
   - Source: 选择 **Deploy from a branch**
   - Branch: 选择 **main** 和 **/ (root)**
   - 点击 **Save**

⏳ 等待 1-2 分钟，刷新页面，你会看到：
```
Your site is live at https://你的用户名.github.io/life29/
```

## 第三步：绑定域名 life29.me

### 在域名服务商设置 DNS

假设你在阿里云/腾讯云购买的域名，进入域名管理：

**添加以下记录：**

1. **A 记录（根域名）**
   ```
   记录类型: A
   主机记录: @
   记录值: 185.199.108.153
   TTL: 600
   ```

2. **再添加其他 GitHub Pages IP**
   ```
   记录类型: A
   主机记录: @
   记录值: 185.199.109.153
   ```
   ```
   记录类型: A
   主机记录: @
   记录值: 185.199.110.153
   ```
   ```
   记录类型: A
   主机记录: @
   记录值: 185.199.111.153
   ```

3. **CNAME 记录（www子域名）**
   ```
   记录类型: CNAME
   主机记录: www
   记录值: 你的用户名.github.io
   ```

### 在 GitHub 设置自定义域名

1. 回到仓库的 Settings → Pages
2. 在 "Custom domain" 输入：`life29.me`
3. 点击 **Save**
4. 勾选 **Enforce HTTPS**（等DNS生效后再勾选）

⏳ 等待 DNS 生效（5分钟到24小时不等）

### 验证域名是否生效

在终端运行：
```bash
ping life29.me
```
如果返回 `185.199.108.153` 等 IP，说明成功！

## 第四步：添加内容

### 方法1：在 GitHub 网页直接编辑

1. 进入仓库，点击 `data/posts.json`
2. 点击编辑按钮（铅笔图标 ✏️）
3. 添加新内容：

```json
{
  "posts": [
    {
      "id": 1,
      "user": "user1",
      "timestamp": "2024-12-01T10:30:00",
      "text": "这是我的第一条记录！",
      "images": [
        "https://你的图片URL.jpg"
      ]
    }
  ]
}
```

4. 点击 "Commit changes"
5. 等待几秒，刷新网站即可看到新内容

### 方法2：本地编辑

```bash
# 1. 拉取最新代码
git pull

# 2. 编辑 data/posts.json

# 3. 提交
git add data/posts.json
git commit -m "添加新记录"
git push
```

## 第五步：上传图片

### 推荐方案：使用免费图床

**ImgBB（推荐）**
1. 访问：https://imgbb.com/
2. 点击 "Start uploading"
3. 选择图片上传
4. 复制 "Direct link" 链接
5. 粘贴到 JSON 的 `images` 数组中

**示例：**
```json
"images": [
  "https://i.ibb.co/xxxxxx/photo.jpg"
]
```

### 备选方案：放在 GitHub 仓库

1. 在仓库创建 `images` 文件夹
2. 上传图片文件
3. 在 JSON 中使用相对路径：

```json
"images": [
  "images/photo1.jpg",
  "images/photo2.jpg"
]
```

## 第六步：邀请协作者

1. 进入仓库 → **Settings** → **Collaborators**
2. 点击 **Add people**
3. 输入对方的 GitHub 用户名或邮箱
4. 对方会收到邀请邮件，接受后即可协作

现在你们两个人都可以编辑 `posts.json` 添加内容了！

## 📱 手机端使用

1. 在手机浏览器访问 `life29.me`
2. 网站自动适配移动端
3. 点击右上角按钮切换图片显示模式

## 🎨 个性化定制

### 修改用户名称

编辑 `script.js` 第 4-7 行：
```javascript
users: {
    'user1': '小明',
    'user2': '小红'
}
```

### 修改颜色主题

编辑 `style.css` 开头的颜色变量

### 修改字体

在 `index.html` 的 `<head>` 中修改 Google Fonts 链接

## ❓ 常见问题

**Q: 为什么网站不显示？**
A: 检查 GitHub Pages 是否启用，等待几分钟让部署完成

**Q: 为什么域名访问不了？**
A: DNS 需要时间生效，可能要等几小时

**Q: 如何删除某条记录？**
A: 编辑 `posts.json`，删除对应的对象即可

**Q: 图片显示不出来？**
A: 确保图片链接是 HTTPS，且可以直接在浏览器打开

**Q: 如何备份数据？**
A: 所有数据都在 GitHub 仓库中，天然就有版本控制和备份

## 🎉 完成！

现在你可以：
- ✅ 访问 `life29.me` 查看你的时间线
- ✅ 编辑 `data/posts.json` 添加新内容
- ✅ 邀请朋友一起协作
- ✅ 随时随地用手机查看

享受记录生活的乐趣吧！ 📝✨
