# Life29 Cloud Album 功能说明

## 新增功能：Google Photos 云相册链接

在城市详情页面中，新增了 **Cloud Album** 标签页，可以快速跳转到绑定的 Google Photos 共享相册。

### 功能特点

1. **Cloud Album 标签** - 在 Gallery 左边显示，点击切换到云相册面板
2. **一键跳转** - 点击相册卡片直接在新窗口打开 Google Photos 链接
3. **城市绑定** - 每个城市可以绑定一个或多个云相册
4. **中英文支持** - 自动匹配中文或英文城市名

### 配置云相册

编辑 `data/cloud-albums.json` 文件来添加或修改云相册链接：

```json
{
  "albums": [
    {
      "city": "香港",
      "cityEn": "Hong Kong",
      "country": "中国",
      "albumName": "香港之旅 2024",
      "albumUrl": "https://photos.app.goo.gl/N95hiLxD1ZG2Cj3LA",
      "description": "香港旅行记录 - Google Photos 共享相册",
      "coverImage": "",
      "createdAt": "2024-05-10"
    },
    {
      "city": "上海",
      "cityEn": "Shanghai",
      "albumName": "上海之行",
      "albumUrl": "https://photos.app.goo.gl/YOUR_ALBUM_ID",
      "description": "上海旅行照片集"
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| city | ✅ | 城市中文名 |
| cityEn | ❌ | 城市英文名（用于匹配） |
| country | ❌ | 国家名称 |
| albumName | ✅ | 相册显示名称 |
| albumUrl | ✅ | Google Photos 分享链接 |
| description | ❌ | 相册描述文字 |
| coverImage | ❌ | 封面图片URL（留空） |
| createdAt | ❌ | 创建日期 (YYYY-MM-DD) |

### 获取 Google Photos 分享链接

1. 打开 Google Photos
2. 选择或创建一个相册
3. 点击右上角「分享」按钮
4. 选择「创建链接」
5. 复制生成的链接（格式：`https://photos.app.goo.gl/XXXXXX`）

### 示例效果

当用户进入香港城市页面时：
1. Cloud Album 标签显示在 Gallery 左侧
2. 点击 Cloud Album 标签
3. 显示「香港之旅 2024」相册卡片
4. 点击卡片跳转到 Google Photos 页面

### 文件变更

- `city.html` - 添加 Cloud Album 标签和面板
- `js/city-page.js` - 添加云相册加载和渲染逻辑
- `css/city.css` - 添加云相册样式
- `data/cloud-albums.json` - 新增云相册配置文件

---
*Life29 - 记录你们的美好时光 💕*
