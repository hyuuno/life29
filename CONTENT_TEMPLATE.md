# 📝 内容添加模板

复制以下模板到 `data/posts.json` 中添加新内容：

## 基础模板

```json
{
  "id": 下一个数字,
  "user": "user1",
  "timestamp": "2024-12-01T15:30:00",
  "text": "你的文字内容",
  "images": []
}
```

## 完整示例

### 示例1：带单张图片

```json
{
  "id": 10,
  "user": "user1",
  "timestamp": "2024-12-01T14:30:00",
  "text": "今天天气真好，出去散了个步。",
  "images": [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
  ]
}
```

### 示例2：带多张图片

```json
{
  "id": 11,
  "user": "user2",
  "timestamp": "2024-12-01T18:00:00",
  "text": "周末的晚餐\n尝试了新的菜谱\n味道不错！",
  "images": [
    "https://图片1.jpg",
    "https://图片2.jpg",
    "https://图片3.jpg"
  ]
}
```

### 示例3：只有文字

```json
{
  "id": 12,
  "user": "user1",
  "timestamp": "2024-12-01T20:15:00",
  "text": "今天读完了一本好书，分享一段特别喜欢的话：\n\n"生活就像海洋，只有意志坚强的人，才能到达彼岸。"",
  "images": []
}
```

### 示例4：只有图片

```json
{
  "id": 13,
  "user": "user2",
  "timestamp": "2024-12-02T09:00:00",
  "text": "",
  "images": [
    "https://图片链接.jpg"
  ]
}
```

## 字段说明

### id（必填）
- 唯一标识符
- 使用递增数字
- 不能重复

### user（必填）
- `user1` 或 `user2`
- 代表不同的发布者
- 对应不同的颜色

### timestamp（必填）
- 格式：`YYYY-MM-DDTHH:mm:ss`
- 必须包含日期和时间
- 示例：
  - `2024-12-01T09:30:00` → 2024年12月1日上午9:30
  - `2024-12-01T14:15:00` → 2024年12月1日下午2:15
  - `2024-12-01T23:45:00` → 2024年12月1日晚上11:45

### text（可选）
- 文字内容
- 可以为空字符串 `""`
- 使用 `\n` 表示换行
- 示例：
  ```json
  "text": "第一行\n第二行\n第三行"
  ```

### images（可选）
- 图片URL数组
- 可以为空数组 `[]`
- 支持多张图片
- 建议使用 HTTPS 链接

## 获取当前时间戳

### 方法1：在线工具
访问：https://tool.lu/timestamp/

### 方法2：JavaScript（浏览器控制台）
```javascript
new Date().toISOString().slice(0, 19)
// 输出：2024-12-01T15:30:00
```

### 方法3：Python
```python
from datetime import datetime
datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
```

## 完整的 posts.json 示例

```json
{
  "posts": [
    {
      "id": 1,
      "user": "user1",
      "timestamp": "2024-12-01T10:00:00",
      "text": "早安！新的一天开始了",
      "images": ["https://图片.jpg"]
    },
    {
      "id": 2,
      "user": "user2",
      "timestamp": "2024-12-01T12:30:00",
      "text": "午餐时间",
      "images": []
    },
    {
      "id": 3,
      "user": "user1",
      "timestamp": "2024-12-01T18:00:00",
      "text": "晚安",
      "images": ["https://图片1.jpg", "https://图片2.jpg"]
    }
  ]
}
```

## 注意事项

1. **JSON 格式要求严格**
   - 所有字符串必须用双引号 `"`
   - 不能有多余的逗号
   - 最后一个对象后不要加逗号

2. **验证 JSON 格式**
   - 使用 https://jsonlint.com/ 验证
   - 编辑器（如 VS Code）会自动提示错误

3. **图片链接要求**
   - 必须是直链（可以直接在浏览器打开）
   - 推荐使用 HTTPS
   - 避免使用有防盗链的图床

4. **时间顺序**
   - 系统会自动按时间排序
   - 最新的显示在最上面

## 快捷添加方法

### 使用 GitHub 网页编辑器

1. 打开 `data/posts.json`
2. 点击编辑（铅笔图标）
3. 在 `"posts": [` 后面添加：

```json
    {
      "id": 下一个ID,
      "user": "user1",
      "timestamp": "当前时间",
      "text": "内容",
      "images": []
    },
```

4. 注意：新添加的条目后面要加逗号 `,`
5. Commit changes

## 批量添加

可以一次添加多条：

```json
{
  "posts": [
    {
      "id": 1,
      "user": "user1",
      "timestamp": "2024-12-01T10:00:00",
      "text": "第一条",
      "images": []
    },
    {
      "id": 2,
      "user": "user2",
      "timestamp": "2024-12-01T11:00:00",
      "text": "第二条",
      "images": []
    },
    {
      "id": 3,
      "user": "user1",
      "timestamp": "2024-12-01T12:00:00",
      "text": "第三条",
      "images": []
    }
  ]
}
```

提交后，网站会自动更新显示所有新内容！
