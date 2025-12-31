/**
 * Life29 - City Page
 * 城市详情页：Gallery / Moments / Timeline
 */

class CityPage {
    constructor() {
        this.cityId = new URLSearchParams(window.location.search).get('id');
        this.cityData = null;
        this.moments = [];
        this.allImages = [];
        this.currentUser = localStorage.getItem('life29-user') || 'wiwi';
        
        // 分页配置
        this.photosPerPage = 12;
        this.momentsPerPage = 6;
        this.currentGalleryYear = null;
        this.currentGalleryPage = 1;
        this.currentMomentsPage = 1;
        
        // 封面轮播
        this.coverImages = [];
        this.coverIndex = 0;
        this.coverInterval = null;
        
        // 图片查看器
        this.viewerImages = [];
        this.viewerIndex = 0;
        
        this.init();
    }
    
    async init() {
        this.setupTheme();
        this.setupScrollHeader();
        this.setupTabs();
        this.setupUserDropdown();
        
        await this.initCloud();
        await this.loadCityData();
        
        this.renderCover();
        this.renderGallery();
        this.renderMoments();
        this.renderTimeline();
        
        this.bindEvents();
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('life29-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('life29-theme', next);
        });
    }
    
    setupScrollHeader() {
        const header = document.querySelector('.header-city');
        const cover = document.querySelector('.city-cover');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > cover?.offsetHeight - 100) {
                header?.classList.add('scrolled');
            } else {
                header?.classList.remove('scrolled');
            }
        });
    }
    
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tab}Panel`)?.classList.add('active');
            });
        });
    }
    
    setupUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        const btn = document.getElementById('userBtn');
        const menu = document.getElementById('userMenu');
        
        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            menu?.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            menu?.classList.remove('show');
        });
        
        menu?.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentUser = item.dataset.user;
                localStorage.setItem('life29-user', this.currentUser);
                menu?.classList.remove('show');
            });
        });
        
        // 标记当前用户
        menu?.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.toggle('active', item.dataset.user === this.currentUser);
        });
    }
    
    async initCloud() {
        if (window.supabaseService) {
            await window.supabaseService.init();
        }
        if (window.cloudinaryService) {
            window.cloudinaryService.init();
        }
    }
    
    async loadCityData() {
        if (!this.cityId) {
            window.location.href = 'index.html';
            return;
        }
        
        // 从云端加载 moments
        if (window.supabaseService?.isConnected()) {
            const cityName = decodeURIComponent(this.cityId);
            this.moments = await window.supabaseService.getMoments({ city: cityName });
            
            // 提取城市信息
            if (this.moments.length > 0) {
                const first = this.moments[0];
                this.cityData = {
                    name: first.city,
                    country: first.country,
                    nameEn: first.city
                };
            } else {
                this.cityData = {
                    name: cityName,
                    country: '',
                    nameEn: cityName
                };
            }
        }
        
        // 收集所有图片
        this.allImages = [];
        this.moments.forEach(m => {
            const urls = this.parseImageUrls(m.image_urls);
            urls.forEach(url => {
                this.allImages.push({
                    url,
                    date: m.date,
                    content: m.content,
                    user: m.user_name,
                    momentId: m.id
                });
            });
        });
        
        // 按日期排序（最新的在前）
        this.allImages.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.moments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 更新页面标题
        document.title = `${this.cityData.name} · Life29`;
        document.getElementById('cityName').textContent = this.cityData.name;
        document.getElementById('cityCountry').textContent = this.cityData.country;
        document.getElementById('photoCount').textContent = this.allImages.length;
        document.getElementById('momentCount').textContent = this.moments.length;
    }
    
    parseImageUrls(imageUrls) {
        if (!imageUrls) return [];
        if (Array.isArray(imageUrls)) return imageUrls;
        try {
            const parsed = JSON.parse(imageUrls);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            return imageUrls.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    
    // ==========================================
    // 封面轮播
    // ==========================================
    
    renderCover() {
        const slideshow = document.getElementById('coverSlideshow');
        const indicators = document.getElementById('coverIndicators');
        
        // 随机选择最多5张图片
        this.coverImages = [...this.allImages]
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
        
        if (this.coverImages.length === 0) {
            // 使用默认渐变背景
            slideshow.innerHTML = '<div class="cover-slide active" style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);"></div>';
            return;
        }
        
        // 创建幻灯片
        slideshow.innerHTML = this.coverImages.map((img, i) => `
            <div class="cover-slide ${i === 0 ? 'active' : ''}" 
                 style="background-image: url('${this.getThumbnail(img.url, 1200)}');"></div>
        `).join('');
        
        // 创建指示器
        indicators.innerHTML = this.coverImages.map((_, i) => `
            <div class="cover-indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
        `).join('');
        
        // 绑定指示器点击
        indicators.querySelectorAll('.cover-indicator').forEach(ind => {
            ind.addEventListener('click', () => {
                this.goToCoverSlide(parseInt(ind.dataset.index));
            });
        });
        
        // 自动轮播
        if (this.coverImages.length > 1) {
            this.coverInterval = setInterval(() => this.nextCoverSlide(), 5000);
        }
    }
    
    nextCoverSlide() {
        this.coverIndex = (this.coverIndex + 1) % this.coverImages.length;
        this.updateCoverSlide();
    }
    
    goToCoverSlide(index) {
        this.coverIndex = index;
        this.updateCoverSlide();
        
        // 重置定时器
        if (this.coverInterval) {
            clearInterval(this.coverInterval);
            this.coverInterval = setInterval(() => this.nextCoverSlide(), 5000);
        }
    }
    
    updateCoverSlide() {
        const slides = document.querySelectorAll('.cover-slide');
        const indicators = document.querySelectorAll('.cover-indicator');
        
        slides.forEach((s, i) => s.classList.toggle('active', i === this.coverIndex));
        indicators.forEach((ind, i) => ind.classList.toggle('active', i === this.coverIndex));
    }
    
    // ==========================================
    // Gallery - 按年份的相册
    // ==========================================
    
    renderGallery() {
        const yearsContainer = document.getElementById('galleryYears');
        const emptyState = document.getElementById('galleryEmpty');
        
        if (this.allImages.length === 0) {
            yearsContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        // 按年份分组
        const yearGroups = {};
        this.allImages.forEach(img => {
            const year = new Date(img.date).getFullYear();
            if (!yearGroups[year]) yearGroups[year] = [];
            yearGroups[year].push(img);
        });
        
        // 按年份降序排序
        const years = Object.keys(yearGroups).sort((a, b) => b - a);
        
        yearsContainer.innerHTML = years.map(year => {
            const images = yearGroups[year];
            const cover = images[0];
            return `
                <div class="year-album" data-year="${year}">
                    <img class="year-album-cover" src="${this.getThumbnail(cover.url, 400)}" alt="${year}">
                    <div class="year-album-overlay">
                        <span class="year-album-year">${year}</span>
                        <span class="year-album-count">${images.length} 张照片</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定点击事件
        yearsContainer.querySelectorAll('.year-album').forEach(album => {
            album.addEventListener('click', () => {
                this.openYearGallery(album.dataset.year);
            });
        });
    }
    
    openYearGallery(year) {
        this.currentGalleryYear = year;
        this.currentGalleryPage = 1;
        
        document.getElementById('galleryYears').style.display = 'none';
        document.getElementById('galleryPhotos').classList.remove('hidden');
        document.getElementById('galleryYearTitle').textContent = `${year} 年`;
        
        this.renderYearPhotos();
    }
    
    closeYearGallery() {
        document.getElementById('galleryYears').style.display = 'grid';
        document.getElementById('galleryPhotos').classList.add('hidden');
        this.currentGalleryYear = null;
    }
    
    renderYearPhotos() {
        const grid = document.getElementById('photosGrid');
        const pagination = document.getElementById('galleryPagination');
        
        // 获取当前年份的图片
        const yearImages = this.allImages.filter(img => 
            new Date(img.date).getFullYear().toString() === this.currentGalleryYear
        );
        
        const totalPages = Math.ceil(yearImages.length / this.photosPerPage);
        const start = (this.currentGalleryPage - 1) * this.photosPerPage;
        const pageImages = yearImages.slice(start, start + this.photosPerPage);
        
        grid.innerHTML = pageImages.map((img, i) => `
            <div class="photo-card" data-index="${start + i}">
                <img src="${this.getThumbnail(img.url, 300)}" alt="">
                <div class="photo-card-overlay">
                    <span class="photo-date">${this.formatDate(img.date)}</span>
                </div>
            </div>
        `).join('');
        
        // 绑定点击打开查看器
        grid.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.openImageViewer(yearImages, index);
            });
        });
        
        // 渲染分页
        this.renderPagination(pagination, this.currentGalleryPage, totalPages, (page) => {
            this.currentGalleryPage = page;
            this.renderYearPhotos();
        });
    }
    
    // ==========================================
    // Moments - 日志卡片
    // ==========================================
    
    renderMoments() {
        const list = document.getElementById('momentsList');
        const pagination = document.getElementById('momentsPagination');
        const emptyState = document.getElementById('momentsEmpty');
        
        if (this.moments.length === 0) {
            list.style.display = 'none';
            pagination.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        const totalPages = Math.ceil(this.moments.length / this.momentsPerPage);
        const start = (this.currentMomentsPage - 1) * this.momentsPerPage;
        const pageMoments = this.moments.slice(start, start + this.momentsPerPage);
        
        list.innerHTML = pageMoments.map(m => {
            const images = this.parseImageUrls(m.image_urls);
            const imageClass = images.length === 1 ? 'single' : (images.length > 1 ? 'multiple' : '');
            
            return `
                <div class="moment-card" data-id="${m.id}">
                    <div class="moment-card-header">
                        <span class="moment-card-date">${this.formatDate(m.date)}</span>
                        <span class="moment-card-user">
                            <span class="moment-card-user-avatar">${(m.user_name || 'U')[0].toUpperCase()}</span>
                            ${m.user_name || '匿名'}
                        </span>
                    </div>
                    ${images.length > 0 ? `
                        <div class="moment-card-images ${imageClass}">
                            ${images.slice(0, 3).map(url => `
                                <img src="${this.getThumbnail(url, 300)}" alt="">
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="moment-card-content">${m.content || ''}</div>
                </div>
            `;
        }).join('');
        
        // 绑定点击打开详情
        list.querySelectorAll('.moment-card').forEach(card => {
            card.addEventListener('click', () => {
                const moment = this.moments.find(m => m.id === card.dataset.id);
                if (moment) this.openMomentDetail(moment);
            });
        });
        
        // 渲染分页
        this.renderPagination(pagination, this.currentMomentsPage, totalPages, (page) => {
            this.currentMomentsPage = page;
            this.renderMoments();
        });
    }
    
    openMomentDetail(moment) {
        const modal = document.getElementById('momentModal');
        const images = this.parseImageUrls(moment.image_urls);
        
        document.getElementById('momentDetailDate').textContent = this.formatDate(moment.date, true);
        document.getElementById('momentDetailUser').innerHTML = `
            <span class="moment-card-user-avatar">${(moment.user_name || 'U')[0].toUpperCase()}</span>
            ${moment.user_name || '匿名'}
        `;
        
        document.getElementById('momentDetailImages').innerHTML = images.map(url => `
            <img src="${this.getThumbnail(url, 800)}" alt="" data-url="${url}">
        `).join('');
        
        document.getElementById('momentDetailContent').textContent = moment.content || '';
        
        modal.classList.remove('hidden');
        
        // 图片点击打开查看器
        modal.querySelectorAll('.moment-detail-images img').forEach((img, i) => {
            img.addEventListener('click', () => {
                this.openImageViewer(images.map(url => ({ url })), i);
            });
        });
    }
    
    closeMomentDetail() {
        document.getElementById('momentModal').classList.add('hidden');
    }
    
    // ==========================================
    // Timeline - 时间线
    // ==========================================
    
    renderTimeline() {
        const container = document.getElementById('timelineItems');
        const emptyState = document.getElementById('timelineEmpty');
        
        // 合并所有内容并按时间排序
        const items = [];
        
        // 添加 moments
        this.moments.forEach(m => {
            const images = this.parseImageUrls(m.image_urls);
            items.push({
                type: 'moment',
                date: m.date,
                data: m,
                thumb: images[0] || null
            });
        });
        
        if (items.length === 0) {
            container.parentElement.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        // 按日期降序排序
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 按年份分组并插入年份标记
        let currentYear = null;
        const itemsWithYears = [];
        
        items.forEach(item => {
            const year = new Date(item.date).getFullYear();
            if (year !== currentYear) {
                itemsWithYears.push({ type: 'year-marker', year });
                currentYear = year;
            }
            itemsWithYears.push(item);
        });
        
        container.innerHTML = itemsWithYears.map(item => {
            if (item.type === 'year-marker') {
                return `
                    <div class="timeline-year-marker">
                        <span>${item.year}</span>
                    </div>
                `;
            }
            
            return `
                <div class="timeline-item ${item.type}" data-id="${item.data?.id || ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-date">${this.formatDate(item.date)}</div>
                        ${item.thumb ? `<img class="timeline-thumb" src="${this.getThumbnail(item.thumb, 200)}" alt="">` : ''}
                        <div class="timeline-text">${item.data?.content || ''}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定点击事件
        container.querySelectorAll('.timeline-item.moment').forEach(el => {
            el.addEventListener('click', () => {
                const moment = this.moments.find(m => m.id === el.dataset.id);
                if (moment) this.openMomentDetail(moment);
            });
        });
    }
    
    // ==========================================
    // 图片查看器
    // ==========================================
    
    openImageViewer(images, startIndex = 0) {
        this.viewerImages = images;
        this.viewerIndex = startIndex;
        
        const viewer = document.getElementById('imageViewer');
        viewer.classList.remove('hidden');
        
        this.updateViewer();
    }
    
    closeImageViewer() {
        document.getElementById('imageViewer').classList.add('hidden');
    }
    
    updateViewer() {
        const img = document.getElementById('viewerImage');
        const caption = document.getElementById('viewerCaption');
        const counter = document.getElementById('viewerCounter');
        
        const current = this.viewerImages[this.viewerIndex];
        img.src = current.url || current;
        caption.textContent = current.content || '';
        counter.textContent = `${this.viewerIndex + 1} / ${this.viewerImages.length}`;
    }
    
    prevImage() {
        this.viewerIndex = (this.viewerIndex - 1 + this.viewerImages.length) % this.viewerImages.length;
        this.updateViewer();
    }
    
    nextImage() {
        this.viewerIndex = (this.viewerIndex + 1) % this.viewerImages.length;
        this.updateViewer();
    }
    
    // ==========================================
    // 分页渲染
    // ==========================================
    
    renderPagination(container, currentPage, totalPages, onPageChange) {
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一页
        html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>`;
        
        // 页码
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span class="page-btn" style="cursor: default;">...</span>`;
            }
        }
        
        // 下一页
        html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>`;
        
        container.innerHTML = html;
        
        container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages && page !== currentPage) {
                    onPageChange(page);
                }
            });
        });
    }
    
    // ==========================================
    // 工具方法
    // ==========================================
    
    getThumbnail(url, size) {
        if (window.cloudinaryService) {
            return window.cloudinaryService.getThumbnailUrl(url, size);
        }
        return url;
    }
    
    formatDate(dateStr, full = false) {
        const date = new Date(dateStr);
        if (full) {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
    }
    
    // ==========================================
    // 事件绑定
    // ==========================================
    
    bindEvents() {
        // Gallery 返回按钮
        document.getElementById('galleryBack')?.addEventListener('click', () => {
            this.closeYearGallery();
        });
        
        // Moment 详情关闭
        document.getElementById('closeMomentModal')?.addEventListener('click', () => {
            this.closeMomentDetail();
        });
        
        document.querySelector('#momentModal .modal-backdrop')?.addEventListener('click', () => {
            this.closeMomentDetail();
        });
        
        // 图片查看器
        document.querySelector('.viewer-close')?.addEventListener('click', () => {
            this.closeImageViewer();
        });
        
        document.querySelector('.viewer-backdrop')?.addEventListener('click', () => {
            this.closeImageViewer();
        });
        
        document.querySelector('.viewer-prev')?.addEventListener('click', () => {
            this.prevImage();
        });
        
        document.querySelector('.viewer-next')?.addEventListener('click', () => {
            this.nextImage();
        });
        
        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('imageViewer').classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') this.prevImage();
                if (e.key === 'ArrowRight') this.nextImage();
                if (e.key === 'Escape') this.closeImageViewer();
            }
            
            if (!document.getElementById('momentModal').classList.contains('hidden')) {
                if (e.key === 'Escape') this.closeMomentDetail();
            }
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.cityPage = new CityPage();
});
