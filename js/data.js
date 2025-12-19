/**
 * Life29 - 数据管理模块
 */

class DataManager {
    constructor() {
        this.cities = [];
        this.loaded = false;
        this.localStorageKey = 'life29_cities';
    }
    
    async load() {
        if (this.loaded) return this.cities;
        
        try {
            const response = await fetch(CONFIG.storage.citiesFile);
            if (response.ok) {
                this.cities = await response.json();
                this.loaded = true;
                this.saveToLocal();
                return this.cities;
            }
        } catch (e) {
            console.log('Loading from localStorage...');
        }
        
        const localData = localStorage.getItem(this.localStorageKey);
        if (localData) {
            try {
                this.cities = JSON.parse(localData);
                this.loaded = true;
                return this.cities;
            } catch (e) {
                console.error('Local parse error');
            }
        }
        
        this.cities = this.getDefaultCities();
        this.loaded = true;
        this.saveToLocal();
        return this.cities;
    }
    
    saveToLocal() {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.cities));
    }
    
    getCities() { return this.cities; }
    
    getCity(id) { return this.cities.find(c => c.id === id); }
    
    getCityBySlug(slug) { return this.cities.find(c => c.slug === slug); }
    
    getCitiesWithContent() {
        return this.cities
            .filter(c => (c.photos && c.photos.length > 0) || (c.journals && c.journals.length > 0))
            .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    }
    
    addCity(city) {
        city.id = 'city_' + Date.now();
        city.slug = this.generateSlug(city.nameEn);
        city.createdAt = new Date().toISOString();
        city.photos = city.photos || [];
        city.journals = city.journals || [];
        
        this.cities.push(city);
        this.saveToLocal();
        return city;
    }
    
    updateCity(id, updates) {
        const index = this.cities.findIndex(c => c.id === id);
        if (index !== -1) {
            this.cities[index] = { ...this.cities[index], ...updates };
            this.saveToLocal();
            return this.cities[index];
        }
        return null;
    }
    
    deleteCity(id) {
        const index = this.cities.findIndex(c => c.id === id);
        if (index !== -1) {
            this.cities.splice(index, 1);
            this.saveToLocal();
            return true;
        }
        return false;
    }
    
    addPhoto(cityId, photo) {
        const city = this.getCity(cityId);
        if (city) {
            photo.id = 'photo_' + Date.now();
            photo.uploadedAt = new Date().toISOString();
            if (!city.photos) city.photos = [];
            city.photos.push(photo);
            this.saveToLocal();
            return photo;
        }
        return null;
    }
    
    addJournal(cityId, journal) {
        const city = this.getCity(cityId);
        if (city) {
            journal.id = 'journal_' + Date.now();
            journal.createdAt = new Date().toISOString();
            if (!city.journals) city.journals = [];
            city.journals.push(journal);
            this.saveToLocal();
            return journal;
        }
        return null;
    }
    
    getStats() {
        const citiesWithContent = this.cities.filter(c => 
            (c.photos && c.photos.length > 0) || (c.journals && c.journals.length > 0)
        );
        const totalPhotos = this.cities.reduce((sum, c) => sum + (c.photos ? c.photos.length : 0), 0);
        const totalJournals = this.cities.reduce((sum, c) => sum + (c.journals ? c.journals.length : 0), 0);
        
        return { cities: citiesWithContent.length, photos: totalPhotos, journals: totalJournals };
    }
    
    generateSlug(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    
    exportJSON() { return JSON.stringify(this.cities, null, 2); }
    
    getDefaultCities() {
        return [
            {
                id: 'city_1',
                name: '旧金山',
                nameEn: 'San Francisco',
                slug: 'san-francisco',
                country: '美国',
                lat: 37.7749,
                lng: -122.4194,
                color: '#E8B4B8',
                visitDate: '2024-06-15',
                photos: [{ id: 'photo_1', url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', caption: '金门大桥的日落', uploadedAt: '2024-06-15T18:30:00.000Z' }],
                journals: [{ id: 'journal_1', title: '旧金山初印象', content: '第一次来到旧金山，被这座城市独特的魅力所吸引...', date: '2024-06-15', createdAt: '2024-06-15T22:00:00.000Z' }]
            },
            {
                id: 'city_2',
                name: '南京',
                nameEn: 'Nanjing',
                slug: 'nanjing',
                country: '中国',
                lat: 32.0603,
                lng: 118.7969,
                color: '#A8D5E5',
                visitDate: '2024-03-20',
                photos: [{ id: 'photo_2', url: 'https://images.unsplash.com/photo-1589650600407-979c3c1d9d24?w=800', caption: '玄武湖畔', uploadedAt: '2024-03-20T10:00:00.000Z' }],
                journals: [{ id: 'journal_2', title: '春日南京', content: '三月的南京，樱花盛开...', date: '2024-03-20', createdAt: '2024-03-20T20:00:00.000Z' }]
            },
            {
                id: 'city_3',
                name: '东京',
                nameEn: 'Tokyo',
                slug: 'tokyo',
                country: '日本',
                lat: 35.6762,
                lng: 139.6503,
                color: '#B8D4A8',
                visitDate: null,
                photos: [],
                journals: []
            },
            {
                id: 'city_4',
                name: '巴黎',
                nameEn: 'Paris',
                slug: 'paris',
                country: '法国',
                lat: 48.8566,
                lng: 2.3522,
                color: '#C8B8E5',
                visitDate: null,
                photos: [],
                journals: []
            }
        ];
    }
}

window.dataManager = new DataManager();