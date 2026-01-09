# Life29 登录系统集成说明

## ✅ 已完成的修改

### 1. 新版登录页面特性
- 🎬 **视频背景**：5个视频随机播放
- 👁️ **眼睛图标**：点击随机切换视频（带眨眼动画）
- 📝 **视频名称**：左下角显示当前视频名称
- 🚪 **门图标**：点击打开登录界面
- 🪟 **磨砂玻璃效果**：全屏半透明登录界面
- ✨ **用户选择**：wiwi（淡绿色微光）/ yuyu（淡蓝色微光）
- ➖ **极简密码框**：单线条设计
- 🖱️ **视频拖拽**：可拖动查看超出屏幕的视频内容

### 2. 文件结构
```
life29/
├── login.html          # 登录页面
├── login.css          # 登录样式
├── login.js           # 登录逻辑
├── auth-check.js      # 认证检查
├── videos/            # 视频文件夹（新增）
│   ├── README.md      # 视频说明
│   ├── 金门大桥.mp4   # 请添加
│   ├── 乐高.mp4       # 请添加
│   ├── 花.mp4         # 请添加
│   ├── theater.mp4    # 请添加
│   └── minisoda.mp4   # 请添加
├── index.html         # 主页
├── city.html          # 城市页面
├── schedule.html      # 日程表
├── music.html         # 音乐页面
├── festival.html      # 节日页面
├── relax.html         # 放松页面
├── css/               # 样式文件夹
├── js/                # 脚本文件夹
├── data/              # 数据文件夹
├── images/            # 图片文件夹
└── audio/             # 音频文件夹
```

## 📹 视频文件

请将以下5个视频文件放入 `videos/` 文件夹：

1. 金门大桥.mp4
2. 乐高.mp4
3. 花.mp4
4. theater.mp4
5. minisoda.mp4

## 🔑 登录信息

- **用户1：** wiwi（淡绿色光晕）
- **用户2：** yuyu（淡蓝色光晕）
- **密码：** MyLittleFlower9529

## 📝 使用流程

1. 访问网站，看到随机视频背景
2. 点击右下角眼睛图标可切换视频
3. 左下角显示当前视频名称
4. 点击右下角门图标打开登录界面
5. 点击选择用户（wiwi或yuyu）
6. 输入密码后按回车
7. 登录成功直接跳转到主页

## 🛠️ 本地测试

1. 使用本地服务器运行（必须）：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # 或使用VS Code的Live Server扩展
   ```

2. 访问 `http://localhost:8000/login.html`

**注意：** 不能直接双击HTML文件打开，sessionStorage在file://协议下不工作。

## ❓ 常见问题

**Q: 想改密码怎么办？**
A: 编辑`login.js`文件第2-5行的CREDENTIALS对象。

**Q: 想让登录状态持久保存？**
A: 将`login.js`和`auth-check.js`中的所有`sessionStorage`改为`localStorage`。

**Q: 忘记密码了？**
A: 密码是：`MyLittleFlower9529`

---

🎉 **上传到GitHub Pages即可使用！**
