/**
 * Life29 - Music Page
 * 4x4专辑展示 + 云端存储
 */

class MusicPage {
    constructor() {
        this.songs = [];
        this.currentSong = null;
        this.currentIndex = -1;
        this.isPlaying = false;
        this.audio = document.getElementById('audioPlayer');
        this.displayOrder = [];
        this.isCloudMode = false;
        this.currentUser = localStorage.getItem('life29-user') || 'wiwi';
        
        this.init();
    }
    
    async init() {
        this.setupTheme();
        this.bindEvents();
        this.showLoading(true);
        
        // 尝试连接云端
        await this.initCloud();
        await this.loadSongs();
        
        this.showLoading(false);
        this.renderGrid();
        this.updatePlayerUI();
    }
    
    async initCloud() {
        if (window.supabaseService) {
            this.isCloudMode = await window.supabaseService.init();
            if (this.isCloudMode) {
                this.showToast('☁️ 云端已连接', 'success');
            }
        }
    }
    
    async loadSongs() {
        // 优先从云端加载
        if (this.isCloudMode) {
            try {
                const cloudSongs = await window.supabaseService.getMusicList();
                this.songs = cloudSongs.map(s => ({
                    id: s.id,
                    title: s.music_name,
                    artist: s.artist,
                    album: s.album || s.music_name,
                    language: s.language,
                    genre: s.music_genre,
                    file: s.file_url,
                    cover: s.cover_url,
                    uploadUser: s.upload_user,
                    createdAt: s.created_at
                }));
                console.log(`☁️ Loaded ${this.songs.length} songs from cloud`);
            } catch (e) {
                console.error('Cloud load failed:', e);
                await this.loadLocalSongs();
            }
        } else {
            await this.loadLocalSongs();
        }
        
        this.shuffleOrder();
    }
    
    async loadLocalSongs() {
        try {
            const res = await fetch('data/songs.json');
            const data = await res.json();
            this.songs = data.songs || [];
        } catch (e) {
            console.warn('Failed to load local songs:', e);
            this.songs = [];
        }
    }
    
    shuffleOrder() {
        this.displayOrder = [...Array(16).keys()];
        for (let i = this.displayOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.displayOrder[i], this.displayOrder[j]] = [this.displayOrder[j], this.displayOrder[i]];
        }
    }
    
    showLoading(show) {
        const grid = document.getElementById('albumGrid');
        if (show) {
            grid.innerHTML = `
                <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 60px;">
                    <div class="loading-spinner"></div>
                    <p style="margin-top: 16px; color: var(--color-text-muted);">加载中...</p>
                </div>
            `;
        }
    }
    
    showToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
    
    bindEvents() {
        // 播放控制
        document.getElementById('playPauseBtn')?.addEventListener('click', () => this.togglePlay());
        document.getElementById('prevBtn')?.addEventListener('click', () => this.playPrev());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.playNext());
        document.getElementById('shuffleBtn')?.addEventListener('click', () => this.playRandom());
        
        // 音量
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeBtn = document.getElementById('volumeBtn');
        
        volumeSlider?.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
            volumeBtn?.classList.toggle('muted', this.audio.volume === 0);
        });
        
        volumeBtn?.addEventListener('click', () => {
            if (this.audio.volume > 0) {
                this.lastVolume = this.audio.volume;
                this.audio.volume = 0;
                volumeSlider.value = 0;
            } else {
                this.audio.volume = this.lastVolume || 0.7;
                volumeSlider.value = this.audio.volume * 100;
            }
            volumeBtn.classList.toggle('muted', this.audio.volume === 0);
        });
        
        // 进度条
        document.getElementById('progressTrack')?.addEventListener('click', (e) => {
            if (!this.currentSong) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });
        
        // Audio 事件
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            document.getElementById('playPauseBtn')?.classList.add('playing');
        });
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            document.getElementById('playPauseBtn')?.classList.remove('playing');
        });
        
        // Reroll
        document.getElementById('rerollBtn')?.addEventListener('click', () => {
            this.shuffleOrder();
            this.renderGrid();
        });
        
        // 上传模态框
        document.getElementById('uploadBtn')?.addEventListener('click', () => {
            document.getElementById('uploadModal')?.classList.remove('hidden');
        });
        
        document.getElementById('closeUploadModal')?.addEventListener('click', () => {
            document.getElementById('uploadModal')?.classList.add('hidden');
        });
        
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            document.getElementById('uploadModal')?.classList.add('hidden');
        });
        
        // 文件选择
        this.setupFileInputs();
        
        // 上传表单
        document.getElementById('uploadForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpload();
        });
        
        // 搜索
        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        document.getElementById('searchClear')?.addEventListener('click', () => {
            searchInput.value = '';
            this.handleSearch('');
        });
        
        // 初始音量
        this.audio.volume = 0.7;
    }
    
    setupFileInputs() {
        const musicFileArea = document.getElementById('musicFileArea');
        const coverFileArea = document.getElementById('coverFileArea');
        
        musicFileArea?.addEventListener('click', () => document.getElementById('musicFile')?.click());
        coverFileArea?.addEventListener('click', () => document.getElementById('coverFile')?.click());
        
        // 拖拽支持
        [musicFileArea, coverFileArea].forEach(area => {
            if (!area) return;
            
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });
            
            area.addEventListener('dragleave', () => {
                area.classList.remove('dragover');
            });
            
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                
                const file = e.dataTransfer.files[0];
                if (!file) return;
                
                if (area.id === 'musicFileArea' && file.type.startsWith('audio/')) {
                    this.setMusicFile(file);
                } else if (area.id === 'coverFileArea' && file.type.startsWith('image/')) {
                    this.setCoverFile(file);
                }
            });
        });
        
        document.getElementById('musicFile')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.setMusicFile(file);
        });
        
        document.getElementById('coverFile')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.setCoverFile(file);
        });
    }
    
    setMusicFile(file) {
        this.selectedMusicFile = file;
        document.getElementById('musicFileName').textContent = file.name;
        document.getElementById('musicFileArea')?.classList.add('has-file');
        
        // 自动填充歌曲名
        const titleInput = document.getElementById('songTitle');
        if (titleInput && !titleInput.value) {
            const name = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
            titleInput.value = name;
        }
    }
    
    setCoverFile(file) {
        this.selectedCoverFile = file;
        document.getElementById('coverFileName').textContent = file.name;
        document.getElementById('coverFileArea')?.classList.add('has-file');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('coverPreview');
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
    
    renderGrid() {
        const grid = document.getElementById('albumGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const placeholderColors = this.generatePlaceholderColors(16);
        
        this.displayOrder.forEach((orderIndex, gridIndex) => {
            const song = this.songs[orderIndex];
            const item = document.createElement('div');
            item.className = 'album-item';
            item.dataset.index = orderIndex;
            
            if (song) {
                const coverUrl = song.cover ? 
                    (window.cloudinaryService?.getThumbnailUrl(song.cover, 300) || song.cover) : '';
                
                item.innerHTML = `
                    <img class="album-cover" src="${coverUrl}" alt="${song.title}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="album-placeholder" style="background: ${placeholderColors[gridIndex]}; display: none;">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    </div>
                    <div class="album-info">
                        <div class="album-info-title">${song.title}</div>
                        <div class="album-info-artist">${song.artist}</div>
                        <div class="album-info-meta">${song.language || ''} ${song.genre ? '· ' + song.genre : ''}</div>
                        ${song.uploadUser ? `<div class="album-info-user">by ${song.uploadUser}</div>` : ''}
                    </div>
                    <div class="album-playing-indicator">
                        <div class="equalizer-bars">
                            <div class="equalizer-bar"></div>
                            <div class="equalizer-bar"></div>
                            <div class="equalizer-bar"></div>
                        </div>
                    </div>
                `;
                item.addEventListener('click', () => this.playSong(orderIndex));
            } else {
                item.innerHTML = `
                    <div class="album-placeholder" style="background: ${placeholderColors[gridIndex]};">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    </div>
                `;
                item.style.opacity = '0.4';
                item.style.cursor = 'default';
            }
            
            grid.appendChild(item);
        });
        
        this.updatePlayingState();
    }
    
    generatePlaceholderColors(count) {
        const baseHues = [0, 30, 60, 120, 180, 210, 240, 270, 300, 330];
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            const hue = baseHues[i % baseHues.length] + Math.random() * 20 - 10;
            const sat = 15 + Math.random() * 25;
            const light = document.documentElement.getAttribute('data-theme') === 'dark' 
                ? 20 + Math.random() * 15 
                : 75 + Math.random() * 15;
            colors.push(`hsl(${hue}, ${sat}%, ${light}%)`);
        }
        
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        
        return colors;
    }
    
    playSong(index) {
        const song = this.songs[index];
        if (!song) return;
        
        this.currentIndex = index;
        this.currentSong = song;
        
        this.audio.src = song.file;
        this.audio.play().catch(e => console.warn('Play failed:', e));
        
        this.updatePlayerUI();
        this.updatePlayingState();
    }
    
    togglePlay() {
        if (!this.currentSong) {
            const firstValidIndex = this.displayOrder.find(i => this.songs[i]);
            if (firstValidIndex !== undefined) {
                this.playSong(firstValidIndex);
            }
            return;
        }
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(e => console.warn('Play failed:', e));
        }
    }
    
    playPrev() {
        if (this.songs.length === 0) return;
        
        const currentPos = this.displayOrder.indexOf(this.currentIndex);
        let prevPos = currentPos - 1;
        
        for (let i = 0; i < 16; i++) {
            if (prevPos < 0) prevPos = 15;
            const songIndex = this.displayOrder[prevPos];
            if (this.songs[songIndex]) {
                this.playSong(songIndex);
                return;
            }
            prevPos--;
        }
    }
    
    playNext() {
        if (this.songs.length === 0) return;
        
        const currentPos = this.displayOrder.indexOf(this.currentIndex);
        let nextPos = currentPos + 1;
        
        for (let i = 0; i < 16; i++) {
            if (nextPos > 15) nextPos = 0;
            const songIndex = this.displayOrder[nextPos];
            if (this.songs[songIndex]) {
                this.playSong(songIndex);
                return;
            }
            nextPos++;
        }
    }
    
    playRandom() {
        const validIndices = this.songs.map((_, i) => i).filter(i => this.songs[i]);
        if (validIndices.length === 0) return;
        
        let randomIndex;
        do {
            randomIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
        } while (randomIndex === this.currentIndex && validIndices.length > 1);
        
        this.playSong(randomIndex);
    }
    
    updatePlayerUI() {
        const coverEl = document.getElementById('nowPlayingCover');
        const titleEl = document.getElementById('nowPlayingTitle');
        const artistEl = document.getElementById('nowPlayingArtist');
        
        if (this.currentSong) {
            const coverUrl = this.currentSong.cover ? 
                (window.cloudinaryService?.getThumbnailUrl(this.currentSong.cover, 100) || this.currentSong.cover) : '';
            coverEl.innerHTML = coverUrl ? `<img src="${coverUrl}" alt="">` : '';
            titleEl.textContent = this.currentSong.title;
            artistEl.textContent = this.currentSong.artist;
        } else {
            coverEl.innerHTML = '';
            titleEl.textContent = '未播放';
            artistEl.textContent = '-';
        }
    }
    
    updatePlayingState() {
        document.querySelectorAll('.album-item').forEach(item => {
            const index = parseInt(item.dataset.index);
            item.classList.toggle('playing', index === this.currentIndex);
        });
    }
    
    updateProgress() {
        const current = this.audio.currentTime;
        const duration = this.audio.duration || 0;
        const remaining = duration - current;
        
        document.getElementById('timeCurrent').textContent = this.formatTime(current);
        document.getElementById('timeRemaining').textContent = '-' + this.formatTime(remaining);
        
        const percent = duration ? (current / duration) * 100 : 0;
        document.getElementById('progressFill').style.width = percent + '%';
    }
    
    formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    handleSearch(query) {
        const q = query.toLowerCase().trim();
        
        document.querySelectorAll('.album-item').forEach(item => {
            const index = parseInt(item.dataset.index);
            const song = this.songs[index];
            
            if (!q) {
                item.classList.remove('hidden', 'search-match');
                return;
            }
            
            if (!song) {
                item.classList.add('hidden');
                return;
            }
            
            const match = 
                song.title?.toLowerCase().includes(q) ||
                song.artist?.toLowerCase().includes(q) ||
                song.album?.toLowerCase().includes(q) ||
                song.genre?.toLowerCase().includes(q);
            
            item.classList.toggle('hidden', !match);
            item.classList.toggle('search-match', match);
        });
    }
    
    async handleUpload() {
        const title = document.getElementById('songTitle').value.trim();
        const artist = document.getElementById('songArtist').value.trim();
        const album = document.getElementById('songAlbum').value.trim();
        const language = document.getElementById('songLanguage').value;
        const genre = document.getElementById('songGenre').value.trim();
        
        if (!this.selectedMusicFile || !title || !artist) {
            this.showToast('请选择音乐文件并填写歌曲名和歌手', 'error');
            return;
        }
        
        const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '上传中...';
        
        try {
            // 检查是否配置了云服务
            if (!this.isCloudMode || !window.cloudinaryService) {
                throw new Error('云服务未配置，请先配置 Supabase 和 Cloudinary');
            }
            
            // 上传音乐文件
            submitBtn.textContent = '上传音乐文件...';
            const musicResult = await window.cloudinaryService.uploadMusic(
                this.selectedMusicFile,
                (p) => { submitBtn.textContent = `上传音乐 ${p}%`; }
            );
            
            // 上传封面（如果有）
            let coverResult = null;
            if (this.selectedCoverFile) {
                submitBtn.textContent = '上传封面...';
                coverResult = await window.cloudinaryService.uploadCover(
                    this.selectedCoverFile,
                    (p) => { submitBtn.textContent = `上传封面 ${p}%`; }
                );
            }
            
            // 保存到数据库
            submitBtn.textContent = '保存数据...';
            const saved = await window.supabaseService.addMusic({
                title,
                artist,
                album: album || title,
                language,
                genre,
                fileUrl: musicResult.url,
                coverUrl: coverResult?.url || '',
                uploadUser: this.currentUser
            });
            
            if (!saved) {
                throw new Error('保存到数据库失败');
            }
            
            this.showToast('🎵 上传成功！', 'success');
            
            // 刷新列表
            await this.loadSongs();
            this.renderGrid();
            
            // 关闭模态框并重置
            document.getElementById('uploadModal')?.classList.add('hidden');
            this.resetUploadForm();
            
        } catch (e) {
            console.error('Upload failed:', e);
            this.showToast('上传失败: ' + e.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    resetUploadForm() {
        document.getElementById('uploadForm')?.reset();
        document.getElementById('musicFileName').textContent = '';
        document.getElementById('coverFileName').textContent = '';
        document.getElementById('coverPreview')?.classList.add('hidden');
        document.querySelectorAll('.upload-file-area').forEach(el => el.classList.remove('has-file'));
        this.selectedMusicFile = null;
        this.selectedCoverFile = null;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.musicPage = new MusicPage();
});
