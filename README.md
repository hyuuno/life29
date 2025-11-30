# Life29

个人时光记录网站，以时间线形式展示生活点滴。

## 功能

- 按年/月/日/时间分层显示时间线，支持折叠展开
- 双用户标识系统
- 图片预览/完整/隐藏三种显示模式
- 自动时区转换（目标时区：America/Los_Angeles）
- 响应式设计

## 使用

1. 编辑 `data/posts.json` 添加记录
2. 图片放入 `images/` 目录或使用外链
3. 用浏览器打开 `index.html`

## 配置

在 `script.js` 中修改：
- `CONFIG.users` - 用户名称
- `CONFIG.targetTimezone` - 目标时区

## 数据格式

```json
{
  "posts": [
    {
      "id": 1,
      "user": "user1",
      "timestamp": "2024-11-30T22:30:00+08:00",
      "text": "文字内容",
      "images": ["图片路径"]
    }
  ]
}
```
