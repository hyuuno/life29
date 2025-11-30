# 一直加载问题诊断

## 🔍 快速诊断步骤

### 1. 打开浏览器控制台查看错误

1. 访问你的网站：https://hyuuno.github.io/life29
2. 按 **F12** 打开开发者工具
3. 切换到 **Console** 标签
4. 查看是否有红色错误信息

### 常见错误及解决方案

#### 错误 1: `idpiframe_initialization_failed`
```
Error: idpiframe_initialization_failed
```
**原因**：Google API 加载失败，可能是网络问题或配置问题

**解决方案**：
1. 清除浏览器缓存
2. 刷新页面
3. 检查是否被防火墙/广告拦截器阻止

#### 错误 2: `origin_mismatch` 或 `redirect_uri_mismatch`
```
Error: origin_mismatch: https://hyuuno.github.io
```
**原因**：授权来源配置不正确

**解决方案**：
1. 访问 Google Cloud Console
2. 检查 OAuth 客户端 ID 的授权来源
3. 必须是：`https://hyuuno.github.io` （不带 /life29）

#### 错误 3: `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT`
**原因**：广告拦截器阻止了 Google API

**解决方案**：
1. 禁用广告拦截器（如 AdBlock）
2. 或者将网站加入白名单

#### 错误 4: `Invalid Client ID`
```
Error: Invalid Client ID
```
**原因**：config.js 中的 Client ID 不正确

**解决方案**：
检查 config.js 文件，确保 Client ID 正确

## 🛠️ 详细排查步骤

### 步骤 1：检查网络请求

1. 按 F12 打开开发者工具
2. 切换到 **Network** 标签
3. 刷新页面
4. 查看是否有失败的请求（红色）

### 步骤 2：检查 Console 错误

复制所有红色错误信息，发给我帮你分析

### 步骤 3：测试本地版本

```bash
# 在本地测试是否正常
python -m http.server 8000
# 访问 http://localhost:8000
```

如果本地正常，说明是 GitHub Pages 配置问题
如果本地也不正常，说明是代码问题

## 🔧 可能的解决方案

### 方案 1：清除缓存并重新加载

1. Chrome: Ctrl+Shift+Delete 清除缓存
2. 或者使用无痕模式：Ctrl+Shift+N
3. 访问网站

### 方案 2：检查 Google OAuth 配置

确保在 Google Cloud Console 中：

**授权的 JavaScript 来源：**
```
http://localhost:8000
https://hyuuno.github.io
```

**重要**：不要写成 `https://hyuuno.github.io/life29`

### 方案 3：等待 Google API 生效

有时候 OAuth 配置需要几分钟才能生效：
- 等待 5-10 分钟
- 清除缓存
- 重新访问

## 📸 发送诊断信息

如果以上方法都不行，请提供：

1. **浏览器控制台截图**（按 F12，Console 标签）
2. **网络请求截图**（F12，Network 标签）
3. **你看到的页面截图**

这样我能更准确地帮你解决问题！
