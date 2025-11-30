// 配置
const CONFIG = {
    dataPath: 'data/posts.json',
    users: {
        'user1': '用户A',
        'user2': '用户B'
    },
    targetTimezone: 'America/Los_Angeles'
};

// 状态
let imageDisplayState = 'preview';
let allPosts = [];
let currentLightboxImages = [];
let currentLightboxIndex = 0;
let uploadedImageFiles = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadTimeline();
    setupImageToggle();
    setupModal();
    setupLightbox();
    setupImageUpload();
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
        allPosts = data.posts;
        
        // 从 localStorage 加载用户添加的数据
        const localPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
        allPosts = [...allPosts, ...localPosts];
        
        // 按时间排序（最新的在上面）
        allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // 渲染时间线
        renderTimeline(allPosts);
        
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
    
    if (posts.length === 0) {
        timelineContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <p style="font-size: 16px;">还没有任何记录</p>
                <p style="font-size: 14px; margin-top: 8px;">点击右上角"添加记录"开始记录生活</p>
            </div>
        `;
        return;
    }
    
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
    
    const yearHeader = document.createElement('div');
    yearHeader.className = 'year-header';
    yearHeader.innerHTML = `
        <div class="year-node">
            <svg class="collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <h2 class="year-title">${year}</h2>
            <span class="year-count">${posts.length}</span>
        </div>
    `;
    section.appendChild(yearHeader);
    
    const monthsContainer = document.createElement('div');
    monthsContainer.className = 'months-container';
    
    const groupedByMonth = {};
    posts.forEach(post => {
        const date = convertToTargetTimezone(new Date(post.timestamp));
        const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!groupedByMonth[month]) {
            groupedByMonth[month] = [];
        }
        groupedByMonth[month].push(post);
    });
    
    Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a)).forEach(month => {
        const monthSection = createMonthSection(month, groupedByMonth[month]);
        monthsContainer.appendChild(monthSection);
    });
    
    section.appendChild(monthsContainer);
    
    yearHeader.addEventListener('click', () => {
        toggleCollapse(yearHeader, monthsContainer);
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
    
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    monthHeader.innerHTML = `
        <div class="month-node">
            <svg class="collapse-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <h3 class="month-title">${monthNames[parseInt(monthNum) - 1]}</h3>
            <span class="month-count">${posts.length}</span>
        </div>
    `;
    section.appendChild(monthHeader);
    
    const daysContainer = document.createElement('div');
    daysContainer.className = 'days-container';
    
    const groupedByDay = {};
    posts.forEach(post => {
        const date = convertToTargetTimezone(new Date(post.timestamp));
        const day = `${month}-${String(date.getDate()).padStart(2, '0')}`;
        if (!groupedByDay[day]) {
            groupedByDay[day] = [];
        }
        groupedByDay[day].push(post);
    });
    
    Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a)).forEach(day => {
        const daySection = createDaySection(day, groupedByDay[day]);
        daysContainer.appendChild(daySection);
    });
    
    section.appendChild(daysContainer);
    
    monthHeader.addEventListener('click', () => {
        toggleCollapse(monthHeader, daysContainer);
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
    
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.innerHTML = `
        <div class="day-node">
            <svg class="collapse-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <h4 class="day-title">${month}.${dayNum} ${weekday}</h4>
            <span class="day-count">${posts.length}</span>
        </div>
    `;
    section.appendChild(dayHeader);
    
    const postsContainer = document.createElement('div');
    postsContainer.className = 'posts-container';
    
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .forEach((post, index) => {
        const item = createTimelineItem(post, index);
        postsContainer.appendChild(item);
    });
    
    section.appendChild(postsContainer);
    
    dayHeader.addEventListener('click', () => {
        toggleCollapse(dayHeader, postsContainer);
    });
    
    return section;
}

// 切换折叠状态
function toggleCollapse(header, container) {
    if (container.style.display === 'none') {
        container.style.display = 'block';
        header.classList.remove('collapsed');
    } else {
        container.style.display = 'none';
        header.classList.add('collapsed');
    }
}

// 转换到目标时区
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
    
    const locationHTML = post.location ? `
        <div class="location-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${escapeHtml(post.location)}
        </div>
    ` : '';
    
    item.innerHTML = `
        <div class="content-card">
            <div class="card-header">
                <div class="user-badge">${userName}</div>
                <div class="time-badge">${timeStr}</div>
            </div>
            ${locationHTML}
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
            ${images.map((img, idx) => `
                <div class="image-wrapper" data-images='${JSON.stringify(images)}' data-index="${idx}">
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

// 格式化文本
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

// 设置灯箱
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const counter = lightbox.querySelector('.lightbox-counter');
    
    // 点击图片打开灯箱
    document.addEventListener('click', (e) => {
        const wrapper = e.target.closest('.image-wrapper');
        if (wrapper && e.target.matches('.image-wrapper img')) {
            currentLightboxImages = JSON.parse(wrapper.dataset.images);
            currentLightboxIndex = parseInt(wrapper.dataset.index);
            showLightbox();
        }
    });
    
    // 关闭灯箱
    closeBtn.addEventListener('click', hideLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            hideLightbox();
        }
    });
    
    // 上一张/下一张
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
        updateLightbox();
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
        updateLightbox();
    });
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            hideLightbox();
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    });
    
    function showLightbox() {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateLightbox();
    }
    
    function hideLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function updateLightbox() {
        lightboxImage.src = currentLightboxImages[currentLightboxIndex];
        counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
        
        // 只有一张图片时隐藏前后按钮
        if (currentLightboxImages.length === 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }
}

// 设置模态框
function setupModal() {
    const modal = document.getElementById('addPostModal');
    const addBtn = document.getElementById('addPostBtn');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const form = document.getElementById('addPostForm');
    
    // 打开模态框
    addBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 设置默认时间为当前时间
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
        document.getElementById('postTime').value = localISOTime;
    });
    
    // 关闭模态框
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        form.reset();
        uploadedImageFiles = [];
        document.getElementById('imagePreview').innerHTML = '';
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 提交表单
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = document.getElementById('userSelect').value;
        const timestamp = new Date(document.getElementById('postTime').value).toISOString();
        const location = document.getElementById('postLocation').value.trim();
        const text = document.getElementById('postText').value.trim();
        
        // 转换图片为base64
        const images = await Promise.all(uploadedImageFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }));
        
        const newPost = {
            id: Date.now(),
            user,
            timestamp,
            location: location || undefined,
            text: text || undefined,
            images: images.length > 0 ? images : undefined
        };
        
        // 保存到 localStorage
        const localPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
        localPosts.push(newPost);
        localStorage.setItem('userPosts', JSON.stringify(localPosts));
        
        // 重新加载时间线
        closeModal();
        loadTimeline();
    });
}

// 设置图片上传
function setupImageUpload() {
    const fileInput = document.getElementById('postImages');
    const preview = document.getElementById('imagePreview');
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        uploadedImageFiles = files;
        
        preview.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'image-preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="预览">
                    <button type="button" class="image-preview-remove" data-index="${index}">&times;</button>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
    
    // 删除预览图片
    preview.addEventListener('click', (e) => {
        if (e.target.classList.contains('image-preview-remove')) {
            const index = parseInt(e.target.dataset.index);
            uploadedImageFiles.splice(index, 1);
            
            // 重新创建 FileList（使用 DataTransfer）
            const dt = new DataTransfer();
            uploadedImageFiles.forEach(file => dt.items.add(file));
            document.getElementById('postImages').files = dt.files;
            
            // 重新触发 change 事件
            const event = new Event('change', { bubbles: true });
            document.getElementById('postImages').dispatchEvent(event);
        }
    });
}
