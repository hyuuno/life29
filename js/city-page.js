/**
 * Life29 - 城市详情页
 */

class CityPage {
    constructor() {
        this.city = null;
        this.currentPhotoIndex = 0;
        this.fabOpen = false;
        this.currentUser = null;
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
        this.currentUser = username;
        if (save) localStorage.setItem('life29-user', username);
        
        const userBtn = document.getElementById('userBtn');
        userBtn?.classList.add('logged-in');
        userBtn?.classList.remove('user-wiwi', 'user-yuyu');
        userBtn?.classList.add(`user-${username}`);
        
        document.querySelectorAll('.dropdown-item[data-user]').forEach(item => {
            item.classList.toggle('active', item.dataset.user === username);
        });
        
        document.getElementById('fabContainer')?.classList.remove('hidden');
    }
    
    render() {
        document.title = `${this.city.name} · Life29`;
        document.getElementById('cityName').textContent = this.city.name;
        document.getElementById('cityCountry').textContent = this.city.country;
        
        const heroBg = document.querySelector('.city-hero-bg');
        if (heroBg) heroBg.style.background = `linear-gradient(135deg, ${this.city.color} 0%, ${this.adjustColor(this.city.color, -30)} 100%)`;
        
        if (this.city.visitDate) {
            const date = new Date(this.city.visitDate);
            document.getElementById('cityDate').textContent = `首次访问: ${date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
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
        
        if (photos.length === 0) {
            if (grid) grid.style.display = 'none';
            if (empty) empty.style.display = 'flex';
            return;
        }
        
        if (grid) grid.style.display = 'grid';
        if (empty) empty.style.display = 'none';
        
        if (grid) {
            grid.innerHTML = photos.map((photo, index) => `
                <div class="photo-card" data-index="${index}" style="animation-delay: ${index * 0.1}s">
                    <img src="${photo.url}" alt="${photo.caption || ''}" loading="lazy">
                    <div class="photo-card-overlay">
                        <p class="photo-caption">${photo.caption || ''}</p>
                        <span class="photo-date">${this.formatDate(photo.uploadedAt)}</span>
                    </div>
                </div>
            `).join('');
            
            grid.querySelectorAll('.photo-card').forEach(card => {
                card.addEventListener('click', () => this.openViewer(parseInt(card.dataset.index)));
            });
        }
    }
    
    renderJournals() {
        const list = document.getElementById('journalsList');
        const empty = document.getElementById('journalsEmpty');
        const journals = this.city.journals || [];
        
        if (journals.length === 0) {
            if (list) list.style.display = 'none';
            if (empty) empty.style.display = 'flex';
            return;
        }
        
        if (list) list.style.display = 'flex';
        if (empty) empty.style.display = 'none';
        
        if (list) {
            list.innerHTML = journals.map((journal, index) => `
                <article class="journal-card" style="animation-delay: ${index * 0.1}s">
                    <div class="journal-header">
                        <h3 class="journal-title">${journal.title}</h3>
                        <span class="journal-date">${this.formatDate(journal.date || journal.createdAt)}</span>
                    </div>
                    <p class="journal-content">${journal.content}</p>
                </article>
            `).join('');
        }
    }
    
    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tab}Tab`)?.classList.add('active');
            });
        });
        
        const fabMain = document.getElementById('addMainBtn');
        const fabContainer = document.getElementById('fabContainer');
        fabMain?.addEventListener('click', () => {
            this.fabOpen = !this.fabOpen;
            fabContainer?.classList.toggle('open', this.fabOpen);
        });
        
        document.getElementById('addPhotoBtn')?.addEventListener('click', () => {
            document.getElementById('addPhotoModal')?.classList.remove('hidden');
            fabContainer?.classList.remove('open');
            this.fabOpen = false;
        });
        
        document.getElementById('closeAddPhoto')?.addEventListener('click', () => {
            document.getElementById('addPhotoModal')?.classList.add('hidden');
        });
        
        document.getElementById('addPhotoForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddPhoto();
        });
        
        document.getElementById('addJournalBtn')?.addEventListener('click', () => {
            document.getElementById('addJournalModal')?.classList.remove('hidden');
            fabContainer?.classList.remove('open');
            this.fabOpen = false;
        });
        
        document.getElementById('closeAddJournal')?.addEventListener('click', () => {
            document.getElementById('addJournalModal')?.classList.add('hidden');
        });
        
        document.getElementById('addJournalForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddJournal();
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.querySelector('.modal-backdrop')?.addEventListener('click', () => modal.classList.add('hidden'));
        });
        
        const viewer = document.getElementById('imageViewer');
        viewer?.querySelector('.viewer-backdrop')?.addEventListener('click', () => this.closeViewer());
        viewer?.querySelector('.viewer-close')?.addEventListener('click', () => this.closeViewer());
        viewer?.querySelector('.viewer-prev')?.addEventListener('click', () => this.prevPhoto());
        viewer?.querySelector('.viewer-next')?.addEventListener('click', () => this.nextPhoto());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeViewer();
                document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            }
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
        const viewer = document.getElementById('imageViewer');
        const img = document.getElementById('viewerImage');
        const caption = document.getElementById('viewerCaption');
        
        if (img) img.src = photo.url;
        if (caption) caption.textContent = photo.caption || '';
        viewer?.classList.remove('hidden');
    }
    
    closeViewer() {
        document.getElementById('imageViewer')?.classList.add('hidden');
    }
    
    prevPhoto() {
        const photos = this.city.photos || [];
        if (photos.length === 0) return;
        this.currentPhotoIndex = (this.currentPhotoIndex - 1 + photos.length) % photos.length;
        const photo = photos[this.currentPhotoIndex];
        document.getElementById('viewerImage').src = photo.url;
        document.getElementById('viewerCaption').textContent = photo.caption || '';
    }
    
    nextPhoto() {
        const photos = this.city.photos || [];
        if (photos.length === 0) return;
        this.currentPhotoIndex = (this.currentPhotoIndex + 1) % photos.length;
        const photo = photos[this.currentPhotoIndex];
        document.getElementById('viewerImage').src = photo.url;
        document.getElementById('viewerCaption').textContent = photo.caption || '';
    }
    
    handleAddPhoto() {
        const url = document.getElementById('photoUrl')?.value;
        const caption = document.getElementById('photoCaption')?.value;
        if (!url) return;
        
        dataManager.addPhoto(this.city.id, { url, caption });
        this.city = dataManager.getCity(this.city.id);
        this.render();
        document.getElementById('addPhotoModal')?.classList.add('hidden');
        document.getElementById('addPhotoForm')?.reset();
    }
    
    handleAddJournal() {
        const title = document.getElementById('journalTitle')?.value;
        const date = document.getElementById('journalDate')?.value;
        const content = document.getElementById('journalContent')?.value;
        if (!title || !content) return;
        
        dataManager.addJournal(this.city.id, { title, date, content });
        this.city = dataManager.getCity(this.city.id);
        this.render();
        document.getElementById('addJournalModal')?.classList.add('hidden');
        document.getElementById('addJournalForm')?.reset();
    }
    
    formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    adjustColor(hex, amount) {
        if (!hex) return '#E8B4B8';
        let color = hex.replace('#', '');
        if (color.length === 3) color = color.split('').map(c => c + c).join('');
        const num = parseInt(color, 16);
        let r = Math.max(0, Math.min(255, (num >> 16) + amount));
        let g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        let b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.cityPage = new CityPage(); });
