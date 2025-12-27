/**
 * Life29 - 配置文件
 * ✅ 云服务已配置
 */

const CONFIG = {
    // Supabase 配置
    supabase: {
        url: 'https://rkqnoymfvoempfxzbcuk.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcW5veW1mdm9lbXBmeHpiY3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjM0NTksImV4cCI6MjA4MTUzOTQ1OX0.FMdqZ5gm48P8TDyQoVwAfHMhIKCIyweiFN2E5GTnbtA'
    },
    
    // Cloudinary 配置
    cloudinary: {
        cloudName: 'dkwsbttsi',
        uploadPreset: 'life29_unsigned'
    },
    
    // 本地存储配置（备用）
    storage: {
        musicFile: 'data/songs.json',
        citiesFile: 'data/cities.json'
    },
    
    // 应用配置
    users: ['wiwi', 'yuyu'],
    
    globe: {
        radius: 180,
        autoRotate: true,
        autoRotateSpeed: 0.0008,
        markerSize: 5
    },
    
    cityColors: [
        '#E8B4B8', '#A8D5E5', '#B8D4A8', '#C8B8E5',
        '#F5D5D8', '#D5E5D8', '#E5D8C8', '#D8E5F5'
    ]
};