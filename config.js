// Google Drive API 配置
const GOOGLE_CONFIG = {
    // 你的 Google API 客户端 ID
    clientId: '1097251788392-il09f5pitva37upe7sevvk2ttulqmde5.apps.googleusercontent.com',
    
    // 授权范围
    scope: 'https://www.googleapis.com/auth/drive.file',
    
    // 发现文档
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    
    // ==================== 文件夹配置 ====================
    // 所有 Life29 文件都会存储在这个主文件夹下
    // 建议设置: 'Life29' 或 '生活记录' 等
    mainFolderName: 'Life29',
    
    // 数据文件名（会自动放在主文件夹下）
    dataFileName: 'posts.json',
    
    // 图片子文件夹名（会自动放在主文件夹下）
    imagesFolderName: 'images',
    
    // ==================== 文件夹结构示例 ====================
    // Google Drive 根目录/
    // └── Life29/                    ← mainFolderName（主文件夹）
    //     ├── posts.json             ← dataFileName（数据文件）
    //     └── images/                ← imagesFolderName（图片文件夹）
    //         ├── 1234567890_photo1.jpg
    //         ├── 1234567891_photo2.jpg
    //         └── ...
    // ========================================================
};

// 用户配置
const CONFIG = {
    users: {
        'user1': '用户A',
        'user2': '用户B'
    },
    targetTimezone: 'America/Los_Angeles'
};
