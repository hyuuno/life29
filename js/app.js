/**
 * Life29 - 主应用
 */

class App {
    constructor() {
        this.globe = null;
        this.dataManager = window.dataManager;
        this.currentUser = null;
        this.homeCity = null;
        this.momentData = {};
        this.uploadedPhotos = [];
        this.cloudAlbumCities = new Set(); // Cities with cloud albums
        
        // 中国城市列表
        this.chinaCities = ['北京', '上海', '天津', '重庆', '香港', '澳门', '广州', '深圳', '杭州', '南京', '苏州', '成都', '武汉', '西安', '长沙', '郑州', '青岛', '大连', '厦门', '福州', '济南', '沈阳', '哈尔滨', '长春', '南昌', '合肥', '昆明', '贵阳', '南宁', '海口', '三亚', '拉萨', '乌鲁木齐', '兰州', '银川', '西宁', '呼和浩特', '石家庄', '太原', '无锡', '宁波', '温州', '珠海', '东莞'];
        
        // 美国城市列表
        this.usCities = ['San Francisco', 'Los Angeles', 'New York', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Seattle', 'Denver', 'Boston', 'Las Vegas', 'Portland', 'Miami', 'Atlanta', 'Washington DC'];
        
        this.init();
    }
    
    async init() {
        try {
            await this.dataManager.load();
            this.initTheme();
            this.initUser();
            await this.initCloud();
            await this.loadCloudAlbumCities(); // 加载有云相册的城市
            this.initGlobe();
            await this.loadCloudMoments(); // 加载云端 moments 并更新标记
            this.initHomeControl();
            this.bindEvents();
            this.updateStats();
            this.updateCityList();
            this.updateDate();
        } catch (error) {
            console.error('App init error:', error);
        }
    }
    
    async loadCloudAlbumCities() {
        try {
            const response = await fetch('data/cloud-albums.json');
            if (!response.ok) return;
            const data = await response.json();
            
            // Build a set of cities that have cloud albums
            (data.albums || []).forEach(album => {
                if (album.city) this.cloudAlbumCities.add(album.city);
                if (album.cityEn) this.cloudAlbumCities.add(album.cityEn);
            });
            
            console.log(`✅ Loaded cloud album cities:`, [...this.cloudAlbumCities]);
        } catch (e) {
            console.log('No cloud albums data found');
        }
    }
    
    async loadCloudMoments() {
        if (!window.supabaseService?.isConnected()) return;
        
        try {
            const moments = await window.supabaseService.getMoments();
            if (!moments || moments.length === 0) return;
            
            // 按城市分组 moments
            const cityMoments = {};
            moments.forEach(m => {
                const key = `${m.city}-${m.country}`;
                if (!cityMoments[key]) {
                    cityMoments[key] = {
                        city: m.city,
                        country: m.country,
                        photos: [],
                        journals: []
                    };
                }
                
                // 添加照片
                const urls = this.parseImageUrls(m.image_urls);
                urls.forEach(url => {
                    cityMoments[key].photos.push({
                        url,
                        date: m.date,
                        caption: m.content
                    });
                });
                
                // 添加日志
                if (m.content) {
                    cityMoments[key].journals.push({
                        title: `${m.city}的记忆`,
                        content: m.content,
                        date: m.date
                    });
                }
            });
            
            // 更新 dataManager 中的城市数据
            Object.values(cityMoments).forEach(cm => {
                // 查找匹配的城市
                let existingCity = this.dataManager.cities.find(c => 
                    c.name === cm.city || c.nameEn === cm.city
                );
                
                if (existingCity) {
                    // 更新现有城市
                    existingCity.photos = [...(existingCity.photos || []), ...cm.photos];
                    existingCity.journals = [...(existingCity.journals || []), ...cm.journals];
                } else {
                    // 创建新城市（需要坐标）
                    const coords = this.getCityCoords(cm.city, cm.country);
                    if (coords) {
                        const newCity = {
                            id: `cloud_${cm.city}`,
                            name: cm.city,
                            nameEn: cm.city,
                            country: cm.country,
                            lat: coords[0],
                            lng: coords[1],
                            color: this.getRandomCityColor(),
                            photos: cm.photos,
                            journals: cm.journals
                        };
                        this.dataManager.cities.push(newCity);
                    }
                }
            });
            
            // 更新地球标记
            this.globe?.updateCities(this.dataManager.cities);
            
        } catch (error) {
            console.error('Failed to load cloud moments:', error);
        }
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
    
    getCityCoords(cityName, country) {
        // 中国城市
        const chinaCities = {
            '北京': [39.9, 116.4], '上海': [31.2, 121.5], '天津': [39.1, 117.2],
            '重庆': [29.6, 106.5], '香港': [22.3, 114.2], '澳门': [22.2, 113.5],
            '台北': [25.0, 121.5], '广州': [23.1, 113.3], '深圳': [22.5, 114.1],
            '杭州': [30.3, 120.2], '南京': [32.1, 118.8], '苏州': [31.3, 120.6],
            '成都': [30.7, 104.1], '武汉': [30.6, 114.3], '西安': [34.3, 108.9],
            '长沙': [28.2, 113.0], '郑州': [34.8, 113.7], '青岛': [36.1, 120.4],
            '大连': [38.9, 121.6], '厦门': [24.5, 118.1], '福州': [26.1, 119.3]
        };
        
        // 美国城市
        const usCities = {
            'San Francisco': [37.8, -122.4], 'Los Angeles': [34.1, -118.2],
            'New York': [40.7, -74.0], 'Chicago': [41.9, -87.6],
            'Las Vegas': [36.2, -115.1], 'Seattle': [47.6, -122.3]
        };
        
        if (chinaCities[cityName]) return chinaCities[cityName];
        if (usCities[cityName]) return usCities[cityName];
        
        return null;
    }
    
    getRandomCityColor() {
        const colors = ['#E8B4B8', '#A8D5E5', '#B8D4A8', '#D4A8D5', '#E5C8A8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    async initCloud() {
        const statusEl = document.getElementById('cloudStatus');
        if (!statusEl) return;
        
        if (window.supabaseService) {
            const connected = await window.supabaseService.init();
            if (connected) {
                statusEl.classList.remove('disconnected');
                statusEl.classList.add('connected');
                statusEl.title = '云端已连接';
            } else {
                statusEl.title = '云端未连接 - 请检查配置';
            }
        }
        
        // 点击显示状态
        statusEl.addEventListener('click', () => {
            const isConnected = statusEl.classList.contains('connected');
            if (window.showGlobalToast) {
                if (isConnected) {
                    window.showGlobalToast('云端已连接', 'Supabase 和 Cloudinary 服务正常', 'success');
                } else {
                    window.showGlobalToast('云端未连接', '请检查 config.js 中的配置', 'error');
                }
            }
        });
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('life29-theme') || 'light';
        const savedBg = localStorage.getItem('life29-bg') || 'gray';
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-bg', savedBg);
        
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
        
        // 背景颜色选择器下拉菜单
        const colorPickerBtn = document.getElementById('colorPickerBtn');
        const colorPickerMenu = document.getElementById('colorPickerMenu');
        
        // 设置初始激活状态
        document.querySelectorAll('.color-swatch-btn').forEach(btn => {
            if (btn.dataset.bg === savedBg) btn.classList.add('active');
        });
        
        colorPickerBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            colorPickerMenu?.classList.toggle('show');
        });
        
        document.querySelectorAll('.color-swatch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const bg = btn.dataset.bg;
                document.documentElement.setAttribute('data-bg', bg);
                localStorage.setItem('life29-bg', bg);
                colorPickerMenu?.classList.remove('show');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.color-picker-dropdown')) {
                colorPickerMenu?.classList.remove('show');
            }
        });
    }
    
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('life29-theme', newTheme);
        this.globe?.updateTheme();
    }
    
    initUser() {
        const savedUser = localStorage.getItem('life29-user');
        if (savedUser) this.setUser(savedUser, false);
        
        const userBtn = document.getElementById('userBtn');
        const userMenu = document.getElementById('userMenu');
        
        userBtn?.addEventListener('click', (e) => { e.stopPropagation(); userMenu?.classList.toggle('show'); });
        document.addEventListener('click', () => userMenu?.classList.remove('show'));
        
        document.querySelectorAll('.dropdown-item[data-user]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setUser(item.dataset.user);
                userMenu?.classList.remove('show');
            });
        });
        
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.logout();
            userMenu?.classList.remove('show');
        });
    }
    
    setUser(username, save = true) {
        this.currentUser = username;
        if (save) localStorage.setItem('life29-user', username);
        
        const userBtn = document.getElementById('userBtn');
        const userStatus = document.getElementById('userStatus');
        
        userBtn?.classList.remove('user-wiwi', 'user-yuyu');
        userBtn?.classList.add(`user-${username}`);
        
        if (userStatus) {
            userStatus.textContent = username;
            userStatus.classList.add('logged-in');
            userStatus.classList.remove('user-wiwi', 'user-yuyu');
            userStatus.classList.add(`user-${username}`);
        }
        
        document.getElementById('addMomentBtn')?.classList.remove('hidden');
        
        document.querySelectorAll('.dropdown-item[data-user]').forEach(item => {
            item.classList.toggle('active', item.dataset.user === username);
        });
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('life29-user');
        
        // 清除登录session并跳转到登录页
        sessionStorage.removeItem('life29_logged_in');
        sessionStorage.removeItem('life29_user');
        sessionStorage.removeItem('life29_login_time');
        window.location.href = 'login.html';
    }
    
    initGlobe() {
        const container = document.getElementById('globeContainer');
        if (!container) return;
        
        // 使用Globe类（在globe.js中定义）
        this.globe = new Globe(container, this.dataManager.cities);
        
        this.globe.onCityHover = (city, event) => this.showCityPreview(city, event);
        this.globe.onCityClick = (city) => { 
            // 使用城市名称和国家作为参数
            const params = new URLSearchParams({
                city: city.name,
                country: city.country || ''
            });
            window.location.href = `city.html?${params.toString()}`; 
        };
    }
    
    initHomeControl() {
        const homeCityOptions = document.getElementById('homeCityOptions');
        const globeDropdown = document.getElementById('globeDropdown');
        const globeNavBtn = document.getElementById('globeNavBtn');
        
        if (!homeCityOptions) return;
        
        globeNavBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            globeDropdown?.classList.toggle('open');
        });
        
        document.addEventListener('click', () => globeDropdown?.classList.remove('open'));
        
        // 只显示旧金山和上海作为归位城市
        const homeCities = this.dataManager.cities.filter(c => 
            c.nameEn === 'San Francisco' || c.nameEn === 'Shanghai'
        );
        
        homeCityOptions.innerHTML = '';
        homeCities.forEach(city => {
            const btn = document.createElement('button');
            btn.className = 'city-option';
            btn.innerHTML = `<span class="city-option-dot" style="background-color: ${city.color}"></span><span>${city.name}</span>`;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.setHomeCity(city);
                globeDropdown?.classList.remove('open');
            });
            homeCityOptions.appendChild(btn);
        });
        
        // 默认归位到旧金山
        const savedHomeCity = localStorage.getItem('life29-home-city');
        let defaultCity = homeCities.find(c => c.id === savedHomeCity) || homeCities.find(c => c.nameEn === 'San Francisco');
        if (defaultCity) this.setHomeCity(defaultCity, false);
    }
    
    setHomeCity(city, save = true) {
        this.homeCity = city;
        if (save) localStorage.setItem('life29-home-city', city.id);
        
        document.querySelectorAll('.city-option').forEach(opt => {
            opt.classList.toggle('active', opt.textContent.trim().includes(city.name));
        });
        
        this.globe?.setHomeCity(city);
    }
    
    bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        const cityListPanel = document.getElementById('cityListPanel');
        const closeCityList = document.getElementById('closeCityList');
        
        searchBtn?.addEventListener('click', () => cityListPanel?.classList.add('open'));
        closeCityList?.addEventListener('click', () => cityListPanel?.classList.remove('open'));
        document.getElementById('citySearch')?.addEventListener('input', (e) => this.filterCityList(e.target.value));
        
        // 地图级别控制
        this.initMapLevelControl();
        
        // Moment 相关
        this.initMomentModal();
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('addMomentModal')?.classList.add('hidden');
                cityListPanel?.classList.remove('open');
            }
        });
    }
    
    initMapLevelControl() {
        const mapLevelBtn = document.getElementById('mapLevelBtn');
        const mapLevelMenu = document.getElementById('mapLevelMenu');
        
        mapLevelBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            mapLevelMenu?.classList.toggle('show');
        });
        
        document.addEventListener('click', () => mapLevelMenu?.classList.remove('show'));
        
        mapLevelMenu?.querySelectorAll('.dropdown-item[data-level]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const level = item.dataset.level;
                
                // 更新UI
                mapLevelMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                mapLevelMenu.classList.remove('show');
                
                // 更新地球显示级别
                this.setMapLevel(level);
                
                // 保存设置
                localStorage.setItem('life29-map-level', level);
                
                // 显示提示
                const levelNames = {
                    'country': '国家轮廓',
                    'province': '省份/州',
                    'none': '仅标记点'
                };
                if (window.showGlobalToast) {
                    window.showGlobalToast('地图详细度', `已切换到「${levelNames[level]}」`, 'info', 2000);
                }
            });
        });
        
        // 恢复保存的设置
        const savedLevel = localStorage.getItem('life29-map-level') || 'country';
        mapLevelMenu?.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.toggle('active', item.dataset.level === savedLevel);
        });
        this.setMapLevel(savedLevel);
    }
    
    setMapLevel(level) {
        if (this.globe) {
            this.globe.setDetailLevel(level);
        }
    }
    
    initMomentModal() {
        const addMomentBtn = document.getElementById('addMomentBtn');
        const modal = document.getElementById('addMomentModal');
        const closeBtn = document.getElementById('closeMomentModal');
        const countrySelect = document.getElementById('momentCountry');
        const citySelect = document.getElementById('momentCity');
        const locationForm = document.getElementById('momentLocationForm');
        const contentForm = document.getElementById('momentContentForm');
        const backBtn = document.getElementById('backToStep1');
        const addPhotoBtn = document.getElementById('addPhotoBtn');
        const photoInput = document.getElementById('photoFileInput');
        
        addMomentBtn?.addEventListener('click', () => {
            if (this.currentUser) {
                this.resetMomentModal();
                modal?.classList.remove('hidden');
            }
        });
        
        closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));
        modal?.querySelector('.modal-backdrop')?.addEventListener('click', () => modal?.classList.add('hidden'));
        
        // 国家选择变化
        countrySelect?.addEventListener('change', (e) => {
            const country = e.target.value;
            citySelect.disabled = !country;
            citySelect.innerHTML = '<option value="">选择城市...</option>';
            
            if (country === '中国') {
                this.chinaCities.forEach(city => {
                    citySelect.innerHTML += `<option value="${city}">${city}</option>`;
                });
            } else if (country === '美国') {
                this.usCities.forEach(city => {
                    citySelect.innerHTML += `<option value="${city}">${city}</option>`;
                });
            }
        });
        
        // Step 1 提交
        locationForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const country = countrySelect.value;
            const city = citySelect.value;
            const date = document.getElementById('momentDate').value;
            
            this.momentData = { country, city, date };
            
            document.getElementById('momentCityTitle').textContent = `在${city}的这一刻`;
            document.getElementById('momentStep1').style.display = 'none';
            document.getElementById('momentStep2').style.display = 'block';
        });
        
        // 返回 Step 1
        backBtn?.addEventListener('click', () => {
            document.getElementById('momentStep1').style.display = 'block';
            document.getElementById('momentStep2').style.display = 'none';
        });
        
        // 添加照片
        addPhotoBtn?.addEventListener('click', () => photoInput?.click());
        
        photoInput?.addEventListener('change', (e) => {
            const files = e.target.files;
            for (let file of files) {
                if (this.uploadedPhotos.length >= 9) break;
                this.addPhotoPreview(file);
            }
        });
        
        // Step 2 提交
        contentForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitMoment();
        });
    }
    
    addPhotoPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoData = e.target.result;
            this.uploadedPhotos.push(photoData);
            
            const area = document.getElementById('photoUploadArea');
            const addBtn = document.getElementById('addPhotoBtn');
            
            const preview = document.createElement('div');
            preview.className = 'photo-preview';
            preview.innerHTML = `
                <img src="${photoData}" alt="">
                <button type="button" class="remove-btn" data-index="${this.uploadedPhotos.length - 1}">×</button>
            `;
            
            preview.querySelector('.remove-btn').addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.uploadedPhotos.splice(index, 1);
                preview.remove();
                this.updatePhotoIndices();
            });
            
            area.insertBefore(preview, addBtn);
            
            if (this.uploadedPhotos.length >= 9) {
                addBtn.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
    
    updatePhotoIndices() {
        document.querySelectorAll('.photo-preview .remove-btn').forEach((btn, index) => {
            btn.dataset.index = index;
        });
    }
    
    resetMomentModal() {
        document.getElementById('momentStep1').style.display = 'block';
        document.getElementById('momentStep2').style.display = 'none';
        document.getElementById('momentLocationForm').reset();
        document.getElementById('momentContentForm').reset();
        document.getElementById('momentCity').disabled = true;
        document.getElementById('momentCity').innerHTML = '<option value="">先选择国家...</option>';
        
        // 清除照片预览
        this.uploadedPhotos = [];
        const area = document.getElementById('photoUploadArea');
        area.querySelectorAll('.photo-preview').forEach(p => p.remove());
        document.getElementById('addPhotoBtn').style.display = 'flex';
        
        // 设置默认日期为今天
        document.getElementById('momentDate').value = new Date().toISOString().split('T')[0];
    }
    
    async submitMoment() {
        const content = document.getElementById('momentContent').value;
        const { country, city, date } = this.momentData;
        
        // 获取坐标
        const coords = this.globe.getCityCoordinates(country, city);
        if (!coords) {
            alert('无法找到该城市的坐标');
            return;
        }
        
        const submitBtn = document.querySelector('#momentContentForm .btn-primary');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '发布中...';
        }
        
        try {
            // 上传照片到 Cloudinary（如果有）
            let imageUrls = [];
            if (this.uploadedPhotos.length > 0 && window.cloudinaryService) {
                submitBtn.textContent = '上传图片...';
                for (let i = 0; i < this.uploadedPhotos.length; i++) {
                    // 将 base64 转为 File
                    const base64 = this.uploadedPhotos[i];
                    const response = await fetch(base64);
                    const blob = await response.blob();
                    const file = new File([blob], `moment_${Date.now()}_${i}.jpg`, { type: 'image/jpeg' });
                    
                    const result = await window.cloudinaryService.uploadMomentImage(file);
                    imageUrls.push(result.url);
                }
            }
            
            // 保存到 Supabase
            if (window.supabaseService?.isConnected()) {
                submitBtn.textContent = '保存数据...';
                await window.supabaseService.addMoment({
                    userName: this.currentUser,
                    content: content,
                    imageUrls: JSON.stringify(imageUrls),
                    country: country,
                    city: city,
                    date: date
                });
            }
            
            // 查找或创建城市（本地）
            let existingCity = this.dataManager.cities.find(c => c.name === city && c.country === country);
            
            if (!existingCity) {
                const colors = ['#E8B4B8', '#A8D5E5', '#B8D4A8', '#C8B8E5', '#E5C8B8', '#D5E5D8'];
                existingCity = this.dataManager.addCity({
                    name: city,
                    nameEn: city,
                    country: country,
                    lat: coords.lat,
                    lng: coords.lng,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    visitDate: date
                });
            }
            
            // 添加照片（本地）
            const photoUrls = imageUrls.length > 0 ? imageUrls : this.uploadedPhotos;
            photoUrls.forEach(photoUrl => {
                this.dataManager.addPhoto(existingCity.id, {
                    url: photoUrl,
                    caption: ''
                });
            });
            
            // 添加日志（本地）
            if (content.trim()) {
                this.dataManager.addJournal(existingCity.id, {
                    title: `${city}的记忆`,
                    content: content,
                    date: date
                });
            }
            
            // 更新UI
            this.globe?.updateCities(this.dataManager.cities);
            this.updateStats();
            this.updateCityList();
            this.initHomeControl();
            
            // 聚焦到新城市
            this.globe?.focusOnCity(existingCity);
            
            // 关闭模态框
            document.getElementById('addMomentModal')?.classList.add('hidden');
            
        } catch (e) {
            console.error('Submit moment failed:', e);
            alert('发布失败: ' + e.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }
    
    showCityPreview(city, event) {
        const preview = document.getElementById('cityPreview');
        if (!preview) return;
        
        if (!city) {
            preview.classList.add('hidden');
            return;
        }
        
        preview.querySelector('.preview-city').textContent = city.name;
        preview.querySelector('.preview-country').textContent = city.country;
        preview.querySelector('.preview-photos .count').textContent = city.photos?.length || 0;
        preview.querySelector('.preview-journals .count').textContent = city.journals?.length || 0;
        
        if (event) {
            preview.style.left = `${event.clientX + 20}px`;
            preview.style.top = `${event.clientY - 20}px`;
        }
        
        preview.classList.remove('hidden');
    }
    
    updateStats() {
        // 初始化排行榜
        this.currentRankingSort = 'journals';
        this.renderCityRanking();
        
        // 绑定排行榜切换事件
        document.querySelectorAll('.ranking-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentRankingSort = tab.dataset.sort;
                this.renderCityRanking();
            });
        });
    }
    
    renderCityRanking() {
        const container = document.getElementById('cityRanking');
        if (!container) return;
        
        // 获取有内容的城市并排序
        const citiesWithContent = this.dataManager.cities
            .filter(city => (city.photos?.length > 0) || (city.journals?.length > 0))
            .map(city => ({
                ...city,
                photoCount: city.photos?.length || 0,
                journalCount: city.journals?.length || 0,
                hasCloudAlbum: this.cloudAlbumCities.has(city.name) || this.cloudAlbumCities.has(city.nameEn)
            }))
            .sort((a, b) => {
                if (this.currentRankingSort === 'photos') {
                    return b.photoCount - a.photoCount;
                }
                return b.journalCount - a.journalCount;
            });
        
        if (citiesWithContent.length === 0) {
            container.innerHTML = `
                <div class="ranking-empty" style="padding: var(--space-xl) 0; color: var(--color-text-muted); font-size: 0.8rem;">
                    暂无足迹
                </div>
            `;
            return;
        }
        
        container.innerHTML = citiesWithContent.map((city) => {
            const count = this.currentRankingSort === 'photos' ? city.photoCount : city.journalCount;
            const cloudIcon = city.hasCloudAlbum ? `
                <span class="cloud-album-badge" title="已绑定云相册">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                    </svg>
                </span>
            ` : '';
            
            return `
                <div class="ranking-item" data-id="${city.id}">
                    <div class="ranking-info">
                        <span class="ranking-country">${city.country}</span>
                        <span class="ranking-city">${city.name}${cloudIcon}</span>
                    </div>
                    <div class="ranking-count">${count}</div>
                </div>
            `;
        }).join('');
        
        // 绑定点击事件
        container.querySelectorAll('.ranking-item').forEach(item => {
            item.addEventListener('click', () => {
                const city = this.dataManager.getCity(item.dataset.id);
                if (city) {
                    // 使用城市名称和国家作为参数
                    const params = new URLSearchParams({
                        city: city.name,
                        country: city.country || ''
                    });
                    window.location.href = `city.html?${params.toString()}`;
                }
            });
        });
    }
    
    animateNumber(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const current = parseInt(element.textContent) || 0;
        const steps = 20;
        const increment = (target - current) / steps;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            element.textContent = Math.round(current + increment * step);
            if (step >= steps) { element.textContent = target; clearInterval(timer); }
        }, 40);
    }
    
    updateCityList() {
        const cityList = document.getElementById('cityList');
        if (!cityList) return;
        
        cityList.innerHTML = this.dataManager.cities.map(city => {
            const hasContent = (city.photos?.length > 0) || (city.journals?.length > 0);
            return `
                <div class="city-item" data-id="${city.id}">
                    <span class="city-dot" style="background-color: ${hasContent ? city.color : 'var(--color-empty)'}"></span>
                    <div class="city-item-info">
                        <div class="city-item-name">${city.name}</div>
                        <div class="city-item-country">${city.country}</div>
                    </div>
                    <div class="city-item-count">${city.photos?.length || 0} 照片<br>${city.journals?.length || 0} 日志</div>
                </div>
            `;
        }).join('');
        
        cityList.querySelectorAll('.city-item').forEach(item => {
            item.addEventListener('click', () => {
                const city = this.dataManager.getCity(item.dataset.id);
                if (city) {
                    this.globe?.focusOnCity(city);
                    document.getElementById('cityListPanel')?.classList.remove('open');
                }
            });
        });
    }
    
    filterCityList(query) {
        const lowerQuery = query.toLowerCase();
        document.querySelectorAll('.city-item').forEach(item => {
            const city = this.dataManager.getCity(item.dataset.id);
            if (!city) return;
            const match = city.name.toLowerCase().includes(lowerQuery) || 
                         city.nameEn.toLowerCase().includes(lowerQuery) || 
                         city.country.toLowerCase().includes(lowerQuery);
            item.style.display = match ? 'flex' : 'none';
        });
    }
    
    updateDate() {
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });