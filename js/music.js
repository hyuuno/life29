/**
 * Life29 - 音乐播放器
 * 支持云端和本地音乐文件
 */

class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isMuted = false;
        
        this.playerEl = document.getElementById('musicPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.songTitle = document.getElementById('songTitle');
        this.songTime = document.getElementById('songTime');
        
        if (this.audio && this.playerEl) this.init();
    }
    
    async init() {
        await this.loadPlaylist();
        this.bindEvents();
        this.audio.volume = this.volumeSlider ? this.volumeSlider.value / 100 : 0.5;
    }
    
    async loadPlaylist() {
        // 优先从云端加载
        if (window.supabaseService) {
            try {
                const isConnected = await window.supabaseService.init();
                if (isConnected) {
                    const cloudSongs = await window.supabaseService.getMusicList();
                    this.playlist = cloudSongs.map(s => ({
                        id: s.id,
                        title: s.music_name,
                        file: s.file_url
                    }));
                    console.log(`☁️ Mini player loaded ${this.playlist.length} songs from cloud`);
                    return;
                }
            } catch (e) {
                console.warn('Cloud load failed, falling back to local:', e);
            }
        }
        
        // 本地备用
        try {
            const response = await fetch(CONFIG.storage.musicFile);
            if (response.ok) {
                const data = await response.json();
                // 支持新旧格式
                if (Array.isArray(data)) {
                    this.playlist = data.map(s => ({
                        id: s.id,
                        title: s.title,
                        file: s.filename ? `music/${s.filename}` : s.file
                    }));
                } else if (data.songs) {
                    this.playlist = data.songs.map(s => ({
                        id: s.id,
                        title: s.title,
                        file: s.file
                    }));
                }
            }
            console.log(`📁 Mini player loaded ${this.playlist.length} songs locally`);
        } catch (error) {
            console.warn('Failed to load playlist:', error);
            this.playlist = [];
        }
    }
    
    bindEvents() {
        this.playPauseBtn?.addEventListener('click', () => this.togglePlay());
        this.shuffleBtn?.addEventListener('click', () => this.playRandom());
        this.volumeBtn?.addEventListener('click', () => this.toggleMute());
        this.volumeSlider?.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        if (this.audio) {
            this.audio.addEventListener('timeupdate', () => this.updateTime());
            this.audio.addEventListener('ended', () => this.playRandom());
            this.audio.addEventListener('play', () => this.onPlay());
            this.audio.addEventListener('pause', () => this.onPause());
        }
    }
    
    togglePlay() {
        if (this.playlist.length === 0) return;
        if (this.currentIndex === -1) this.playRandom();
        else if (this.isPlaying) this.audio.pause();
        else this.audio.play().catch(() => {});
    }
    
    playRandom() {
        if (this.playlist.length === 0) return;
        
        let newIndex;
        if (this.playlist.length === 1) newIndex = 0;
        else do { newIndex = Math.floor(Math.random() * this.playlist.length); } while (newIndex === this.currentIndex);
        
        this.currentIndex = newIndex;
        const song = this.playlist[this.currentIndex];
        this.audio.src = song.file;
        if (this.songTitle) this.songTitle.textContent = song.title;
        
        this.audio.play().catch(() => {
            if (this.songTitle) this.songTitle.textContent = '点击播放';
        });
    }
    
    setVolume(value) {
        const volume = value / 100;
        this.audio.volume = volume;
        if (this.volumeBtn) {
            this.volumeBtn.classList.toggle('muted', volume === 0);
            if (volume > 0) this.isMuted = false;
        }
    }
    
    toggleMute() {
        if (this.isMuted) {
            this.audio.volume = this.volumeSlider ? this.volumeSlider.value / 100 : 0.5;
            this.volumeBtn?.classList.remove('muted');
        } else {
            this.audio.volume = 0;
            this.volumeBtn?.classList.add('muted');
        }
        this.isMuted = !this.isMuted;
    }
    
    updateTime() {
        if (this.audio.duration && this.songTime) {
            const remaining = this.audio.duration - this.audio.currentTime;
            const mins = Math.floor(remaining / 60);
            const secs = Math.floor(remaining % 60);
            this.songTime.textContent = `-${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        this.playerEl?.classList.add('playing');
    }
    
    onPause() {
        this.isPlaying = false;
        this.playerEl?.classList.remove('playing');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();
});