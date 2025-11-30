# GitHub Pages 部署指南

## 问题说明

收到 "Run cancelled" 邮件是正常的，通常原因：
1. 你推送了多次提交，GitHub 取消了旧的构建
2. GitHub Pages 正在处理最新的提交
3. 不影响最终部署

## ✅ 检查部署状态

### 1. 访问仓库的 Actions 页面
https://github.com/hyuuno/life29/actions

### 2. 查看最新的工作流运行
- ✅ 绿色勾 = 部署成功
- 🟡 黄色圆 = 正在部署
- ❌ 红色叉 = 部署失败
- ⚪ 灰色圆 = 已取消（被新的构建替代）

### 3. 访问你的网站
https://hyuuno.github.io/life29

如果能打开，说明部署成功！

## 🔧 确保正确配置

### 步骤 1：检查仓库设置

1. 访问：https://github.com/hyuuno/life29/settings/pages
2. 确认以下设置：
   - **Source**: Deploy from a branch
   - **Branch**: main (或 master)
   - **Folder**: / (root)
3. 点击 **Save**

### 步骤 2：等待部署

- 首次部署可能需要 2-5 分钟
- 刷新 Actions 页面查看进度
- 部署成功后访问网站

## 🚨 常见问题

### 问题 1：404 Not Found

**原因**：文件路径不对

**解决**：确保仓库根目录有 `index.html` 文件

检查命令：
```bash
ls -la
# 应该看到 index.html, script.js, style.css, config.js
```

### 问题 2：部署失败（红色 X）

**原因**：可能是文件问题

**解决**：
1. 查看失败的工作流日志
2. 检查是否有语法错误
3. 确保所有文件都已提交

### 问题 3：网站显示空白

**原因**：JavaScript 错误或配置问题

**解决**：
1. 按 F12 打开浏览器控制台
2. 查看是否有报错
3. 检查 `config.js` 中的 Client ID 是否正确

### 问题 4：无法登录 Google

**原因**：OAuth 授权来源未添加

**解决**：
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 `life29` 项目
3. **API 和服务** → **凭据**
4. 编辑你的 OAuth 客户端 ID
5. 在 **"已获授权的 JavaScript 来源"** 中添加：
   ```
   https://hyuuno.github.io
   ```
6. 保存

**重要**：不要加项目名，只加域名！

错误 ❌：`https://hyuuno.github.io/life29`  
正确 ✅：`https://hyuuno.github.io`

## 📋 完整部署检查清单

### GitHub 仓库配置
- [ ] 仓库已创建：https://github.com/hyuuno/life29
- [ ] 文件已上传（index.html, script.js, style.css, config.js）
- [ ] GitHub Pages 已启用
- [ ] 分支设置为 main
- [ ] 文件夹设置为 / (root)

### Google OAuth 配置
- [ ] OAuth 客户端 ID 已创建
- [ ] 已添加授权来源：`http://localhost:8000`
- [ ] 已添加授权来源：`https://hyuuno.github.io`
- [ ] config.js 中 Client ID 正确
- [ ] 已添加测试用户

### 测试
- [ ] 本地测试成功（localhost:8000）
- [ ] GitHub Pages 可以访问
- [ ] 可以登录 Google
- [ ] 可以添加记录

## 🎯 快速诊断

运行这个检查：

```bash
# 1. 检查文件是否都在
ls -la

# 应该看到：
# index.html
# script.js
# style.css
# config.js
# README.md

# 2. 检查 config.js 内容
cat config.js | grep clientId

# 应该看到你的 Client ID：
# clientId: '1097251788392-il09f5pitva37upe7sevvk2ttulqmde5.apps.googleusercontent.com',

# 3. 检查最近的提交
git log --oneline -5

# 4. 强制推送最新版本
git add .
git commit -m "Update deployment"
git push origin main
```

## 💡 最佳实践

### 每次修改后的步骤：

```bash
# 1. 本地测试
python -m http.server 8000
# 访问 localhost:8000 确认无误

# 2. 提交更改
git add .
git commit -m "描述你的更改"
git push origin main

# 3. 等待部署（2-5分钟）
# 访问 https://github.com/hyuuno/life29/actions

# 4. 测试线上版本
# 访问 https://hyuuno.github.io/life29
```

## 🆘 仍然有问题？

### 检查浏览器控制台

1. 访问：https://hyuuno.github.io/life29
2. 按 F12 打开开发者工具
3. 切换到 **Console** 标签
4. 查看是否有红色报错

### 常见错误及解决方案

**错误 1**: `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT`
- 原因：广告拦截器
- 解决：禁用广告拦截器

**错误 2**: `Google API 初始化失败`
- 原因：Client ID 不正确
- 解决：检查 config.js

**错误 3**: `redirect_uri_mismatch`
- 原因：授权来源未添加
- 解决：在 Google Cloud Console 添加 `https://hyuuno.github.io`

**错误 4**: `Access blocked: This app's request is invalid`
- 原因：未添加为测试用户
- 解决：在 OAuth 同意屏幕添加你的 Gmail

## 📞 获取帮助

如果仍有问题，提供以下信息：
1. GitHub Actions 的错误日志
2. 浏览器控制台的错误信息
3. 访问网站时看到的内容截图

祝部署顺利！🎉
