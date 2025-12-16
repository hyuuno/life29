/**
 * Life29 - 主应用
 */

class App {
    constructor() {
        this.globe = null;
        this.dataManager = window.dataManager;
        this.currentUser = null;
        this.homeCity = null;
        this.init();
    }
    
    async init() {
        try {
            await this.dataManager.load();
            this.initTheme();
            this.initUser();
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
    
    initTheme() {
        const savedTheme = localStorage.getItem('life29-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
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
        
        userBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu?.classList.toggle('show');
        });
        
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
        const addCityBtn = document.getElementById('addCityBtn');
        
        userBtn?.classList.add('logged-in');
        userBtn?.classList.remove('user-wiwi', 'user-yuyu');
        userBtn?.classList.add(`user-${username}`);
        
        if (userStatus) {
            userStatus.textContent = username;
            userStatus.classList.add('logged-in');
            userStatus.classList.remove('user-wiwi', 'user-yuyu');
            userStatus.classList.add(`user-${username}`);
        }
        
        addCityBtn?.classList.remove('hidden');
        
        document.querySelectorAll('.dropdown-item[data-user]').forEach(item => {
            item.classList.toggle('active', item.dataset.user === username);
        });
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('life29-user');
        
        const userBtn = document.getElementById('userBtn');
        const userStatus = document.getElementById('userStatus');
        
        userBtn?.classList.remove('logged-in', 'user-wiwi', 'user-yuyu');
        
        if (userStatus) {
            userStatus.textContent = '未登录';
            userStatus.classList.remove('logged-in', 'user-wiwi', 'user-yuyu');
        }
        
        document.getElementById('addCityBtn')?.classList.add('hidden');
        document.querySelectorAll('.dropdown-item[data-user]').forEach(item => item.classList.remove('active'));
    }
    
    initGlobe() {
        const container = document.getElementById('globeContainer');
        if (!container) return;
        
        this.globe = new Globe(container, this.dataManager.cities);
        this.globe.updateCities(this.dataManager.cities);
        
        this.globe.onCityHover = (city, event) => this.showCityPreview(city, event);
        this.globe.onCityClick = (city) => { window.location.href = `city.html?id=${city.id}`; };
    }
    
    initHomeControl() {
        const homeCityOptions = document.getElementById('homeCityOptions');
        const globeDropdown = document.getElementById('globeDropdown');
        const globeNavBtn = document.getElementById('globeNavBtn');
        
        if (!homeCityOptions) return;
        
        // 下拉菜单切换
        globeNavBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            globeDropdown?.classList.toggle('open');
        });
        
        document.addEventListener('click', () => {
            globeDropdown?.classList.remove('open');
        });
        
        // 获取有记录的城市（按英文名字母排序）
        const citiesWithContent = this.dataManager.getCitiesWithContent();
        
        homeCityOptions.innerHTML = '';
        citiesWithContent.forEach(city => {
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
        
        // 恢复归位城市
        const savedHomeCity = localStorage.getItem('life29-home-city');
        if (savedHomeCity) {
            const city = this.dataManager.getCity(savedHomeCity);
            if (city) this.setHomeCity(city, false);
        } else if (citiesWithContent.length > 0) {
            this.setHomeCity(citiesWithContent[0], false);
        }
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
        
        const addCityBtn = document.getElementById('addCityBtn');
        const addCityModal = document.getElementById('addCityModal');
        const closeAddCity = document.getElementById('closeAddCity');
        
        addCityBtn?.addEventListener('click', () => {
            if (this.currentUser) addCityModal?.classList.remove('hidden');
        });
        
        closeAddCity?.addEventListener('click', () => addCityModal?.classList.add('hidden'));
        addCityModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => addCityModal?.classList.add('hidden'));
        
        document.getElementById('addCityForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddCity(e);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                addCityModal?.classList.add('hidden');
                cityListPanel?.classList.remove('open');
            }
        });
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
            if (step >= steps) {
                element.textContent = target;
                clearInterval(timer);
            }
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
    
    handleAddCity(e) {
        const formData = new FormData(e.target);
        const newCity = {
            name: formData.get('cityName'),
            nameEn: formData.get('cityNameEn'),
            country: formData.get('countryName'),
            lat: parseFloat(formData.get('cityLat')),
            lng: parseFloat(formData.get('cityLng')),
            color: formData.get('cityColor'),
            visitDate: formData.get('visitDate') || null
        };
        
        this.dataManager.addCity(newCity);
        this.globe?.updateCities(this.dataManager.cities);
        this.updateStats();
        this.updateCityList();
        this.initHomeControl();
        
        document.getElementById('addCityModal')?.classList.add('hidden');
        e.target.reset();
        this.globe?.focusOnCity(newCity);
    }
    
    updateDate() {
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
