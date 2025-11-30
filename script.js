// 配置
const CONFIG = {
    dataPath: 'data/posts.json',
    users: {
        'user1': '用户A',
        'user2': '用户B'
    },
    targetTimezone: 'America/Los_Angeles'
};

// 图片显示状态
let imageDisplayState = 'preview';

// 收缩状态存储
const collapseState = {
    years: new Set(),
    months: new Set(),
    days: new Set()
};

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

// 渲染时间线（分组展示）
function renderTimeline(posts) {
    const timelineContent = document.getElementById('timelineContent');
    timelineContent.innerHTML = '';
    
    // 按年份分组
    const groupedByYear = {};
    posts.forEach(post => {
        const date = convertToTargetTimezone(new Date(post.timestamp));
        const year = date.getFullYear();
        if (!groupedByYear[year]) {
            groupedByYear[year] = [];
        }
        groupedByYear[year].push(post);
    });
    
    // 渲染每个年份
    Object.keys(groupedByYear).sort((a, b) => b - a).forEach(year => {
        const yearSection = createYearSection(year, groupedByYear[year]);
        timelineContent.appendChild(yearSection);
    });
}

// 创建年份区块
function createYearSection(year, posts) {
    const section = document.createElement('div');
    section.className = 'year-section';
    section.dataset.year = year;
    
    // 年份标题
    const yearHeader = document.createElement('div');
    yearHeader.className = 'year-header';
    yearHeader.innerHTML = `
        <button class="collapse-btn" data-level="year" data-key="${year}">
            <svg class="collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
        <h2 class="year-title">${year}</h2>
        <span class="year-count">${posts.length} 条记录</span>
    `;
    section.appendChild(yearHeader);
    
    // 月份内容容器
    const monthsContainer = document.createElement('div');
    monthsContainer.className = 'months-container';
    
    // 按月份分组
    const groupedByMonth = {};
    posts.forEach(post => {
        const date = convertToTargetTimezone(new Date(post.timestamp));
        const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!groupedByMonth[month]) {
            groupedByMonth[month] = [];
        }
        groupedByMonth[month].push(post);
    });
    
    // 渲染每个月份
    Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a)).forEach(month => {
        const monthSection = createMonthSection(month, groupedByMonth[month]);
        monthsContainer.appendChild(monthSection);
    });
    
    section.appendChild(monthsContainer);
    
    // 添加折叠事件
    yearHeader.querySelector('.collapse-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCollapse('year', year, section);
    });
    
    return section;
}

// 创建月份区块
function createMonthSection(month, posts) {
    const section = document.createElement('div');
    section.className = 'month-section';
    section.dataset.month = month;
    
    const [year, monthNum] = month.split('-');
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    // 月份标题
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    monthHeader.innerHTML = `
        <button class="collapse-btn" data-level="month" data-key="${month}">
            <svg class="collapse-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
        <h3 class="month-title">${monthNames[parseInt(monthNum) - 1]}</h3>
        <span class="month-count">${posts.length} 条</span>
    `;
    section.appendChild(monthHeader);
    
    // 日期内容容器
    const daysContainer = document.createElement('div');
    daysContainer.className = 'days-container';
    
    // 按日期分组
    const groupedByDay = {};
    posts.forEach(post => {
        const date = convertToTargetTimezone(new Date(post.timestamp));
        const day = `${month}-${String(date.getDate()).padStart(2, '0')}`;
        if (!groupedByDay[day]) {
            groupedByDay[day] = [];
        }
        groupedByDay[day].push(post);
    });
    
    // 渲染每一天
    Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a)).forEach(day => {
        const daySection = createDaySection(day, groupedByDay[day]);
        daysContainer.appendChild(daySection);
    });
    
    section.appendChild(daysContainer);
    
    // 添加折叠事件
    monthHeader.querySelector('.collapse-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCollapse('month', month, section);
    });
    
    return section;
}

// 创建日期区块
function createDaySection(day, posts) {
    const section = document.createElement('div');
    section.className = 'day-section';
    section.dataset.day = day;
    
    const [year, month, dayNum] = day.split('-');
    const sampleDate = convertToTargetTimezone(new Date(posts[0].timestamp));
    const weekday = formatWeekday(sampleDate);
    
    // 日期标题
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.innerHTML = `
        <button class="collapse-btn" data-level="day" data-key="${day}">
            <svg class="collapse-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
        <h4 class="day-title">${month}.${dayNum} ${weekday}</h4>
        <span class="day-count">${posts.length} 条</span>
    `;
    section.appendChild(dayHeader);
    
    // 时间条目容器
    const postsContainer = document.createElement('div');
    postsContainer.className = 'posts-container';
    
    // 按时间排序并渲染
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .forEach((post, index) => {
        const item = createTimelineItem(post, index);
        postsContainer.appendChild(item);
    });
    
    section.appendChild(postsContainer);
    
    // 添加折叠事件
    dayHeader.querySelector('.collapse-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCollapse('day', day, section);
    });
    
    return section;
}

// 切换折叠状态
function toggleCollapse(level, key, element) {
    const container = level === 'year' ? '.months-container' : 
                     level === 'month' ? '.days-container' : 
                     '.posts-container';
    
    const contentEl = element.querySelector(container);
    const btn = element.querySelector('.collapse-btn');
    
    if (collapseState[level + 's'].has(key)) {
        // 展开
        collapseState[level + 's'].delete(key);
        contentEl.style.display = 'block';
        btn.classList.remove('collapsed');
    } else {
        // 折叠
        collapseState[level + 's'].add(key);
        contentEl.style.display = 'none';
        btn.classList.add('collapsed');
    }
}

// 转换到目标时区（加州时间）
function convertToTargetTimezone(date) {
    return new Date(date.toLocaleString('en-US', { timeZone: CONFIG.targetTimezone }));
}

// 创建时间线条目
function createTimelineItem(post, index) {
    const item = document.createElement('div');
    item.className = `timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;
    
    const targetDate = convertToTargetTimezone(new Date(post.timestamp));
    const timeStr = formatTime(targetDate);
    const userName = CONFIG.users[post.user] || post.user;
    
    item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="content-card">
            <div class="card-header">
                <div class="user-badge">${userName}</div>
                <div class="time-badge">${timeStr}</div>
            </div>
            ${post.text ? `<div class="content-text">${formatText(post.text)}</div>` : ''}
            ${post.images && post.images.length > 0 ? createImagesHTML(post.images) : ''}
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
        
        toggleBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            toggleBtn.style.transform = 'scale(1)';
        }, 150);
    });
}

// 图片点击放大
document.addEventListener('click', (e) => {
    if (e.target.matches('.image-wrapper img')) {
        console.log('图片点击:', e.target.src);
    }
});
