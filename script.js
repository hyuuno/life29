// 全局变量
let accessToken = null;
let mainFolderId = null;
let dataFileId = null;
let imagesFolderId = null;

// 状态 - 默认隐藏图片
let imageDisplayState = 'hidden';
let allPosts = [];
let currentLightboxImages = [];
let currentLightboxIndex = 0;
let uploadedImageFiles = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成');
    setupImageToggle();
    setupLightbox();
    setupImageUpload();
    setupModal();
    initializeGoogleAuth();
});

// 初始化 Google 认证
function initializeGoogleAuth() {
    console.log('初始化 Google 认证');
    
    const checkGIS = setInterval(() => {
        if (window.google && window.google.accounts) {
            clearInterval(checkGIS);
            console.log('Google Identity Services 已加载');
            setupGoogleSignIn();
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(checkGIS);
        if (!window.google || !window.google.accounts) {
            showError('无法加载 Google 认证服务，请刷新页面');
        }
    }, 10000);
}

// 设置 Google 登录
function setupGoogleSignIn() {
    const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: GOOGLE_CONFIG.scope,
        callback: (response) => {
            console.log('认证响应:', response);
            if (response.access_token) {
                accessToken = response.access_token;
                console.log('获取到 access token');
                onSignIn();
            } else if (response.error) {
                console.error('认证错误:', response.error);
                showError('登录失败: ' + response.error);
            }
        }
    });
    
    const header = document.querySelector('.header');
    const signInBtn = document.createElement('button');
    signInBtn.id = 'signInBtn';
    signInBtn.className = 'add-btn';
    signInBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        <span>登录 Google</span>
    `;
    
    signInBtn.addEventListener('click', () => {
        console.log('点击登录按钮');
        client.requestAccessToken();
    });
    
    header.querySelector('.header-controls').appendChild(signInBtn);
    showSignedOut();
}

// 登录成功处理
async function onSignIn() {
    console.log('用户已登录');
    
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
        signInBtn.remove();
    }
    
    document.getElementById('addPostBtn').style.display = 'flex';
    
    try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const user = await userInfo.json();
        console.log('用户信息:', user);
        
        const header = document.querySelector('.header');
        if (!document.getElementById('userInfo')) {
            const userInfoDiv = document.createElement('div');
            userInfoDiv.id = 'userInfo';
            userInfoDiv.style.cssText = 'font-size: 12px; color: var(--text-tertiary); font-family: var(--font-sans);';
            userInfoDiv.textContent = user.email;
            header.appendChild(userInfoDiv);
        }
        
        loadTimeline();
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }
}

// 显示未登录状态
function showSignedOut() {
    const timelineContent = document.getElementById('timelineContent');
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
    
    timelineContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <p style="font-size: 18px; margin-bottom: 12px;">请先登录 Google 账号</p>
            <p style="font-size: 14px;">登录后数据将存储在你的 Google Drive</p>
            <p style="font-size: 13px; margin-top: 8px; color: var(--text-tertiary);">
                文件夹位置: Google Drive / ${GOOGLE_CONFIG.mainFolderName}
            </p>
        </div>
    `;
}

// 显示错误
function showError(message) {
    console.error('错误:', message);
    
    const timelineContent = document.getElementById('timelineContent');
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
    
    timelineContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <p style="font-size: 18px; margin-bottom: 12px; color: #d32f2f;">${message}</p>
            <p style="font-size: 14px; margin-top: 12px;">
                <button onclick="location.reload()" style="padding: 8px 16px; background: #8b7355; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    刷新页面
                </button>
            </p>
        </div>
    `;
}

// Google Drive API 调用
async function driveRequest(endpoint, options = {}) {
    const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...options.headers
        }
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Drive API 错误: ${error}`);
    }
    
    return response.json();
}

// 获取或创建主文件夹
async function getOrCreateMainFolder() {
    if (mainFolderId) return mainFolderId;
    
    try {
        const query = encodeURIComponent(`name='${GOOGLE_CONFIG.mainFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
        const result = await driveRequest(`/files?q=${query}&fields=files(id,name)`);
        
        if (result.files && result.files.length > 0) {
            mainFolderId = result.files[0].id;
            console.log('找到主文件夹:', mainFolderId);
            return mainFolderId;
        }
        
        const folder = await driveRequest('/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: GOOGLE_CONFIG.mainFolderName,
                mimeType: 'application/vnd.google-apps.folder'
            })
        });
        
        mainFolderId = folder.id;
        console.log('创建主文件夹:', mainFolderId);
        return mainFolderId;
    } catch (error) {
        console.error('获取主文件夹失败:', error);
        throw error;
    }
}

// 获取或创建数据文件
async function getOrCreateDataFile() {
    if (dataFileId) return dataFileId;
    
    try {
        const folderId = await getOrCreateMainFolder();
        
        const query = encodeURIComponent(`name='${GOOGLE_CONFIG.dataFileName}' and '${folderId}' in parents and trashed=false`);
        const result = await driveRequest(`/files?q=${query}&fields=files(id,name)`);
        
        if (result.files && result.files.length > 0) {
            dataFileId = result.files[0].id;
            console.log('找到数据文件:', dataFileId);
            return dataFileId;
        }
        
        const initialData = { posts: [] };
        const metadata = {
            name: GOOGLE_CONFIG.dataFileName,
            mimeType: 'application/json',
            parents: [folderId]
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(initialData, null, 2)], { type: 'application/json' }));
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form
        });
        
        const file = await response.json();
        dataFileId = file.id;
        console.log('创建数据文件:', dataFileId);
        return dataFileId;
    } catch (error) {
        console.error('获取数据文件失败:', error);
        throw error;
    }
}

// 获取或创建图片文件夹
async function getOrCreateImagesFolder() {
    if (imagesFolderId) return imagesFolderId;
    
    try {
        const mainFolder = await getOrCreateMainFolder();
        
        const query = encodeURIComponent(`name='${GOOGLE_CONFIG.imagesFolderName}' and '${mainFolder}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
        const result = await driveRequest(`/files?q=${query}&fields=files(id,name)`);
        
        if (result.files && result.files.length > 0) {
            imagesFolderId = result.files[0].id;
            return imagesFolderId;
        }
        
        const folder = await driveRequest('/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: GOOGLE_CONFIG.imagesFolderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [mainFolder]
            })
        });
        
        imagesFolderId = folder.id;
        console.log('创建图片文件夹:', imagesFolderId);
        return imagesFolderId;
    } catch (error) {
        console.error('获取图片文件夹失败:', error);
        throw error;
    }
}

// 读取数据文件
async function readDataFile(fileId) {
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return await response.json();
    } catch (error) {
        console.error('读取数据失败:', error);
        return { posts: [] };
    }
}

// 写入数据文件
async function writeDataFile(fileId, data) {
    try {
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data, null, 2)
        });
        return await response.json();
    } catch (error) {
        console.error('写入数据失败:', error);
        throw error;
    }
}

// 上传图片（支持所有格式包括GIF）
async function uploadImageToDrive(file) {
    try {
        const folderId = await getOrCreateImagesFolder();
        
        const metadata = {
            name: `${Date.now()}_${file.name}`,
            parents: [folderId]
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file); // 保持原始文件类型
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form
        });
        
        const result = await response.json();
        
        // 设置公开权限
        await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'anyone',
                role: 'reader'
            })
        });
        
        // 使用 uc?export=download 来正确显示GIF
        return `https://drive.google.com/uc?export=download&id=${result.id}`;
    } catch (error) {
        console.error('上传图片失败:', error);
        throw error;
    }
}

// 加载时间线
async function loadTimeline() {
    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');
    
    try {
        const fileId = await getOrCreateDataFile();
        const data = await readDataFile(fileId);
        
        allPosts = data.posts || [];
        allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        renderTimeline(allPosts);
        loading.classList.add('hidden');
    } catch (error) {
        console.error('加载失败:', error);
        showError('加载数据失败');
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
    
    const groupedByYear = {};
    posts.forEach(post => {
        const date = convertToTargetTimezone(new Date(post.timestamp));
        const year = date.getFullYear();
        if (!groupedByYear[year]) groupedByYear[year] = [];
        groupedByYear[year].push(post);
    });
    
    Object.keys(groupedByYear).sort((a, b) => b - a).forEach(year => {
        timelineContent.appendChild(createYearSection(year, groupedByYear[year]));
    });
    
    // 应用当前图片显示状态
    applyImageDisplayState();
}

// 创建年份区块
function createYearSection(year, posts) {
    const section = document.createElement('div');
    section.className = 'year-section';
    
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
        if (!groupedByMonth[month]) groupedByMonth[month] = [];
        groupedByMonth[month].push(post);
    });
    
    Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a)).forEach(month => {
        monthsContainer.appendChild(createMonthSection(month, groupedByMonth[month]));
    });
    
    section.appendChild(monthsContainer);
    yearHeader.addEventListener('click', () => toggleCollapse(yearHeader, monthsContainer));
    
    return section;
}

// 创建月份区块
function createMonthSection(month, posts) {
    const section = document.createElement('div');
    section.className = 'month-section';
    
    const [year, monthNum] = month.split('-');
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
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
        if (!groupedByDay[day]) groupedByDay[day] = [];
        groupedByDay[day].push(post);
    });
    
    Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a)).forEach(day => {
        daysContainer.appendChild(createDaySection(day, groupedByDay[day]));
    });
    
    section.appendChild(daysContainer);
    monthHeader.addEventListener('click', () => toggleCollapse(monthHeader, daysContainer));
    
    return section;
}

// 创建日期区块
function createDaySection(day, posts) {
    const section = document.createElement('div');
    section.className = 'day-section';
    
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
        postsContainer.appendChild(createTimelineItem(post, index));
    });
    
    section.appendChild(postsContainer);
    dayHeader.addEventListener('click', () => toggleCollapse(dayHeader, postsContainer));
    
    return section;
}

function toggleCollapse(header, container) {
    if (container.style.display === 'none') {
        container.style.display = 'block';
        header.classList.remove('collapsed');
    } else {
        container.style.display = 'none';
        header.classList.add('collapsed');
    }
}

function convertToTargetTimezone(date) {
    return new Date(date.toLocaleString('en-US', { timeZone: CONFIG.targetTimezone }));
}

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

// 创建图片HTML（默认隐藏，显示提示）
function createImagesHTML(images) {
    const count = images.length;
    return `
        <div class="content-images count-${count}" data-image-count="${count}">
            <div class="images-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>${count} 张图片</span>
            </div>
            ${images.map((img, idx) => `
                <div class="image-wrapper" data-images='${JSON.stringify(images)}' data-index="${idx}">
                    <img src="${img}" alt="照片" loading="lazy">
                </div>
            `).join('')}
        </div>
    `;
}

function formatWeekday(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
}

function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatText(text) {
    return text.split('\n').filter(line => line.trim()).map(line => `<p>${escapeHtml(line)}</p>`).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 图片显示切换（隐藏/显示）
function setupImageToggle() {
    const toggleBtn = document.getElementById('toggleImages');
    
    toggleBtn.addEventListener('click', () => {
        if (imageDisplayState === 'hidden') {
            imageDisplayState = 'visible';
            toggleBtn.setAttribute('data-state', 'visible');
            toggleBtn.querySelector('span').textContent = '隐藏图片';
            toggleBtn.querySelector('svg').innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
        } else {
            imageDisplayState = 'hidden';
            toggleBtn.setAttribute('data-state', 'hidden');
            toggleBtn.querySelector('span').textContent = '显示图片';
            toggleBtn.querySelector('svg').innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `;
        }
        
        applyImageDisplayState();
    });
}

// 应用图片显示状态
function applyImageDisplayState() {
    const allImageContainers = document.querySelectorAll('.content-images');
    
    allImageContainers.forEach(container => {
        const placeholder = container.querySelector('.images-placeholder');
        const images = container.querySelectorAll('.image-wrapper');
        
        if (imageDisplayState === 'hidden') {
            // 隐藏图片，显示提示
            if (placeholder) placeholder.style.display = 'flex';
            images.forEach(img => img.style.display = 'none');
        } else {
            // 显示图片，隐藏提示
            if (placeholder) placeholder.style.display = 'none';
            images.forEach(img => img.style.display = 'block');
        }
    });
}

function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const counter = lightbox.querySelector('.lightbox-counter');
    
    document.addEventListener('click', (e) => {
        const wrapper = e.target.closest('.image-wrapper');
        if (wrapper && e.target.matches('.image-wrapper img')) {
            currentLightboxImages = JSON.parse(wrapper.dataset.images);
            currentLightboxIndex = parseInt(wrapper.dataset.index);
            showLightbox();
        }
    });
    
    closeBtn.addEventListener('click', hideLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) hideLightbox(); });
    
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
    
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') hideLightbox();
        else if (e.key === 'ArrowLeft') prevBtn.click();
        else if (e.key === 'ArrowRight') nextBtn.click();
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
        prevBtn.style.display = nextBtn.style.display = currentLightboxImages.length === 1 ? 'none' : 'flex';
    }
}

function setupModal() {
    const modal = document.getElementById('addPostModal');
    const addBtn = document.getElementById('addPostBtn');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const form = document.getElementById('addPostForm');
    
    addBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        document.getElementById('postTime').value = new Date(now - offset).toISOString().slice(0, 16);
    });
    
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        form.reset();
        uploadedImageFiles = [];
        document.getElementById('imagePreview').innerHTML = '';
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = '上传中...';
        
        try {
            const user = document.getElementById('userSelect').value;
            const timestamp = new Date(document.getElementById('postTime').value).toISOString();
            const location = document.getElementById('postLocation').value.trim();
            const text = document.getElementById('postText').value.trim();
            
            const imageUrls = [];
            for (const file of uploadedImageFiles) {
                submitBtn.textContent = `上传图片 ${imageUrls.length + 1}/${uploadedImageFiles.length}...`;
                imageUrls.push(await uploadImageToDrive(file));
            }
            
            const newPost = {
                id: Date.now(),
                user,
                timestamp,
                location: location || undefined,
                text: text || undefined,
                images: imageUrls.length > 0 ? imageUrls : undefined
            };
            
            const fileId = await getOrCreateDataFile();
            const data = await readDataFile(fileId);
            data.posts.push(newPost);
            
            submitBtn.textContent = '保存中...';
            await writeDataFile(fileId, data);
            
            closeModal();
            await loadTimeline();
            
        } catch (error) {
            console.error('发布失败:', error);
            alert('发布失败: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '发布';
        }
    });
}

function setupImageUpload() {
    const fileInput = document.getElementById('postImages');
    const preview = document.getElementById('imagePreview');
    
    fileInput.addEventListener('change', (e) => {
        uploadedImageFiles = Array.from(e.target.files);
        preview.innerHTML = '';
        
        uploadedImageFiles.forEach((file, index) => {
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
    
    preview.addEventListener('click', (e) => {
        if (e.target.classList.contains('image-preview-remove')) {
            const index = parseInt(e.target.dataset.index);
            uploadedImageFiles.splice(index, 1);
            
            const dt = new DataTransfer();
            uploadedImageFiles.forEach(file => dt.items.add(file));
            document.getElementById('postImages').files = dt.files;
            
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}
