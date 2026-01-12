/**
 * Life29 - Global Music Player
 * 跨页面音乐播放 - 使用 localStorage + BroadcastChannel 同步
 */

// 全局Toast通知函数
window.showGlobalToast = function(title, message, type = 'info', duration = 3000) {
    // 移除现有的toast
    const existing = document.getElementById('globalToast');
    if (existing) existing.remove();
    
    const icons = {
        success: '✓',
        error: '✕',
        info: '☁',
        warning: '⚠'
    };
    
    const toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = `global-toast ${type}`;
    toast.innerHTML = `
        <span class="global-toast-icon">${icons[type] || icons.info}</span>
        <div class="global-toast-content">
            <span class="global-toast-title">${title}</span>
            ${message ? `<span class="global-toast-message">${message}</span>` : ''}
        </div>
    `;
    document.body.appendChild(toast);
    
    // 显示动画
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // 自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
};

class GlobalMusicPlayer {
    constructor() {
        this.storageKey = 'life29-music-state';
        this.channelName = 'life29-music-channel';
        this.channel = null;
        this.audio = null;
        this.currentSong = null;
        this.isPlaying = false;
        this.isMusicPage = window.location.pathname.includes('music.html');
        
        this.init();
    }
    
    init() {
        // 创建 BroadcastChannel 用于跨标签页通信
        if ('BroadcastChannel' in window) {
            this.channel = new BroadcastChannel(this.channelName);
            this.channel.onmessage = (e) => this.handleMessage(e.data);
        }
        
        // 获取或创建 audio 元素
        this.audio = document.getElementById('globalAudioPlayer') || document.getElementById('audioPlayer');
        if (!this.audio) {
            this.audio = document.createElement('audio');
            this.audio.id = 'globalAudioPlayer';
            document.body.appendChild(this.audio);
        }
        
        // 恢复状态
        this.restoreState();
        
        // 绑定 audio 事件
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        
        // 设置音量
        this.audio.volume = parseFloat(localStorage.getItem('life29-music-volume') || '0.7');
        
        // 非 Music 页面渲染迷你播放器
        if (!this.isMusicPage) {
            this.renderMiniPlayer();
        }
        
        // 页面卸载时保存状态
        window.addEventListener('beforeunload', () => this.saveState());
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'play':
                if (!this.isMusicPage) {
                    this.currentSong = data.song;
                    this.isPlaying = true;
                    this.updateMiniPlayer();
                }
                break;
            case 'pause':
                this.isPlaying = false;
                this.updateMiniPlayer();
                break;
            case 'stop':
                this.isPlaying = false;
                this.currentSong = null;
                this.updateMiniPlayer();
                break;
        }
    }
    
    broadcast(type, data = {}) {
        if (this.channel) {
            this.channel.postMessage({ type, ...data });
        }
    }
    
    restoreState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const state = JSON.parse(saved);
                this.currentSong = state.song;
                
                // 如果之前在播放，恢复状态
                if (state.song && state.isPlaying && this.isMusicPage) {
                    this.audio.src = state.song.file;
                    this.audio.currentTime = state.currentTime || 0;
                    // 自动播放需要用户交互
                } else if (state.song) {
                    this.isPlaying = state.isPlaying;
                }
                
                this.updateMiniPlayer();
            }
        } catch (e) {
            console.warn('Failed to restore music state:', e);
        }
    }
    
    saveState() {
        const state = {
            song: this.currentSong,
            isPlaying: this.isPlaying,
            currentTime: this.audio?.currentTime || 0,
            timestamp: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }
    
    play(song) {
        if (song) {
            this.currentSong = song;
            this.audio.src = song.file;
        }
        this.audio.play().catch(e => console.warn('Play failed:', e));
        this.broadcast('play', { song: this.currentSong });
    }
    
    pause() {
        this.audio.pause();
        this.broadcast('pause');
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
        window.dispatchEvent(new CustomEvent('music-ended'));
    }
    
    onTimeUpdate() {
        // 每5秒保存一次
        if (Math.floor(this.audio.currentTime) % 5 === 0) {
            this.saveState();
        }
    }
    
    renderMiniPlayer() {
        const existing = document.getElementById('miniMusicPlayer');
        if (existing) existing.remove();
        
        const mini = document.createElement('div');
        mini.id = 'miniMusicPlayer';
        mini.className = 'mini-music-player';
        mini.innerHTML = `
            <a href="music.html" class="mini-player-link">
                <span class="mini-player-note">𝄞</span>
                <span class="shimmer-text"></span>
            </a>
        `;
        document.body.appendChild(mini);
        
        this.updateMiniPlayer();
    }
    
    updateMiniPlayer() {
        const mini = document.getElementById('miniMusicPlayer');
        if (!mini) {
            if (this.currentSong && !this.isMusicPage) {
                this.renderMiniPlayer();
            }
            return;
        }
        
        const textEl = mini.querySelector('.shimmer-text');
        
        if (this.currentSong && this.isPlaying) {
            mini.classList.add('show', 'playing');
            textEl.textContent = this.currentSong.title;
        } else if (this.currentSong) {
            mini.classList.add('show');
            mini.classList.remove('playing');
            textEl.textContent = this.currentSong.title;
        } else {
            mini.classList.remove('show', 'playing');
        }
    }
    
    setVolume(value) {
        this.audio.volume = value;
        localStorage.setItem('life29-music-volume', value.toString());
    }
}

// 全局实例
window.globalMusicPlayer = new GlobalMusicPlayer();