// 配置
const CONFIG = {
    dataPath: 'data/posts.json',
    users: {
        'user1': '用户A',
        'user2': '用户B'
    },
    // 目标时区：太平洋时间（加州）
    targetTimezone: 'America/Los_Angeles'
};

// 图片显示状态
let imageDisplayState = 'preview'; // preview, full, hidden

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadTimeline();
    setupImageToggle();
});

// 加载时间线数据
async function loadTimeline() {
    const loading = document.getElementById('loading');
    const timelineContent = document.getElementById('timelineContent');
    
    try {
        const response = await fetch(CONFIG.dataPath);
        if (!response.ok) {
            throw new Error('无法加载数据');
        }
        
        const data = await response.json();
        
        // 按时间排序（最新的在上面）
        const sortedPosts = data.posts.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        // 渲染时间线
        renderTimeline(sortedPosts);
        
        loading.classList.add('hidden');
    } catch (error) {
        console.error('加载失败:', error);
        timelineContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <p style="font-size: 18px; margin-bottom: 12px;">无法加载时间线数据</p>
                <p style="font-size: 14px;">请确保 data/posts.json 文件存在</p>
            </div>
        `;
        loading.classList.add('hidden');
    }
}

// 渲染时间线
function renderTimeline(posts) {
    const timelineContent = document.getElementById('timelineContent');
    timelineContent.innerHTML = '';
    
    let lastDate = null;
    
    posts.forEach((post, index) => {
        const item = createTimelineItem(post, index, lastDate);
        timelineContent.appendChild(item);
        
        // 记录当前日期，用于下一次比较
        const postDate = convertToTargetTimezone(new Date(post.timestamp));
        lastDate = formatDateOnly(postDate);
    });
}

// 转换到目标时区（加州时间）
function convertToTargetTimezone(date) {
    // 使用 Intl API 转换时区
    return new Date(date.toLocaleString('en-US', { timeZone: CONFIG.targetTimezone }));
}

// 创建时间线条目
function createTimelineItem(post, index, lastDate) {
    const item = document.createElement('div');
    item.className = `timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;
    
    // 转换到加州时间
    const originalDate = new Date(post.timestamp);
    const targetDate = convertToTargetTimezone(originalDate);
    
    // 格式化日期和时间
    const currentDateStr = formatDateOnly(targetDate);
    const timeStr = formatTime(targetDate);
    const weekdayStr = formatWeekday(targetDate);
    
    // 判断是否需要显示日期标签（只有日期变化时才显示）
    const showDateLabel = lastDate !== currentDateStr;
    
    // 获取用户名
    const userName = CONFIG.users[post.user] || post.user;
    
    // 创建HTML
    item.innerHTML = `
        ${showDateLabel ? `<div class="timeline-date">${currentDateStr} ${weekdayStr}</div>` : `<div class="timeline-date-placeholder"></div>`}
        <div class="timeline-content-wrapper">
            <div class="content-card">
                <div class="card-header">
                    <div class="user-badge">${userName}</div>
                    <div class="time-badge">${timeStr}</div>
                </div>
                ${post.text ? `<div class="content-text">${formatText(post.text)}</div>` : ''}
                ${post.images && post.images.length > 0 ? createImagesHTML(post.images) : ''}
            </div>
        </div>
    `;
    
    return item;
}

// 创建图片HTML
function createImagesHTML(images) {
    const count = images.length;
    return `
        <div class="content-images count-${count}">
            ${images.map(img => `
                <div class="image-wrapper">
                    <img src="${img}" alt="照片" loading="lazy">
                </div>
            `).join('')}
        </div>
    `;
}

// 只格式化日期（不含时间）
function formatDateOnly(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

// 格式化星期
function formatWeekday(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
}

// 格式化时间
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 格式化文本（保留换行）
function formatText(text) {
    return text.split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${escapeHtml(line)}</p>`)
        .join('');
}

// 转义HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 设置图片切换功能
function setupImageToggle() {
    const toggleBtn = document.getElementById('toggleImages');
    
    toggleBtn.addEventListener('click', () => {
        // 循环切换：preview -> full -> hidden -> preview
        if (imageDisplayState === 'preview') {
            imageDisplayState = 'full';
            toggleBtn.setAttribute('data-state', 'full');
            toggleBtn.querySelector('span').textContent = '完整显示';
        } else if (imageDisplayState === 'full') {
            imageDisplayState = 'hidden';
            toggleBtn.setAttribute('data-state', 'hidden');
            toggleBtn.querySelector('span').textContent = '隐藏图片';
        } else {
            imageDisplayState = 'preview';
            toggleBtn.setAttribute('data-state', 'preview');
            toggleBtn.querySelector('span').textContent = '预览模式';
        }
        
        // 添加按钮点击动画
        toggleBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            toggleBtn.style.transform = 'scale(1)';
        }, 150);
    });
}

// 图片点击放大（可选功能，可以后续添加）
document.addEventListener('click', (e) => {
    if (e.target.matches('.image-wrapper img')) {
        // 这里可以添加图片lightbox功能
        console.log('图片点击:', e.target.src);
    }
});
