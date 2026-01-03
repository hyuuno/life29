/**
 * Life29 - City Page
 * 城市详情页：Gallery / Moments / Timeline
 * 包含互动背景和添加 Moment 功能
 */

class CityPage {
    constructor() {
        // 从 URL 获取城市和国家参数
        const params = new URLSearchParams(window.location.search);
        this.cityName = params.get('city') || params.get('id') || ''; // 兼容旧格式
        this.countryName = params.get('country') || '';
        
        this.cityData = null;
        this.moments = [];
        this.allImages = [];
        this.currentUser = localStorage.getItem('life29-user') || 'wiwi';
        
        // 城市名称映射表（中文 <-> 英文）
        this.cityNameMap = {
            // 美国城市
            '旧金山': 'San Francisco', 'San Francisco': '旧金山',
            '洛杉矶': 'Los Angeles', 'Los Angeles': '洛杉矶',
            '纽约': 'New York', 'New York': '纽约',
            '芝加哥': 'Chicago', 'Chicago': '芝加哥',
            '休斯顿': 'Houston', 'Houston': '休斯顿',
            '凤凰城': 'Phoenix', 'Phoenix': '凤凰城',
            '费城': 'Philadelphia', 'Philadelphia': '费城',
            '圣安东尼奥': 'San Antonio', 'San Antonio': '圣安东尼奥',
            '圣地亚哥': 'San Diego', 'San Diego': '圣地亚哥',
            '达拉斯': 'Dallas', 'Dallas': '达拉斯',
            '圣何塞': 'San Jose', 'San Jose': '圣何塞',
            '奥斯汀': 'Austin', 'Austin': '奥斯汀',
            '西雅图': 'Seattle', 'Seattle': '西雅图',
            '丹佛': 'Denver', 'Denver': '丹佛',
            '波士顿': 'Boston', 'Boston': '波士顿',
            '拉斯维加斯': 'Las Vegas', 'Las Vegas': '拉斯维加斯',
            '波特兰': 'Portland', 'Portland': '波特兰',
            '迈阿密': 'Miami', 'Miami': '迈阿密',
            '亚特兰大': 'Atlanta', 'Atlanta': '亚特兰大',
            '华盛顿': 'Washington DC', 'Washington DC': '华盛顿'
        };
        
        // 分页配置
        this.photosPerPage = 12;
        this.momentsPerPage = 6;
        this.currentGalleryYear = null;
        this.currentGalleryPage = 1;
        this.currentMomentsPage = 1;
        
        // 图片查看器
        this.viewerImages = [];
        this.viewerIndex = 0;
        
        // 上传相关
        this.uploadFiles = [];
        
        // 背景颜色配置
        this.colorPresets = {
            rose: { h: 350, s: 60, l: 70 },
            sky: { h: 200, s: 60, l: 70 },
            mint: { h: 160, s: 50, l: 65 },
            lavender: { h: 270, s: 50, l: 70 },
            peach: { h: 30, s: 70, l: 70 },
            gold: { h: 45, s: 60, l: 70 }
        };
        
        // 读取保存的颜色或随机选择
        const savedColor = localStorage.getItem(`life29-city-color-${this.cityName}`);
        this.currentColorName = savedColor || this.getRandomColorName();
        this.bgColor = this.colorPresets[this.currentColorName];
        
        this.init();
    }
    
    async init() {
        this.setupTheme();
        this.setupScrollHeader();
        this.setupTabs();
        this.setupUserDropdown();
        this.setupColorPalette();
        this.initCanvas();
        
        await this.initCloud();
        await this.loadCityData();
        
        this.renderGallery();
        this.renderMoments();
        this.renderTimeline();
        
        this.bindEvents();
        this.setupAddMoment();
    }
    
    // ==========================================
    // 调色板功能
    // ==========================================
    
    getRandomColorName() {
        const names = Object.keys(this.colorPresets);
        return names[Math.floor(Math.random() * names.length)];
    }
    
    setupColorPalette() {
        const dropdown = document.getElementById('colorPaletteDropdown');
        const btn = document.getElementById('colorPaletteBtn');
        const menu = document.getElementById('colorPaletteMenu');
        
        // 标记当前选中的颜色
        menu?.querySelectorAll('.palette-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === this.currentColorName);
        });
        
        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown?.classList.toggle('open');
        });
        
        document.addEventListener('click', () => {
            dropdown?.classList.remove('open');
        });
        
        menu?.querySelectorAll('.palette-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const colorName = opt.dataset.color;
                this.changeColor(colorName);
                
                // 更新选中状态
                menu.querySelectorAll('.palette-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                
                dropdown?.classList.remove('open');
            });
        });
    }
    
    changeColor(colorName) {
        if (!this.colorPresets[colorName]) return;
        
        this.currentColorName = colorName;
        this.bgColor = this.colorPresets[colorName];
        
        // 保存到 localStorage
        localStorage.setItem(`life29-city-color-${this.cityName}`, colorName);
        
        // 重新初始化画布（会自动使用新颜色）
        this.initCanvas();
    }
    
    // ==========================================
    // 随机颜色背景 + 互动效果
    // ==========================================
    
    initCanvas() {
        const canvas = document.getElementById('coverCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;
        
        // 鼠标位置
        let mouseX = width / 2;
        let mouseY = height / 2;
        let targetX = mouseX;
        let targetY = mouseY;
        
        // 波浪参数
        const waves = [];
        const waveCount = 5;
        
        for (let i = 0; i < waveCount; i++) {
            waves.push({
                y: height * (0.3 + i * 0.15),
                amplitude: 20 + i * 10,
                frequency: 0.01 + i * 0.005,
                speed: 0.02 + i * 0.01,
                phase: Math.random() * Math.PI * 2,
                opacity: 0.1 + i * 0.05
            });
        }
        
        // 线条参数
        const lines = [];
        const lineCount = 8;
        
        for (let i = 0; i < lineCount; i++) {
            lines.push({
                startX: Math.random() * width,
                startY: Math.random() * height,
                length: 100 + Math.random() * 200,
                angle: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 1,
                width: 2 + Math.random() * 4,
                opacity: 0
            });
        }
        
        const { h, s, l } = this.bgColor;
        
        const draw = () => {
            // 平滑跟随鼠标
            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;
            
            // 背景渐变
            const gradient = ctx.createRadialGradient(
                targetX, targetY, 0,
                targetX, targetY, Math.max(width, height)
            );
            gradient.addColorStop(0, `hsl(${h}, ${s}%, ${l + 10}%)`);
            gradient.addColorStop(0.5, `hsl(${h}, ${s}%, ${l}%)`);
            gradient.addColorStop(1, `hsl(${h + 20}, ${s - 10}%, ${l - 15}%)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // 绘制波浪
            waves.forEach(wave => {
                wave.phase += wave.speed;
                
                ctx.beginPath();
                ctx.moveTo(0, wave.y);
                
                for (let x = 0; x <= width; x += 5) {
                    const distFromMouse = Math.abs(x - targetX) / width;
                    const mouseInfluence = Math.max(0, 1 - distFromMouse * 2);
                    const extraAmp = mouseInfluence * 30;
                    
                    const y = wave.y + 
                        Math.sin(x * wave.frequency + wave.phase) * (wave.amplitude + extraAmp) +
                        Math.sin(x * wave.frequency * 0.5 + wave.phase * 0.7) * wave.amplitude * 0.5;
                    
                    ctx.lineTo(x, y);
                }
                
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                
                ctx.fillStyle = `hsla(${h}, ${s}%, ${l + 20}%, ${wave.opacity})`;
                ctx.fill();
            });
            
            // 绘制粗线条（鼠标悬停时显示）
            const mouseInCanvas = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
            
            lines.forEach(line => {
                // 计算与鼠标的距离
                const dx = line.startX + line.length / 2 * Math.cos(line.angle) - targetX;
                const dy = line.startY + line.length / 2 * Math.sin(line.angle) - targetY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 根据距离调整透明度
                const maxDist = 300;
                const targetOpacity = mouseInCanvas && dist < maxDist ? 
                    (1 - dist / maxDist) * 0.4 : 0;
                
                line.opacity += (targetOpacity - line.opacity) * 0.1;
                
                if (line.opacity > 0.01) {
                    // 线条随鼠标移动
                    const angleToMouse = Math.atan2(targetY - line.startY, targetX - line.startX);
                    line.angle += (angleToMouse - line.angle) * 0.02;
                    
                    ctx.beginPath();
                    ctx.moveTo(line.startX, line.startY);
                    ctx.lineTo(
                        line.startX + line.length * Math.cos(line.angle),
                        line.startY + line.length * Math.sin(line.angle)
                    );
                    ctx.strokeStyle = `hsla(0, 0%, 100%, ${line.opacity})`;
                    ctx.lineWidth = line.width;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
                
                // 缓慢移动
                line.startX += Math.cos(line.angle + Math.PI / 2) * line.speed * 0.1;
                line.startY += Math.sin(line.angle + Math.PI / 2) * line.speed * 0.1;
                
                // 边界检测
                if (line.startX < -100) line.startX = width + 100;
                if (line.startX > width + 100) line.startX = -100;
                if (line.startY < -100) line.startY = height + 100;
                if (line.startY > height + 100) line.startY = -100;
            });
            
            requestAnimationFrame(draw);
        };
        
        // 监听鼠标
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mouseleave', () => {
            mouseX = width / 2;
            mouseY = height / 2;
        });
        
        // 监听窗口大小
        window.addEventListener('resize', () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        });
        
        draw();
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
                
                // 更新激活状态
                menu?.querySelectorAll('.dropdown-item').forEach(i => {
                    i.classList.toggle('active', i.dataset.user === this.currentUser);
                });
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
        // cloudinaryService 不需要 init
    }
    
    async loadCityData() {
        if (!this.cityName) {
            window.location.href = 'index.html';
            return;
        }
        
        const cityName = decodeURIComponent(this.cityName);
        const countryName = decodeURIComponent(this.countryName);
        
        // 获取可能的城市名称（中英文两种）
        const alternateName = this.cityNameMap[cityName];
        const cityNames = alternateName ? [cityName, alternateName] : [cityName];
        
        // 从云端加载 moments
        if (window.supabaseService?.isConnected()) {
            // 使用多个城市名称查询（支持中英文）
            this.moments = await window.supabaseService.getMomentsByCityNames(cityNames, countryName);
            
            // 如果新方法不存在，回退到旧方法
            if (this.moments === null) {
                this.moments = await window.supabaseService.getMoments({ city: cityName });
            }
            
            // 提取城市信息
            if (this.moments.length > 0) {
                const first = this.moments[0];
                this.cityData = {
                    name: cityName,  // 使用URL中的名称作为显示名
                    country: first.country,
                    nameEn: first.city
                };
            } else {
                this.cityData = {
                    name: cityName,
                    country: countryName,
                    nameEn: cityName
                };
            }
        } else {
            this.cityData = {
                name: cityName,
                country: countryName,
                nameEn: cityName
            };
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
        
        // 更新页面
        document.title = `${this.cityData.name} · Life29`;
        document.getElementById('cityName').textContent = this.cityData.name;
        document.getElementById('cityCountry').textContent = this.cityData.country;
        document.getElementById('photoCount').textContent = this.allImages.length;
        document.getElementById('momentCount').textContent = this.moments.length;
        document.getElementById('addMomentCity').textContent = `📍 ${this.cityData.name}`;
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
    // 添加 Moment 功能
    // ==========================================
    
    setupAddMoment() {
        const addBtn = document.getElementById('addMomentBtn');
        const modal = document.getElementById('addMomentModal');
        const closeBtn = document.getElementById('closeAddMomentModal');
        const cancelBtn = document.getElementById('cancelAddMoment');
        const form = document.getElementById('addMomentForm');
        const dateInput = document.getElementById('momentDate');
        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('momentImages');
        
        // 设置默认日期为今天
        dateInput.value = new Date().toISOString().split('T')[0];
        
        addBtn?.addEventListener('click', () => {
            modal?.classList.remove('hidden');
        });
        
        closeBtn?.addEventListener('click', () => {
            modal?.classList.add('hidden');
            this.resetUploadForm();
        });
        
        cancelBtn?.addEventListener('click', () => {
            modal?.classList.add('hidden');
            this.resetUploadForm();
        });
        
        modal?.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            modal?.classList.add('hidden');
            this.resetUploadForm();
        });
        
        // 图片上传
        uploadArea?.addEventListener('click', () => {
            fileInput?.click();
        });
        
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            this.addUploadFiles(files);
        });
        
        fileInput?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.addUploadFiles(files);
        });
        
        // 表单提交
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitMoment();
        });
    }
    
    addUploadFiles(files) {
        this.uploadFiles = [...this.uploadFiles, ...files].slice(0, 9); // 最多9张
        this.renderImagePreview();
    }
    
    renderImagePreview() {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;
        
        preview.innerHTML = this.uploadFiles.map((file, i) => `
            <div class="image-preview-item" data-index="${i}">
                <img src="${URL.createObjectURL(file)}" alt="">
                <button type="button" class="remove-image">×</button>
            </div>
        `).join('');
        
        preview.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.image-preview-item').dataset.index);
                this.uploadFiles.splice(index, 1);
                this.renderImagePreview();
            });
        });
    }
    
    resetUploadForm() {
        this.uploadFiles = [];
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('momentContent').value = '';
        document.getElementById('momentDate').value = new Date().toISOString().split('T')[0];
    }
    
    async submitMoment() {
        const submitBtn = document.getElementById('submitMoment');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        const date = document.getElementById('momentDate').value;
        const content = document.getElementById('momentContent').value;
        
        if (!date) {
            alert('请选择日期');
            return;
        }
        
        // 显示加载状态
        submitBtn.disabled = true;
        btnText?.classList.add('hidden');
        btnLoading?.classList.remove('hidden');
        
        try {
            // 上传图片到 Cloudinary
            const imageUrls = [];
            
            if (this.uploadFiles.length > 0 && window.cloudinaryService) {
                for (const file of this.uploadFiles) {
                    const result = await window.cloudinaryService.upload(file, 'moments');
                    if (result?.url) {
                        imageUrls.push(result.url);
                    }
                }
            }
            
            // 保存到 Supabase
            if (window.supabaseService?.isConnected()) {
                await window.supabaseService.addMoment({
                    userName: this.currentUser,
                    content: content,
                    imageUrls: JSON.stringify(imageUrls),
                    country: this.cityData.country,
                    city: this.cityData.name,
                    date: date
                });
            }
            
            // 关闭模态框并刷新
            document.getElementById('addMomentModal')?.classList.add('hidden');
            this.resetUploadForm();
            
            // 重新加载数据
            await this.loadCityData();
            this.renderGallery();
            this.renderMoments();
            this.renderTimeline();
            
        } catch (error) {
            console.error('Failed to add moment:', error);
            alert('保存失败，请重试');
        } finally {
            submitBtn.disabled = false;
            btnText?.classList.remove('hidden');
            btnLoading?.classList.add('hidden');
        }
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
        
        yearsContainer.style.display = 'grid';
        emptyState.style.display = 'none';
        
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
        
        // 按月份分组
        const monthGroups = {};
        yearImages.forEach(img => {
            const month = new Date(img.date).getMonth() + 1;
            if (!monthGroups[month]) monthGroups[month] = [];
            monthGroups[month].push(img);
        });
        
        // 按月份降序排序
        const months = Object.keys(monthGroups).sort((a, b) => b - a);
        
        // 渲染带月份标签的网格
        grid.innerHTML = months.map(month => {
            const images = monthGroups[month];
            return `
                <div class="month-section">
                    <h3 class="month-title">${month}月 <span class="month-count">${images.length}张</span></h3>
                    <div class="month-photos">
                        ${images.map((img, i) => `
                            <div class="photo-card" data-url="${img.url}" data-month="${month}" data-index="${i}">
                                <img src="${this.getThumbnail(img.url, 300)}" alt="">
                                <div class="photo-card-overlay">
                                    <span class="photo-date">${this.formatDate(img.date)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定点击打开查看器
        grid.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => {
                const month = card.dataset.month;
                const index = parseInt(card.dataset.index);
                const monthImages = monthGroups[month];
                this.openImageViewer(monthImages, index);
            });
        });
        
        // 隐藏分页（改为月份分组后不需要分页）
        pagination.style.display = 'none';
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
        
        list.style.display = 'flex';
        emptyState.style.display = 'none';
        
        const totalPages = Math.ceil(this.moments.length / this.momentsPerPage);
        const start = (this.currentMomentsPage - 1) * this.momentsPerPage;
        const pageMoments = this.moments.slice(start, start + this.momentsPerPage);
        
        list.innerHTML = pageMoments.map(m => {
            const images = this.parseImageUrls(m.image_urls);
            const displayImages = images.slice(0, 9);
            const hasMore = images.length > 9;
            const imageCount = displayImages.length;
            
            // 根据图片数量决定布局
            let imageGridClass = '';
            let imageSize = 120; // 基础尺寸
            if (imageCount === 1) imageGridClass = 'img-1';
            else if (imageCount === 2) imageGridClass = 'img-2';
            else if (imageCount === 3) imageGridClass = 'img-3';
            else if (imageCount === 4) imageGridClass = 'img-4';
            else if (imageCount <= 6) imageGridClass = 'img-6';
            else imageGridClass = 'img-9';
            
            return `
                <div class="moment-card" data-id="${m.id}">
                    <div class="moment-card-header">
                        <span class="moment-card-user">
                            <span class="moment-card-user-avatar">${(m.user_name || 'U')[0].toUpperCase()}</span>
                            ${m.user_name || '匿名'}
                        </span>
                        <span class="moment-card-date">${this.formatDate(m.date)}</span>
                    </div>
                    <div class="moment-card-body">
                        <div class="moment-card-left">
                            <div class="moment-card-content">${m.content || ''}</div>
                            ${hasMore ? `<div class="moment-card-more">还有 ${images.length - 9} 张照片</div>` : ''}
                        </div>
                        ${displayImages.length > 0 ? `
                            <div class="moment-card-right ${imageGridClass}">
                                ${displayImages.map(url => `
                                    <img src="${this.getThumbnail(url, 200)}" alt="">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定点击打开详情
        list.querySelectorAll('.moment-card').forEach(card => {
            card.addEventListener('click', () => {
                const moment = this.moments.find(m => m.id == card.dataset.id);
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
        
        // 获取过去一年的数据
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        // 创建日期到活动的映射
        const activityMap = {};
        
        // 统计每天的活动
        this.moments.forEach(m => {
            const date = new Date(m.date);
            const dateKey = date.toISOString().split('T')[0];
            const user = m.user_name || 'wiwi';
            
            if (!activityMap[dateKey]) {
                activityMap[dateKey] = { wiwi: 0, yuyu: 0 };
            }
            activityMap[dateKey][user === 'yuyu' ? 'yuyu' : 'wiwi']++;
        });
        
        // 即使没有 moments 也显示空的贡献图
        container.parentElement.style.display = 'block';
        emptyState.style.display = 'none';
        
        // 生成贡献图 - 按列（周）组织
        const weeks = [];
        let currentDate = new Date(oneYearAgo);
        // 调整到该周的周一（而不是周日）
        const dayOfWeek = currentDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 调整到周一
        currentDate.setDate(currentDate.getDate() + diff);
        
        while (currentDate <= today) {
            const week = [];
            for (let i = 0; i < 7; i++) { // 周一(0)到周日(6)
                const dateKey = currentDate.toISOString().split('T')[0];
                const activity = activityMap[dateKey] || { wiwi: 0, yuyu: 0 };
                const total = activity.wiwi + activity.yuyu;
                week.push({
                    date: dateKey,
                    dayOfWeek: i,
                    wiwi: activity.wiwi,
                    yuyu: activity.yuyu,
                    total: total,
                    isToday: dateKey === today.toISOString().split('T')[0],
                    isFuture: currentDate > today
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(week);
        }
        
        // 月份标签位置 - 只在月初显示
        const monthLabels = [];
        let lastMonth = -1;
        weeks.forEach((week, i) => {
            // 检查这周是否包含月初
            week.forEach(day => {
                const d = new Date(day.date);
                const month = d.getMonth();
                const dayOfMonth = d.getDate();
                if (dayOfMonth <= 7 && month !== lastMonth) {
                    monthLabels.push({ 
                        weekIndex: i, 
                        name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month] 
                    });
                    lastMonth = month;
                }
            });
        });
        
        // 生成月份标签 HTML - 使用绝对定位避免重叠
        const cellSize = 14; // 格子大小
        const gap = 4; // 间隙（与 CSS 保持一致）
        let monthsHtml = monthLabels.map(m => {
            const left = m.weekIndex * (cellSize + gap);
            return `<span class="month-label" style="left: ${left}px">${m.name}</span>`;
        }).join('');
        
        container.innerHTML = `
            <div class="activity-graph">
                <div class="activity-container">
                    <div class="activity-row-labels">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                    </div>
                    <div class="activity-main">
                        <div class="activity-months">${monthsHtml}</div>
                        <div class="activity-grid">
                            ${weeks.map(week => `
                                <div class="activity-week">
                                    ${week.map(day => {
                                        if (day.isFuture) {
                                            return `<div class="activity-day future"></div>`;
                                        }
                                        const level = day.total === 0 ? 'empty' :
                                            day.total <= 2 ? 'low' :
                                            day.total <= 4 ? 'medium' : 'high';
                                        const userClass = day.wiwi > day.yuyu ? 'wiwi' : 
                                            (day.yuyu > day.wiwi ? 'yuyu' : 
                                            (day.wiwi > 0 ? 'both' : ''));
                                        return `<div class="activity-day ${level} ${userClass} ${day.isToday ? 'today' : ''}" 
                                            data-date="${day.date}" 
                                            title="${day.date}\nwiwi: ${day.wiwi}, yuyu: ${day.yuyu}"></div>`;
                                    }).join('')}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="activity-footer">
                    <div class="activity-legend">
                        <span class="legend-item"><span class="legend-box wiwi"></span>wiwi</span>
                        <span class="legend-item"><span class="legend-box yuyu"></span>yuyu</span>
                        <span class="legend-item"><span class="legend-box both"></span>both</span>
                    </div>
                    <div class="activity-scale">
                        <span>Less</span>
                        <span class="scale-box empty"></span>
                        <span class="scale-box low wiwi"></span>
                        <span class="scale-box medium wiwi"></span>
                        <span class="scale-box high wiwi"></span>
                        <span>More</span>
                    </div>
                </div>
            </div>
        `;
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
            
            if (!document.getElementById('addMomentModal').classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    document.getElementById('addMomentModal').classList.add('hidden');
                    this.resetUploadForm();
                }
            }
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.cityPage = new CityPage();
});
