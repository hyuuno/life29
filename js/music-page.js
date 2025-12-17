/**
 * Life29 - Music Page
 * 4x4专辑展示 + 播放器
 */

class MusicPage {
    constructor() {
        this.songs = [];
        this.currentSong = null;
        this.currentIndex = -1;
        this.isPlaying = false;
        this.audio = document.getElementById('audioPlayer');
        this.displayOrder = []; // 随机排序后的索引
        
        this.init();
    }
    
    async init() {
        await this.loadSongs();
        this.setupTheme();
        this.bindEvents();
        this.renderGrid();
        this.updatePlayerUI();
    }
    
    async loadSongs() {
        try {
            const res = await fetch('data/songs.json');
            const data = await res.json();
            this.songs = data.songs || [];
        } catch (e) {
            console.warn('Failed to load songs:', e);
            this.songs = [];
        }
        this.shuffleOrder();
    }
    
    shuffleOrder() {
        // Fisher-Yates shuffle
        this.displayOrder = [...Array(16).keys()];
        for (let i = this.displayOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.displayOrder[i], this.displayOrder[j]] = [this.displayOrder[j], this.displayOrder[i]];
        }
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
        
        // 上传
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
        const musicFileArea = document.getElementById('musicFileArea');
        const coverFileArea = document.getElementById('coverFileArea');
        
        musicFileArea?.addEventListener('click', () => document.getElementById('musicFile')?.click());
        coverFileArea?.addEventListener('click', () => document.getElementById('coverFile')?.click());
        
        document.getElementById('musicFile')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('musicFileName').textContent = file.name;
                musicFileArea?.classList.add('has-file');
            }
        });
        
        document.getElementById('coverFile')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('coverFileName').textContent = file.name;
                coverFileArea?.classList.add('has-file');
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById('coverPreview');
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
        
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
    
    renderGrid() {
        const grid = document.getElementById('albumGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // 生成16个随机颜色（用于占位）
        const placeholderColors = this.generatePlaceholderColors(16);
        
        this.displayOrder.forEach((orderIndex, gridIndex) => {
            const song = this.songs[orderIndex];
            const item = document.createElement('div');
            item.className = 'album-item';
            item.dataset.index = orderIndex;
            
            if (song) {
                // 有歌曲数据
                item.innerHTML = `
                    <img class="album-cover" src="${song.cover}" alt="${song.title}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="album-placeholder" style="background: ${placeholderColors[gridIndex]}; display: none;">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    </div>
                    <div class="album-info">
                        <div class="album-info-title">${song.title}</div>
                        <div class="album-info-artist">${song.artist}</div>
                        <div class="album-info-meta">${song.language || ''} ${song.genre ? '· ' + song.genre : ''}</div>
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
                // 占位符
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
        
        // Shuffle colors
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
            // 播放第一首有效歌曲
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
        
        // 在displayOrder中找当前歌曲的位置
        const currentPos = this.displayOrder.indexOf(this.currentIndex);
        let prevPos = currentPos - 1;
        
        // 循环查找上一首有效歌曲
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
            coverEl.innerHTML = `<img src="${this.currentSong.cover}" alt="" onerror="this.style.display='none'">`;
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
                song.titleCn?.toLowerCase().includes(q) ||
                song.artist?.toLowerCase().includes(q) ||
                song.album?.toLowerCase().includes(q) ||
                song.genre?.toLowerCase().includes(q);
            
            item.classList.toggle('hidden', !match);
            item.classList.toggle('search-match', match);
        });
    }
    
    handleUpload() {
        const musicFile = document.getElementById('musicFile').files[0];
        const coverFile = document.getElementById('coverFile').files[0];
        const title = document.getElementById('songTitle').value;
        const artist = document.getElementById('songArtist').value;
        const album = document.getElementById('songAlbum').value;
        const language = document.getElementById('songLanguage').value;
        const genre = document.getElementById('songGenre').value;
        
        if (!musicFile || !title || !artist) {
            alert('请填写必填项');
            return;
        }
        
        // 生成新歌曲数据
        const newSong = {
            id: 'song_' + Date.now(),
            title: title,
            artist: artist,
            album: album || title,
            language: language,
            genre: genre,
            file: 'music/' + musicFile.name,
            cover: coverFile ? 'covers/' + coverFile.name : '',
            addedAt: new Date().toISOString().split('T')[0]
        };
        
        // 添加到列表
        this.songs.push(newSong);
        
        // 提示用户
        alert(`歌曲已添加！\n\n请手动将文件复制到对应文件夹：\n• 音乐文件: music/${musicFile.name}\n• 封面图片: covers/${coverFile?.name || '(无)'}\n\n并更新 data/songs.json`);
        
        // 关闭模态框并刷新
        document.getElementById('uploadModal')?.classList.add('hidden');
        this.shuffleOrder();
        this.renderGrid();
        
        // 重置表单
        document.getElementById('uploadForm')?.reset();
        document.getElementById('musicFileName').textContent = '';
        document.getElementById('coverFileName').textContent = '';
        document.getElementById('coverPreview')?.classList.add('hidden');
        document.querySelectorAll('.upload-file-area').forEach(el => el.classList.remove('has-file'));
        
        // 打印JSON供用户复制
        console.log('新歌曲数据 (复制到 data/songs.json):\n', JSON.stringify(newSong, null, 2));
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.musicPage = new MusicPage();
});
