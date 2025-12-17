/**
 * Life29 - Global Music Player
 * 跨页面音乐播放状态管理
 */

class GlobalMusicPlayer {
    constructor() {
        this.audio = null;
        this.currentSong = null;
        this.isPlaying = false;
        this.storageKey = 'life29-music-state';
        
        this.init();
    }
    
    init() {
        // 创建或获取audio元素
        this.audio = document.getElementById('globalAudioPlayer');
        if (!this.audio) {
            this.audio = document.createElement('audio');
            this.audio.id = 'globalAudioPlayer';
            document.body.appendChild(this.audio);
        }
        
        // 恢复播放状态
        this.restoreState();
        
        // 监听storage变化（跨标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.onStateChange();
            }
        });
        
        // 音频事件
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        
        // 渲染迷你播放器（非Music页面）
        if (!window.location.pathname.includes('music.html')) {
            this.renderMiniPlayer();
        }
        
        // 设置音量
        this.audio.volume = parseFloat(localStorage.getItem('life29-music-volume') || '0.7');
    }
    
    restoreState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const state = JSON.parse(saved);
                this.currentSong = state.song;
                
                if (state.song && state.isPlaying) {
                    this.audio.src = state.song.file;
                    this.audio.currentTime = state.currentTime || 0;
                    // 自动播放需要用户交互，所以先暂停
                    this.updateMiniPlayer();
                }
            }
        } catch (e) {
            console.warn('Failed to restore music state:', e);
        }
    }
    
    saveState() {
        const state = {
            song: this.currentSong,
            isPlaying: this.isPlaying,
            currentTime: this.audio.currentTime,
            timestamp: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }
    
    onStateChange() {
        // 其他标签页的状态变化
        this.restoreState();
        this.updateMiniPlayer();
    }
    
    play(song) {
        if (song) {
            this.currentSong = song;
            this.audio.src = song.file;
        }
        this.audio.play().catch(e => console.warn('Play failed:', e));
    }
    
    pause() {
        this.audio.pause();
    }
    
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else if (this.currentSong) {
            this.audio.play().catch(e => console.warn('Play failed:', e));
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        this.saveState();
        this.updateMiniPlayer();
    }
    
    onPause() {
        this.isPlaying = false;
        this.saveState();
        this.updateMiniPlayer();
    }
    
    onEnded() {
        this.isPlaying = false;
        this.saveState();
        this.updateMiniPlayer();
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('music-ended'));
    }
    
    onTimeUpdate() {
        // 每10秒保存一次进度
        if (Math.floor(this.audio.currentTime) % 10 === 0) {
            this.saveState();
        }
        this.updateMiniPlayer();
    }
    
    renderMiniPlayer() {
        // 检查是否有播放中的歌曲
        if (!this.currentSong) return;
        
        const existing = document.getElementById('miniMusicPlayer');
        if (existing) return;
        
        const mini = document.createElement('div');
        mini.id = 'miniMusicPlayer';
        mini.className = 'mini-music-player';
        mini.innerHTML = `
            <a href="music.html" class="mini-player-link" title="打开音乐页面">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <span class="mini-player-title"></span>
            </a>
        `;
        document.body.appendChild(mini);
        
        this.updateMiniPlayer();
    }
    
    updateMiniPlayer() {
        const mini = document.getElementById('miniMusicPlayer');
        if (!mini) {
            if (this.currentSong && !window.location.pathname.includes('music.html')) {
                this.renderMiniPlayer();
            }
            return;
        }
        
        const titleEl = mini.querySelector('.mini-player-title');
        
        if (this.currentSong && this.isPlaying) {
            mini.classList.add('show', 'playing');
            titleEl.textContent = this.currentSong.title;
        } else if (this.currentSong) {
            mini.classList.add('show');
            mini.classList.remove('playing');
            titleEl.textContent = this.currentSong.title;
        } else {
            mini.classList.remove('show', 'playing');
        }
    }
    
    setVolume(value) {
        this.audio.volume = value;
        localStorage.setItem('life29-music-volume', value.toString());
    }
    
    getCurrentTime() {
        return this.audio.currentTime;
    }
    
    getDuration() {
        return this.audio.duration;
    }
    
    seek(time) {
        this.audio.currentTime = time;
    }
}

// 全局实例
window.globalMusicPlayer = new GlobalMusicPlayer();
