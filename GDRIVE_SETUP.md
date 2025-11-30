# Life29 - Google Drive 版本

使用 Google Drive 作为数据存储，无需后端服务器，可直接部署到 GitHub Pages。

## 设置步骤

### 1. 获取 Google Drive API 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google Drive API
4. 创建 OAuth 2.0 客户端 ID（Web 应用）
5. 添加授权的 JavaScript 来源：
   - `http://localhost:8000`（开发环境）
   - `https://yourusername.github.io`（生产环境）
6. 复制客户端 ID

### 2. 配置项目

在 `config.js` 中填入你的 Google API 客户端 ID：

```javascript
const GOOGLE_CONFIG = {
    clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
    apiKey: 'YOUR_API_KEY_HERE', // 可选
    scope: 'https://www.googleapis.com/auth/drive.file'
};
```

### 3. 本地测试

```bash
# 使用 Python 启动本地服务器
python -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000
```

访问 `http://localhost:8000`

### 4. 部署到 GitHub Pages

1. 创建 GitHub 仓库
2. 上传所有文件
3. 在仓库设置中启用 GitHub Pages
4. 访问 `https://yourusername.github.io/repository-name`

## 工作原理

- 用户首次访问时需要登录 Google 账号授权
- 数据存储在用户的 Google Drive 中（共享文件夹）
- 所有授权用户可以读写同一个数据文件
- 无需运行后端服务器
- 完全静态托管

## 优势

✅ 无需服务器，完全免费
✅ GitHub Pages 免费托管
✅ Google Drive 15GB 免费空间
✅ 数据备份在云端
✅ 支持多人协作

## 注意事项

- 首次使用需要 Google 账号授权
- 建议使用共享的 Google Drive 文件夹
- 图片建议上传到 Google Drive 并使用链接（而非 base64）
