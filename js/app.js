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
            this.initGlobe();
            this.initHomeControl();
            this.bindEvents();
            this.updateStats();
            this.updateCityList();
            this.updateDate();
        } catch (error) {
            console.error('App init error:', error);
        }
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
            alert(isConnected ? '☁️ 云端已连接\n\nSupabase 和 Cloudinary 服务正常' : '⚠️ 云端未连接\n\n请检查 config.js 中的配置');
        });
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('life29-theme') || 'light';
        const savedBg = localStorage.getItem('life29-bg') || 'gray';
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-bg', savedBg);
        
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
        
        // 背景颜色选择器
        document.querySelectorAll('.bg-color-btn').forEach(btn => {
            if (btn.dataset.bg === savedBg) btn.classList.add('active');
            btn.addEventListener('click', () => {
                document.querySelectorAll('.bg-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const bg = btn.dataset.bg;
                document.documentElement.setAttribute('data-bg', bg);
                localStorage.setItem('life29-bg', bg);
            });
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
        
        const userBtn = document.getElementById('userBtn');
        const userStatus = document.getElementById('userStatus');
        
        userBtn?.classList.remove('user-wiwi', 'user-yuyu');
        
        if (userStatus) {
            userStatus.textContent = '未登录';
            userStatus.classList.remove('logged-in', 'user-wiwi', 'user-yuyu');
        }
        
        document.getElementById('addMomentBtn')?.classList.add('hidden');
        document.querySelectorAll('.dropdown-item[data-user]').forEach(item => item.classList.remove('active'));
    }
    
    initGlobe() {
        const container = document.getElementById('globeContainer');
        if (!container) return;
        
        // 使用Globe类（在globe.js中定义）
        this.globe = new Globe(container, this.dataManager.cities);
        
        this.globe.onCityHover = (city, event) => this.showCityPreview(city, event);
        this.globe.onCityClick = (city) => { window.location.href = `city.html?id=${city.id}`; };
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
        
        // Moment 相关
        this.initMomentModal();
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('addMomentModal')?.classList.add('hidden');
                cityListPanel?.classList.remove('open');
            }
        });
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
    
    submitMoment() {
        const content = document.getElementById('momentContent').value;
        const { country, city, date } = this.momentData;
        
        // 获取坐标
        const coords = this.globe.getCityCoordinates(country, city);
        if (!coords) {
            alert('无法找到该城市的坐标');
            return;
        }
        
        // 查找或创建城市
        let existingCity = this.dataManager.cities.find(c => c.name === city && c.country === country);
        
        if (!existingCity) {
            // 创建新城市
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
        
        // 添加照片
        this.uploadedPhotos.forEach(photoData => {
            this.dataManager.addPhoto(existingCity.id, {
                url: photoData,
                caption: ''
            });
        });
        
        // 添加日志
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
        const stats = this.dataManager.getStats();
        this.animateNumber('totalCities', stats.cities);
        this.animateNumber('totalPhotos', stats.photos);
        this.animateNumber('totalJournals', stats.journals);
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
