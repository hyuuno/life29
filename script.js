// Google API 客户端
let gapi = null;
let googleAuth = null;
let mainFolderId = null;
let dataFileId = null;
let imagesFolderId = null;

// 状态
let imageDisplayState = 'preview';
let allPosts = [];
let currentLightboxImages = [];
let currentLightboxIndex = 0;
let uploadedImageFiles = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupImageToggle();
    setupLightbox();
    setupImageUpload();
    setupModal();
    initGoogleAPI();
});

// 初始化 Google API
function initGoogleAPI() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
        window.gapi.load('client:auth2', initClient);
    };
    document.body.appendChild(script);
}

// 初始化 Google API 客户端（移除 apiKey）
async function initClient() {
    try {
        await window.gapi.client.init({
            clientId: GOOGLE_CONFIG.clientId,
            discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
            scope: GOOGLE_CONFIG.scope
        });
        
        gapi = window.gapi;
        googleAuth = gapi.auth2.getAuthInstance();
        
        googleAuth.isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(googleAuth.isSignedIn.get());
        
    } catch (error) {
        console.error('Google API 初始化失败:', error);
        showError('Google API 初始化失败，请刷新页面重试');
    }
}

// 更新登录状态
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        showSignedIn();
        loadTimeline();
    } else {
        showSignedOut();
    }
}

// 显示已登录状态
function showSignedIn() {
    const header = document.querySelector('.header');
    const existingBtn = document.getElementById('signInBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    document.getElementById('addPostBtn').style.display = 'flex';
    
    const userEmail = googleAuth.currentUser.get().getBasicProfile().getEmail();
    if (!document.getElementById('userInfo')) {
        const userInfo = document.createElement('div');
        userInfo.id = 'userInfo';
        userInfo.style.cssText = 'font-size: 12px; color: var(--text-tertiary); font-family: var(--font-sans);';
        userInfo.textContent = userEmail;
        header.appendChild(userInfo);
    }
}

// 显示未登录状态
function showSignedOut() {
    const header = document.querySelector('.header');
    
    document.getElementById('addPostBtn').style.display = 'none';
    
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.remove();
    }
    
    if (!document.getElementById('signInBtn')) {
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
        signInBtn.addEventListener('click', () => googleAuth.signIn());
        header.querySelector('.header-controls').appendChild(signInBtn);
    }
    
    const timelineContent = document.getElementById('timelineContent');
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

// 显示错误信息
function showError(message) {
    const timelineContent = document.getElementById('timelineContent');
    timelineContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <p style="font-size: 18px; margin-bottom: 12px; color: #d32f2f;">${message}</p>
        </div>
    `;
}

// 获取或创建主文件夹
async function getOrCreateMainFolder() {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${GOOGLE_CONFIG.mainFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });
        
        const folders = response.result.files;
        
        if (folders && folders.length > 0) {
            mainFolderId = folders[0].id;
            return mainFolderId;
        } else {
            const folderMetadata = {
                name: GOOGLE_CONFIG.mainFolderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            
            const folder = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });
            
            mainFolderId = folder.result.id;
            console.log(`已创建主文件夹: ${GOOGLE_CONFIG.mainFolderName}`);
            return mainFolderId;
        }
    } catch (error) {
        console.error('创建主文件夹失败:', error);
        throw error;
    }
}

// 获取或创建数据文件
async function getOrCreateDataFile() {
    try {
        const folderId = await getOrCreateMainFolder();
        
        const response = await gapi.client.drive.files.list({
            q: `name='${GOOGLE_CONFIG.dataFileName}' and '${folderId}' in parents and mimeType='application/json' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });
        
        const files = response.result.files;
        
        if (files && files.length > 0) {
            dataFileId = files[0].id;
            return dataFileId;
        } else {
            const fileMetadata = {
                name: GOOGLE_CONFIG.dataFileName,
                mimeType: 'application/json',
                parents: [folderId]
            };
            
            const initialData = {
                posts: []
            };
            
            const file = new Blob([JSON.stringify(initialData, null, 2)], { type: 'application/json' });
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
            form.append('file', file);
            
            const createResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
                body: form
            });
            
            const result = await createResponse.json();
            dataFileId = result.id;
            console.log(`已创建数据文件: ${GOOGLE_CONFIG.mainFolderName}/${GOOGLE_CONFIG.dataFileName}`);
            return dataFileId;
        }
    } catch (error) {
        console.error('获取数据文件失败:', error);
        throw error;
    }
}

// 获取或创建图片文件夹
async function getOrCreateImagesFolder() {
    try {
        const mainFolder = await getOrCreateMainFolder();
        
        const response = await gapi.client.drive.files.list({
            q: `name='${GOOGLE_CONFIG.imagesFolderName}' and '${mainFolder}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });
        
        const folders = response.result.files;
        
        if (folders && folders.length > 0) {
            imagesFolderId = folders[0].id;
            return imagesFolderId;
        } else {
            const folderMetadata = {
                name: GOOGLE_CONFIG.imagesFolderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [mainFolder]
            };
            
            const folder = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });
            
            imagesFolderId = folder.result.id;
            console.log(`已创建图片文件夹: ${GOOGLE_CONFIG.mainFolderName}/${GOOGLE_CONFIG.imagesFolderName}`);
            return imagesFolderId;
        }
    } catch (error) {
        console.error('创建图片文件夹失败:', error);
        throw error;
    }
}

// 读取数据文件
async function readDataFile(fileId) {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        return response.result;
    } catch (error) {
        console.error('读取数据失败:', error);
        return { posts: [] };
    }
}

// 写入数据文件
async function writeDataFile(fileId, data) {
    try {
        const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: new Headers({ 
                'Authorization': 'Bearer ' + gapi.auth.getToken().access_token,
                'Content-Type': 'application/json'
            }),
            body: file
        });
        
        return await response.json();
    } catch (error) {
        console.error('写入数据失败:', error);
        throw error;
    }
}

// 上传图片到 Drive
async function uploadImageToDrive(file) {
    try {
        const folderId = await getOrCreateImagesFolder();
        
        const fileMetadata = {
            name: `${Date.now()}_${file.name}`,
            parents: [folderId]
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        form.append('file', file);
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
            body: form
        });
        
        const result = await response.json();
        
        await gapi.client.drive.permissions.create({
            fileId: result.id,
            resource: {
                type: 'anyone',
                role: 'reader'
            }
        });
        
        console.log(`图片已上传: ${GOOGLE_CONFIG.mainFolderName}/${GOOGLE_CONFIG.imagesFolderName}/${fileMetadata.name}`);
        return `https://drive.google.com/uc?export=view&id=${result.id}`;
    } catch (error) {
        console.error('上传图片失败:', error);
        throw error;
    }
}

// 加载时间线
async function loadTimeline() {
    const loading = document.getElementById('loading');
    const timelineContent = document.getElementById('timelineContent');
    
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
        showError('加载数据失败，请刷新页面重试');
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
                <p style="font-size: 13px; margin-top: 12px; color: var(--text-tertiary);">
                    数据将保存在: Google Drive / ${GOOGLE_CONFIG.mainFolderName}
                </p>
            </div>
        `;
        return;
    }
    
    const groupedByYear = {};
    posts.forEach(post => {
        const date = convertToTargetTimezone(new Date(post.timestamp));
        const year = date.getFullYear();
        if (!groupedByYear[year]) {
            groupedByYear[year] = [];
        }
        groupedByYear[year].push(post);
    });
    
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

// 切换折叠
function toggleCollapse(header, container) {
    if (container.style.display === 'none') {
        container.style.display = 'block';
        header.classList.remove('collapsed');
    } else {
        container.style.display = 'none';
        header.classList.add('collapsed');
    }
}

// 转换时区
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

function formatWeekday(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatText(text) {
    return text.split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${escapeHtml(line)}</p>`)
        .join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 图片切换
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

// 灯箱
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
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) hideLightbox();
    });
    
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
        
        if (currentLightboxImages.length === 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }
}

// 模态框
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
        const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
        document.getElementById('postTime').value = localISOTime;
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
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
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
                const url = await uploadImageToDrive(file);
                imageUrls.push(url);
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

// 图片上传
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
    
    preview.addEventListener('click', (e) => {
        if (e.target.classList.contains('image-preview-remove')) {
            const index = parseInt(e.target.dataset.index);
            uploadedImageFiles.splice(index, 1);
            
            const dt = new DataTransfer();
            uploadedImageFiles.forEach(file => dt.items.add(file));
            document.getElementById('postImages').files = dt.files;
            
            const event = new Event('change', { bubbles: true });
            document.getElementById('postImages').dispatchEvent(event);
        }
    });
}
