/**
 * Life29 - 城市详情页
 */

class CityPage {
    constructor() {
        this.city = null;
        this.currentPhotoIndex = 0;
        this.init();
    }
    
    async init() {
        const params = new URLSearchParams(window.location.search);
        const cityId = params.get('id');
        if (!cityId) { window.location.href = 'index.html'; return; }
        
        this.initTheme();
        this.initUser();
        
        await dataManager.load();
        this.city = dataManager.getCity(cityId);
        if (!this.city) { window.location.href = 'index.html'; return; }
        
        this.render();
        this.bindEvents();
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('life29-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('life29-theme', newTheme);
        });
    }
    
    initUser() {
        const savedUser = localStorage.getItem('life29-user');
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
        
        if (savedUser) this.setUser(savedUser, false);
    }
    
    setUser(username, save = true) {
        if (save) localStorage.setItem('life29-user', username);
        const userBtn = document.getElementById('userBtn');
        userBtn?.classList.remove('user-wiwi', 'user-yuyu');
        userBtn?.classList.add(`user-${username}`);
        document.querySelectorAll('.dropdown-item[data-user]').forEach(item => {
            item.classList.toggle('active', item.dataset.user === username);
        });
    }
    
    render() {
        document.title = `${this.city.name} · Life29`;
        document.getElementById('cityName').textContent = this.city.name;
        document.getElementById('cityCountry').textContent = this.city.country;
        
        const heroBg = document.querySelector('.city-hero-bg');
        if (heroBg) {
            heroBg.style.background = `linear-gradient(135deg, ${this.city.color} 0%, ${this.adjustColor(this.city.color, -30)} 100%)`;
        }
        
        if (this.city.visitDate) {
            document.getElementById('cityDate').textContent = `首次访问: ${new Date(this.city.visitDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        }
        
        document.getElementById('photoCount').textContent = this.city.photos?.length || 0;
        document.getElementById('journalCount').textContent = this.city.journals?.length || 0;
        
        this.renderPhotos();
        this.renderJournals();
    }
    
    renderPhotos() {
        const grid = document.getElementById('photosGrid');
        const empty = document.getElementById('photosEmpty');
        const photos = this.city.photos || [];
        const isLoggedIn = !!localStorage.getItem('life29-user');
        
        if (photos.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        grid.innerHTML = photos.map((photo, i) => `
            <div class="photo-card" data-index="${i}" data-id="${photo.id}">
                <img src="${photo.url}" alt="${photo.caption || ''}" loading="lazy">
                <div class="photo-card-overlay"><p class="photo-caption">${photo.caption || ''}</p></div>
                ${isLoggedIn ? `<button class="photo-delete-btn" data-index="${i}" title="删除照片">×</button>` : ''}
            </div>
        `).join('');
        
        grid.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('photo-delete-btn')) {
                    this.openViewer(parseInt(card.dataset.index));
                }
            });
        });
        
        // 删除按钮事件
        grid.querySelectorAll('.photo-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePhoto(parseInt(btn.dataset.index));
            });
        });
    }
    
    async deletePhoto(index) {
        if (!confirm('确定删除这张照片吗？')) return;
        
        const photo = this.city.photos[index];
        
        // 从本地删除
        this.city.photos.splice(index, 1);
        dataManager.save();
        
        // TODO: 从云端删除（需要 moment 关联）
        
        this.render();
    }
    
    renderJournals() {
        const list = document.getElementById('journalsList');
        const empty = document.getElementById('journalsEmpty');
        const journals = this.city.journals || [];
        const isLoggedIn = !!localStorage.getItem('life29-user');
        
        if (journals.length === 0) {
            list.style.display = 'none';
            empty.style.display = 'block';
            return;
        }
        
        list.style.display = 'flex';
        empty.style.display = 'none';
        
        list.innerHTML = journals.map((journal, i) => `
            <article class="journal-card" data-index="${i}">
                <div class="journal-header">
                    <h3 class="journal-title">${journal.title}</h3>
                    <div class="journal-actions">
                        <span class="journal-date">${new Date(journal.date || journal.createdAt).toLocaleDateString('zh-CN')}</span>
                        ${isLoggedIn ? `<button class="journal-delete-btn" data-index="${i}" title="删除日志">×</button>` : ''}
                    </div>
                </div>
                <p class="journal-content">${journal.content}</p>
            </article>
        `).join('');
        
        // 删除按钮事件
        list.querySelectorAll('.journal-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteJournal(parseInt(btn.dataset.index));
            });
        });
    }
    
    async deleteJournal(index) {
        if (!confirm('确定删除这篇日志吗？')) return;
        
        // 从本地删除
        this.city.journals.splice(index, 1);
        dataManager.save();
        
        // TODO: 从云端删除
        
        this.render();
    }
    
    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${btn.dataset.tab}Tab`)?.classList.add('active');
            });
        });
        
        const viewer = document.getElementById('imageViewer');
        viewer?.querySelector('.viewer-backdrop')?.addEventListener('click', () => this.closeViewer());
        viewer?.querySelector('.viewer-close')?.addEventListener('click', () => this.closeViewer());
        viewer?.querySelector('.viewer-prev')?.addEventListener('click', () => this.prevPhoto());
        viewer?.querySelector('.viewer-next')?.addEventListener('click', () => this.nextPhoto());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeViewer();
            if (!viewer?.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') this.prevPhoto();
                if (e.key === 'ArrowRight') this.nextPhoto();
            }
        });
    }
    
    openViewer(index) {
        const photos = this.city.photos || [];
        if (index < 0 || index >= photos.length) return;
        this.currentPhotoIndex = index;
        const photo = photos[index];
        document.getElementById('viewerImage').src = photo.url;
        document.getElementById('viewerCaption').textContent = photo.caption || '';
        document.getElementById('imageViewer')?.classList.remove('hidden');
    }
    
    closeViewer() { document.getElementById('imageViewer')?.classList.add('hidden'); }
    
    prevPhoto() {
        const photos = this.city.photos || [];
        if (!photos.length) return;
        this.currentPhotoIndex = (this.currentPhotoIndex - 1 + photos.length) % photos.length;
        const photo = photos[this.currentPhotoIndex];
        document.getElementById('viewerImage').src = photo.url;
        document.getElementById('viewerCaption').textContent = photo.caption || '';
    }
    
    nextPhoto() {
        const photos = this.city.photos || [];
        if (!photos.length) return;
        this.currentPhotoIndex = (this.currentPhotoIndex + 1) % photos.length;
        const photo = photos[this.currentPhotoIndex];
        document.getElementById('viewerImage').src = photo.url;
        document.getElementById('viewerCaption').textContent = photo.caption || '';
    }
    
    adjustColor(hex, amount) {
        if (!hex) return '#E8B4B8';
        let color = hex.replace('#', '');
        if (color.length === 3) color = color.split('').map(c => c + c).join('');
        const num = parseInt(color, 16);
        let r = Math.max(0, Math.min(255, (num >> 16) + amount));
        let g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
        let b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.cityPage = new CityPage(); });
