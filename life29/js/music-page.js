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
        this.audio = null;
        this.displayOrder = [];
        this.isCloudMode = false;
        this.currentUser = localStorage.getItem('life29-user') || 'wiwi';
        this.eventsBound = false;
        
        this.init();
    }
    
    async init() {
        this.setupTheme();
        this.showLoading(true);
        
        // 尝试连接云端
        await this.initCloud();
        await this.loadSongs();
        
        this.showLoading(false);
        this.renderGrid();
        
        // 初始化音频（必须在 loadSongs 之后）
        this.initAudio();
        this.bindEvents();
        this.updatePlayerUI();
    }
    
    initAudio() {
        // 优先使用全局播放器
        if (window.globalMusicPlayer && window.globalMusicPlayer.audio) {
            this.audio = window.globalMusicPlayer.audio;
            
            // 同步当前状态
            const gp = window.globalMusicPlayer;
            if (gp.currentSong) {
                const index = this.songs.findIndex(s => s.file === gp.currentSong.file);
                if (index !== -1) {
                    this.currentIndex = index;
                    this.currentSong = this.songs[index];
                    this.isPlaying = gp.isPlaying;
                }
            }
        } else {
            this.audio = document.getElementById('audioPlayer');
        }
        
        // 绑定音频事件
        if (!this.eventsBound) {
            this.audio.addEventListener('timeupdate', () => this.updateProgress());
            this.audio.addEventListener('play', () => {
                this.isPlaying = true;
                document.getElementById('playPauseBtn')?.classList.add('playing');
                this.updatePlayingState();
            });
            this.audio.addEventListener('pause', () => {
                this.isPlaying = false;
                document.getElementById('playPauseBtn')?.classList.remove('playing');
            });
            this.audio.addEventListener('ended', () => this.playNext());
            this.eventsBound = true;
        }
        
        // 更新UI状态
        if (this.isPlaying) {
            document.getElementById('playPauseBtn')?.classList.add('playing');
        }
    }
    
    async initCloud() {
        const statusEl = document.getElementById('cloudStatus');
        
        if (window.supabaseService) {
            this.isCloudMode = await window.supabaseService.init();
            if (this.isCloudMode && statusEl) {
                statusEl.classList.remove('disconnected');
                statusEl.classList.add('connected');
                statusEl.title = '云端已连接';
            }
        }
        
        // 点击显示状态
        statusEl?.addEventListener('click', () => {
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
                    thoughts: s.thoughts || '',  // 添加 thoughts 字段
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
        
        // 背景模式切换
        this.bgMode = localStorage.getItem('life29-music-bg-mode') || 'theme';
        this.setupBgMode();
    }
    
    setupBgMode() {
        const toggle = document.getElementById('bgModeToggle');
        const glowBg = document.getElementById('glowBackground');
        
        if (!toggle || !glowBg) return;
        
        // 设置初始状态
        toggle.querySelectorAll('.bg-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.bgMode);
        });
        
        if (this.bgMode === 'glow') {
            document.body.classList.add('glow-mode');
            glowBg.classList.add('active');
        }
        
        // 绑定切换事件
        toggle.querySelectorAll('.bg-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.bgMode = mode;
                localStorage.setItem('life29-music-bg-mode', mode);
                
                // 更新按钮状态
                toggle.querySelectorAll('.bg-mode-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === mode);
                });
                
                // 切换模式
                if (mode === 'glow') {
                    document.body.classList.add('glow-mode');
                    glowBg.classList.add('active');
                    // 如果有当前播放的歌曲，更新泛光颜色
                    if (this.currentSong?.cover) {
                        this.updateGlowColors(this.currentSong.cover);
                    }
                } else {
                    document.body.classList.remove('glow-mode');
                    glowBg.classList.remove('active');
                }
            });
        });
    }
    
    // 从专辑图片提取颜色并更新泛光背景
    updateGlowColors(imageUrl) {
        if (this.bgMode !== 'glow' || !imageUrl) return;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                // 创建 canvas 提取颜色
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 50;
                canvas.height = 50;
                ctx.drawImage(img, 0, 0, 50, 50);
                
                const imageData = ctx.getImageData(0, 0, 50, 50).data;
                const colors = this.extractDominantColors(imageData);
                
                // 应用颜色到泛光背景
                const glowBg = document.getElementById('glowBackground');
                if (glowBg && colors.length >= 3) {
                    glowBg.style.setProperty('--glow-color-1', colors[0]);
                    glowBg.style.setProperty('--glow-color-2', colors[1]);
                    glowBg.style.setProperty('--glow-color-3', colors[2]);
                }
            } catch (e) {
                console.warn('Failed to extract colors:', e);
            }
        };
        img.onerror = () => {
            // 使用默认颜色
            this.setDefaultGlowColors();
        };
        img.src = imageUrl;
    }
    
    // 提取主要颜色
    extractDominantColors(imageData) {
        const colorMap = new Map();
        
        // 采样像素
        for (let i = 0; i < imageData.length; i += 16) { // 每4个像素采样一次
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];
            
            if (a < 128) continue; // 跳过透明像素
            
            // 量化颜色（减少颜色数量）
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            
            // 跳过太暗或太亮的颜色
            const brightness = (qr + qg + qb) / 3;
            if (brightness < 30 || brightness > 230) continue;
            
            const key = `${qr},${qg},${qb}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // 排序获取最常见的颜色
        const sorted = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        // 转换为 RGB 字符串，并调整亮度使其更适合作为泛光
        const colors = sorted.map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            // 提高饱和度和亮度
            return `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.8)`;
        });
        
        // 确保至少有3种颜色
        while (colors.length < 3) {
            colors.push(colors[0] || 'rgba(200, 180, 200, 0.8)');
        }
        
        return colors;
    }
    
    setDefaultGlowColors() {
        const glowBg = document.getElementById('glowBackground');
        if (glowBg) {
            glowBg.style.setProperty('--glow-color-1', '#E8B4B8');
            glowBg.style.setProperty('--glow-color-2', '#A8D5E5');
            glowBg.style.setProperty('--glow-color-3', '#B8D4A8');
        }
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
        
        const updateVolumeVisual = () => {
            if (volumeSlider) {
                volumeSlider.style.setProperty('--volume-percent', volumeSlider.value + '%');
            }
        };
        
        volumeSlider?.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
            volumeBtn?.classList.toggle('muted', this.audio.volume === 0);
            updateVolumeVisual();
        });
        
        // 初始化音量视觉
        updateVolumeVisual();
        
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
            updateVolumeVisual();
        });
        
        // 进度条
        document.getElementById('progressTrack')?.addEventListener('click', (e) => {
            if (!this.currentSong) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });
        
        // Audio 事件会在 syncWithGlobalPlayer 中绑定
        
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
        
        // 预览按钮
        document.getElementById('showPreviewBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCoverPreview();
        });
        
        document.getElementById('closePreview')?.addEventListener('click', () => {
            this.hideCoverPreview();
        });
        
        document.getElementById('previewOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'previewOverlay') {
                this.hideCoverPreview();
            }
        });
        
        // 编辑 thoughts
        document.getElementById('editThoughtsBtn')?.addEventListener('click', () => {
            this.editThoughts();
        });
        
        // 提交评论
        document.getElementById('submitCommentBtn')?.addEventListener('click', () => {
            this.submitComment();
        });
        
        // 回车提交评论
        document.getElementById('commentsInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitComment();
            }
        });
    }
    
    editThoughts() {
        if (!this.currentSong) return;
        
        const currentThoughts = this.currentSong.thoughts || '';
        const newThoughts = prompt('编辑你对这首歌的想法:', currentThoughts);
        
        if (newThoughts !== null) {
            const currentUser = localStorage.getItem('life29-user') || 'wiwi';
            
            this.currentSong.thoughts = newThoughts;
            this.currentSong.thoughts_author = currentUser;
            this.currentSong.thoughts_time = new Date().toISOString();
            
            // 更新 UI
            this.updatePlayerUI();
            
            // 更新网格中的显示
            this.renderGrid();
            
            // 保存到云端
            this.saveThoughtsToCloud(this.currentIndex, newThoughts, currentUser);
        }
    }
    
    async submitComment() {
        if (!this.currentSong) return;
        
        const commentsInput = document.getElementById('commentsInput');
        const comment = commentsInput?.value.trim();
        
        if (!comment) return;
        
        const currentUser = localStorage.getItem('life29-user') || 'yuyu';
        const submitBtn = document.getElementById('submitCommentBtn');
        
        // 禁用按钮
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '发送中...';
        }
        
        try {
            this.currentSong.feedback = comment;
            this.currentSong.feedback_author = currentUser;
            this.currentSong.feedback_time = new Date().toISOString();
            
            // 更新 UI
            this.updatePlayerUI();
            
            // 保存到云端
            await this.saveFeedbackToCloud(this.currentIndex, comment, currentUser);
            
            // 清空输入框
            if (commentsInput) commentsInput.value = '';
            
        } catch (e) {
            console.error('Failed to submit comment:', e);
            alert('评论提交失败');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> 发送';
            }
        }
    }
    
    async saveThoughtsToCloud(songIndex, thoughts, author) {
        const song = this.songs[songIndex];
        if (!song || !window.supabaseService?.isConnected()) return;
        
        try {
            await window.supabaseService.updateSongThoughts(song.id, thoughts, author);
        } catch (e) {
            console.warn('Failed to save thoughts:', e);
        }
    }
    
    async saveFeedbackToCloud(songIndex, feedback, author) {
        const song = this.songs[songIndex];
        if (!song || !window.supabaseService?.isConnected()) return;
        
        try {
            await window.supabaseService.updateSongFeedback(song.id, feedback, author);
        } catch (e) {
            console.warn('Failed to save feedback:', e);
            throw e;
        }
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
        
        // 存储预览数据用于预览按钮
        const reader = new FileReader();
        reader.onload = (e) => {
            this.coverPreviewData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    showCoverPreview() {
        if (!this.coverPreviewData) return;
        const overlay = document.getElementById('previewOverlay');
        const img = document.getElementById('previewImage');
        img.src = this.coverPreviewData;
        overlay.classList.add('show');
    }
    
    hideCoverPreview() {
        document.getElementById('previewOverlay')?.classList.remove('show');
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
                
                const hasCover = coverUrl && coverUrl.length > 0;
                const hasThoughts = song.thoughts && song.thoughts.trim().length > 0;
                
                item.innerHTML = `
                    ${hasCover ? `<img class="album-cover" src="${coverUrl}" alt="${song.title}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
                    <div class="album-placeholder" style="background: ${placeholderColors[gridIndex]}; ${hasCover ? 'display: none;' : ''}"></div>
                    <div class="album-info">
                        <div class="album-info-title">${song.title}</div>
                        <div class="album-info-artist">${song.artist}</div>
                        <div class="album-info-meta">${song.language || ''} ${song.genre ? '· ' + song.genre : ''}</div>
                        ${hasThoughts ? `<div class="album-info-thoughts">"${song.thoughts}"</div>` : ''}
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
                item.innerHTML = `<div class="album-placeholder" style="background: ${placeholderColors[gridIndex]};"></div>`;
                item.style.opacity = '0.4';
                item.style.cursor = 'default';
            }
            
            grid.appendChild(item);
        });
        
        this.updatePlayingState();
        
        // 同步sidebar高度与album grid
        this.syncSidebarHeight();
    }
    
    // 同步sidebar高度与album grid
    syncSidebarHeight() {
        const grid = document.getElementById('albumGrid');
        const sidebar = document.getElementById('musicSidebar');
        
        if (!grid || !sidebar) return;
        
        // 等待grid渲染完成后获取高度
        requestAnimationFrame(() => {
            const gridHeight = grid.offsetHeight;
            if (gridHeight > 0) {
                sidebar.style.height = gridHeight + 'px';
                sidebar.style.minHeight = gridHeight + 'px';
            }
        });
        
        // 监听窗口resize，保持同步
        if (!this.resizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                const newHeight = grid.offsetHeight;
                if (newHeight > 0) {
                    sidebar.style.height = newHeight + 'px';
                    sidebar.style.minHeight = newHeight + 'px';
                }
            });
            this.resizeObserver.observe(grid);
        }
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
        
        // 设置音频源并播放
        this.audio.src = song.file;
        this.audio.play().catch(e => console.warn('Play failed:', e));
        
        // 同步到全局播放器
        if (window.globalMusicPlayer) {
            window.globalMusicPlayer.currentSong = song;
            window.globalMusicPlayer.isPlaying = true;
            window.globalMusicPlayer.saveState();
        }
        
        this.updatePlayerUI();
        this.updatePlayingState();
        
        // 更新泛光背景颜色
        if (song.cover) {
            this.updateGlowColors(song.cover);
        }
    }
    
    togglePlay() {
        if (!this.currentSong) {
            const firstValidIndex = this.displayOrder.find(i => this.songs[i]);
            if (firstValidIndex !== undefined) {
                this.playSong(firstValidIndex);
            }
            return;
        }
        
        if (this.audio.paused) {
            this.audio.play().catch(e => console.warn('Play failed:', e));
        } else {
            this.audio.pause();
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
        // 播放栏元素（现已移除，但保留兼容性检查）
        const coverEl = document.getElementById('nowPlayingCover');
        const titleEl = document.getElementById('nowPlayingTitle');
        const artistEl = document.getElementById('nowPlayingArtist');
        
        // 左侧信息面板元素
        const sidebarCover = document.getElementById('sidebarCover');
        const sidebarTitle = document.getElementById('sidebarTitle');
        const sidebarArtist = document.getElementById('sidebarArtist');
        const sidebarAlbum = document.getElementById('sidebarAlbum');
        const sidebarLanguage = document.getElementById('sidebarLanguage');
        const sidebarThoughts = document.getElementById('sidebarThoughts');
        const thoughtsAuthor = document.getElementById('thoughtsAuthor');
        const thoughtsTime = document.getElementById('thoughtsTime');
        const sidebarComments = document.getElementById('sidebarComments');
        const commentsAuthor = document.getElementById('commentsAuthor');
        const commentsTime = document.getElementById('commentsTime');
        const commentsInput = document.getElementById('commentsInput');
        
        if (this.currentSong) {
            const coverUrl = this.currentSong.cover ? 
                (window.cloudinaryService?.getThumbnailUrl(this.currentSong.cover, 100) || this.currentSong.cover) : '';
            const largeCoverUrl = this.currentSong.cover ?
                (window.cloudinaryService?.getThumbnailUrl(this.currentSong.cover, 400) || this.currentSong.cover) : '';
            
            // 更新播放栏（如果存在）
            if (coverEl) coverEl.innerHTML = coverUrl ? `<img src="${coverUrl}" alt="">` : '';
            if (titleEl) titleEl.textContent = this.currentSong.title;
            if (artistEl) artistEl.textContent = this.currentSong.artist;
            
            // 更新左侧面板
            if (sidebarCover) {
                sidebarCover.innerHTML = largeCoverUrl ? 
                    `<img src="${largeCoverUrl}" alt="${this.currentSong.title}">` : 
                    `<div class="sidebar-cover-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`;
            }
            if (sidebarTitle) sidebarTitle.textContent = this.currentSong.title;
            if (sidebarArtist) sidebarArtist.textContent = this.currentSong.artist;
            if (sidebarAlbum) sidebarAlbum.textContent = this.currentSong.album || '';
            if (sidebarLanguage) sidebarLanguage.textContent = this.currentSong.language || '';
            
            // Thoughts
            if (sidebarThoughts) {
                sidebarThoughts.textContent = this.currentSong.thoughts || '';
                sidebarThoughts.dataset.songIndex = this.currentIndex;
            }
            if (thoughtsAuthor) {
                thoughtsAuthor.textContent = this.currentSong.thoughts_author || '';
            }
            if (thoughtsTime) {
                thoughtsTime.textContent = this.currentSong.thoughts_time ? 
                    this.formatTime(this.currentSong.thoughts_time) : '';
            }
            
            // Comments/Feedback
            if (sidebarComments) {
                sidebarComments.textContent = this.currentSong.feedback || '';
            }
            if (commentsAuthor) {
                commentsAuthor.textContent = this.currentSong.feedback_author || '';
            }
            if (commentsTime) {
                commentsTime.textContent = this.currentSong.feedback_time ?
                    this.formatTime(this.currentSong.feedback_time) : '';
            }
            if (commentsInput) {
                commentsInput.value = '';
            }
        } else {
            // 更新播放栏（如果存在）
            if (coverEl) coverEl.innerHTML = '';
            if (titleEl) titleEl.textContent = '未播放';
            if (artistEl) artistEl.textContent = '-';
            
            // 重置左侧面板
            if (sidebarCover) {
                sidebarCover.innerHTML = `<div class="sidebar-cover-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`;
            }
            if (sidebarTitle) sidebarTitle.textContent = '选择一首歌';
            if (sidebarArtist) sidebarArtist.textContent = '-';
            if (sidebarAlbum) sidebarAlbum.textContent = '';
            if (sidebarLanguage) sidebarLanguage.textContent = '';
            if (sidebarThoughts) sidebarThoughts.textContent = '';
            if (thoughtsAuthor) thoughtsAuthor.textContent = '';
            if (thoughtsTime) thoughtsTime.textContent = '';
            if (sidebarComments) sidebarComments.textContent = '';
            if (commentsAuthor) commentsAuthor.textContent = '';
            if (commentsTime) commentsTime.textContent = '';
        }
    }
    
    formatTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
        
        return `${date.getMonth() + 1}/${date.getDate()}`;
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
        const thoughts = document.getElementById('songThoughts').value.trim();
        
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
                thoughts,
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
        document.querySelectorAll('.upload-file-area').forEach(el => el.classList.remove('has-file'));
        this.selectedMusicFile = null;
        this.selectedCoverFile = null;
        this.coverPreviewData = null;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.musicPage = new MusicPage();
});