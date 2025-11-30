# Google OAuth 2.0 客户端 ID 创建教程

## 完整步骤（带详细说明）

### 第一步：访问 Google Cloud Console

1. 打开浏览器，访问：https://console.cloud.google.com/
2. 使用你的 Google 账号登录

---

### 第二步：创建项目

1. 点击顶部的项目选择器（或者"选择项目"按钮）
2. 点击右上角的 **"新建项目"**
3. 填写项目信息：
   - **项目名称**：输入 `Life29`（或任何你喜欢的名字）
   - **位置**：保持默认即可
4. 点击 **"创建"**
5. 等待几秒钟，项目创建完成后会自动切换到新项目

---

### 第三步：启用 Google Drive API

1. 在左侧菜单中，找到并点击 **"API 和服务"** → **"库"**
   - 或直接访问：https://console.cloud.google.com/apis/library

2. 在搜索框中输入：`Google Drive API`

3. 点击搜索结果中的 **"Google Drive API"**

4. 点击蓝色的 **"启用"** 按钮

5. 等待启用完成（通常几秒钟）

---

### 第四步：配置 OAuth 同意屏幕

在创建客户端 ID 之前，必须先配置 OAuth 同意屏幕。

1. 在左侧菜单中，点击 **"API 和服务"** → **"OAuth 同意屏幕"**
   - 或直接访问：https://console.cloud.google.com/apis/credentials/consent

2. 选择用户类型：
   - ✅ 选择 **"外部"**（External）
   - 点击 **"创建"**

3. 填写应用信息（第 1 步 - 应用信息）：
   - **应用名称**：`Life29`
   - **用户支持电子邮件**：选择你的 Gmail 邮箱
   - **应用徽标**：（可选，跳过）
   - **应用首页**：（可选，跳过）
   - **应用隐私权政策链接**：（可选，跳过）
   - **应用服务条款链接**：（可选，跳过）
   - **已获授权的网域**：（可选，跳过）
   - **开发者联系信息**：输入你的邮箱
   - 点击 **"保存并继续"**

4. 第 2 步 - 范围（Scopes）：
   - 点击 **"添加或移除范围"**
   - 在搜索框中输入 `drive`
   - 勾选 `../auth/drive.file`（查看和管理 Google Drive 文件）
   - 点击 **"更新"**
   - 点击 **"保存并继续"**

5. 第 3 步 - 测试用户：
   - 点击 **"+ ADD USERS"**
   - 输入你自己的 Gmail 邮箱（以及任何需要使用该应用的人的邮箱）
   - 点击 **"添加"**
   - 点击 **"保存并继续"**

6. 第 4 步 - 摘要：
   - 检查信息无误
   - 点击 **"返回控制台"**

---

### 第五步：创建 OAuth 2.0 客户端 ID

1. 在左侧菜单中，点击 **"API 和服务"** → **"凭据"**
   - 或直接访问：https://console.cloud.google.com/apis/credentials

2. 点击顶部的 **"+ 创建凭据"** 按钮

3. 在下拉菜单中选择 **"OAuth 客户端 ID"**

4. 选择应用类型：
   - **应用类型**：选择 **"Web 应用"**（Web application）

5. 填写配置信息：
   - **名称**：输入 `Life29 Web Client`（或任何名字）
   
   - **已获授权的 JavaScript 来源**：
     点击 **"+ 添加 URI"**，分别添加：
     ```
     http://localhost:8000
     ```
     （本地测试用）
     
     如果要部署到 GitHub Pages，再添加：
     ```
     https://你的GitHub用户名.github.io
     ```
     例如：`https://hyuuno.github.io`
   
   - **已获授权的重定向 URI**：
     （这个可以留空，或者添加与上面相同的 URI）

6. 点击底部的 **"创建"** 按钮

---

### 第六步：获取客户端 ID

创建成功后，会弹出一个对话框显示：

- **客户端 ID**：类似 `123456789-abcdefg.apps.googleusercontent.com`
- **客户端密钥**：（Web 应用需要，但我们的纯前端应用不需要）

**重要**：复制 **客户端 ID**，你需要把它粘贴到 `config.js` 文件中。

点击 **"确定"** 关闭对话框。

---

### 第七步：配置项目

打开项目中的 `config.js` 文件，将客户端 ID 填入：

```javascript
const GOOGLE_CONFIG = {
    // 👇 粘贴你的客户端 ID 到这里
    clientId: '123456789-abcdefg.apps.googleusercontent.com',
    
    // API 密钥可以留空或删除（纯前端应用不需要）
    apiKey: '',
    
    // 其他配置保持不变
    scope: 'https://www.googleapis.com/auth/drive.file',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    dataFileName: 'life29-posts.json',
    imagesFolderName: 'life29-images'
};
```

保存文件。

---

### 第八步：测试

1. 启动本地服务器：
   ```bash
   python -m http.server 8000
   ```

2. 打开浏览器访问：`http://localhost:8000`

3. 点击 **"登录 Google"** 按钮

4. 选择你的 Google 账号

5. 会看到授权请求，点击 **"允许"**

6. 授权成功后，就可以正常使用了！

---

## 常见问题

### Q1: 提示 "此应用未经验证"
**A**: 这是正常的，因为应用还在测试阶段。点击 **"高级"** → **"前往 Life29（不安全）"** 即可。

### Q2: 如何添加更多测试用户？
**A**: 返回 OAuth 同意屏幕，在 **"测试用户"** 部分添加更多邮箱。

### Q3: 如何让应用公开（任何人都能用）？
**A**: 在 OAuth 同意屏幕点击 **"发布应用"**，但需要通过 Google 审核。对于个人使用，保持测试状态即可。

### Q4: GitHub Pages 部署后无法登录？
**A**: 确保在 **"已获授权的 JavaScript 来源"** 中添加了正确的 GitHub Pages URL。

### Q5: API 配额不够用？
**A**: Google Drive API 免费配额是每天 10 亿次请求，对个人使用完全够用。

---

## 安全提示

✅ **客户端 ID 可以公开**：放在前端代码中没问题  
❌ **客户端密钥要保密**：但我们的应用不需要密钥  
✅ **只授权必要的权限**：我们只请求 `drive.file` 权限（只能访问应用创建的文件）  

---

## 下一步

配置完成后：

1. ✅ 本地测试运行正常
2. ✅ 上传到 GitHub
3. ✅ 启用 GitHub Pages
4. ✅ 分享链接给朋友使用

完成！🎉
