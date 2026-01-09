// 登录凭证
const CREDENTIALS = {
    'wiwi': 'MyLittleFlower9529',
    'yuyu': 'MyLittleFlower9529'
};

// 视频配置 - 使用英文文件名避免编码问题
const VIDEO_CONFIG = [
    { id: 'video0', name: '金门大桥', file: 'jinmenbridge' },
    { id: 'video1', name: '乐高', file: 'lego' },
    { id: 'video2', name: '花', file: 'flower' },
    { id: 'video3', name: 'theater', file: 'theater' },
    { id: 'video4', name: 'minisoda', file: 'minisoda' }
];

// 状态管理
let currentVideoIndex = 0;
let selectedUser = null;
let currentZoom = 1;
const MIN_ZOOM = 1;  // 最小缩放为铺满屏幕
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;
let isMuted = true;

// 检查是否已登录
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('life29_logged_in');
    const currentUser = sessionStorage.getItem('life29_user');
    
    if (isLoggedIn === 'true' && currentUser) {
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
        return true;
    }
    return false;
}

// 登录函数
function login(username, password) {
    if (CREDENTIALS[username] && CREDENTIALS[username] === password) {
        sessionStorage.setItem('life29_logged_in', 'true');
        sessionStorage.setItem('life29_user', username);
        sessionStorage.setItem('life29_login_time', new Date().toISOString());
        return true;
    }
    return false;
}

// 登出函数
function logout() {
    sessionStorage.removeItem('life29_logged_in');
    sessionStorage.removeItem('life29_user');
    sessionStorage.removeItem('life29_login_time');
    window.location.href = 'login.html';
}

// 获取当前用户
function getCurrentUser() {
    return sessionStorage.getItem('life29_user');
}

// 显示错误消息
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 3000);
    }
}

// 获取随机视频索引（排除当前视频）
function getRandomVideoIndex(excludeIndex) {
    const availableIndices = VIDEO_CONFIG
        .map((_, index) => index)
        .filter(index => index !== excludeIndex);
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
}

// 更新视频尺寸和位置 - 优先铺满屏幕
function updateVideoSize() {
    const videos = document.querySelectorAll('.background-video');
    const videoContainer = document.getElementById('videoContainer');
    const activeVideo = videos[currentVideoIndex];
    
    if (!activeVideo || !activeVideo.videoWidth) return;
    
    const videoRatio = activeVideo.videoWidth / activeVideo.videoHeight;
    const windowRatio = window.innerWidth / window.innerHeight;
    
    let baseWidth, baseHeight;
    
    // 优先铺满屏幕 - 使用cover模式
    if (videoRatio > windowRatio) {
        // 视频更宽，以高度为基准铺满
        baseHeight = window.innerHeight;
        baseWidth = baseHeight * videoRatio;
    } else {
        // 视频更高，以宽度为基准铺满
        baseWidth = window.innerWidth;
        baseHeight = baseWidth / videoRatio;
    }
    
    // 应用缩放
    const width = baseWidth * currentZoom;
    const height = baseHeight * currentZoom;
    
    videos.forEach(video => {
        video.style.width = width + 'px';
        video.style.height = height + 'px';
    });
    
    if (videoContainer) {
        videoContainer.style.width = width + 'px';
        videoContainer.style.height = height + 'px';
    }
}

// 切换视频
function switchVideo(index) {
    const videos = document.querySelectorAll('.background-video');
    const videoName = document.getElementById('videoName');
    
    videos[currentVideoIndex].classList.remove('active');
    currentVideoIndex = index;
    videos[currentVideoIndex].classList.add('active');
    
    // 播放新视频
    videos[currentVideoIndex].currentTime = 0;
    videos[currentVideoIndex].play().catch(() => {});
    
    // 更新视频名称
    if (videoName) {
        videoName.style.opacity = '0';
        setTimeout(() => {
            videoName.textContent = VIDEO_CONFIG[currentVideoIndex].name;
            videoName.style.opacity = '1';
        }, 300);
    }
    
    // 重置缩放
    currentZoom = 1;
    
    // 更新尺寸
    setTimeout(updateVideoSize, 100);
}

// 缩放视频
function zoomVideo(delta) {
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
    updateVideoSize();
}

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    if (checkLoginStatus()) {
        return;
    }

    // DOM 元素
    const videos = document.querySelectorAll('.background-video');
    const randomToggle = document.getElementById('randomToggle');
    const doorLogo = document.getElementById('doorLogo');
    const loginOverlay = document.getElementById('loginOverlay');
    const closeLogin = document.getElementById('closeLogin');
    const userBtns = document.querySelectorAll('.user-btn');
    const passwordContainer = document.getElementById('passwordContainer');
    const passwordInput = document.getElementById('passwordInput');
    const videoName = document.getElementById('videoName');
    const soundToggle = document.getElementById('soundToggle');
    const bgmAudio = document.getElementById('bgmAudio');

    // 随机选择初始视频
    currentVideoIndex = Math.floor(Math.random() * VIDEO_CONFIG.length);
    videos.forEach((video, index) => {
        video.classList.remove('active');
        if (index === currentVideoIndex) {
            video.classList.add('active');
            video.play().catch(() => {});
        }
    });
    
    // 设置初始视频名称
    if (videoName) {
        videoName.textContent = VIDEO_CONFIG[currentVideoIndex].name;
    }

    // 视频加载后更新尺寸
    videos.forEach((video, index) => {
        video.addEventListener('loadedmetadata', () => {
            if (index === currentVideoIndex) {
                updateVideoSize();
            }
        });
        
        // 视频结束时随机切换
        video.addEventListener('ended', () => {
            if (index === currentVideoIndex) {
                const nextIndex = getRandomVideoIndex(currentVideoIndex);
                switchVideo(nextIndex);
            }
        });
    });

    // 随机按钮点击 - 随机切换视频
    if (randomToggle) {
        randomToggle.addEventListener('click', () => {
            const nextIndex = getRandomVideoIndex(currentVideoIndex);
            switchVideo(nextIndex);
        });
    }

    // 滚轮缩放
    document.addEventListener('wheel', (e) => {
        if (loginOverlay && loginOverlay.classList.contains('visible')) return;
        e.preventDefault();
        zoomVideo(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
    }, { passive: false });

    // 声音控制
    if (soundToggle && bgmAudio) {
        soundToggle.addEventListener('click', () => {
            isMuted = !isMuted;
            soundToggle.classList.toggle('muted', isMuted);
            
            if (isMuted) {
                bgmAudio.pause();
            } else {
                bgmAudio.volume = 0.3;
                bgmAudio.play().catch(() => {});
            }
        });
    }

    // 门 Logo 点击 - 打开登录界面
    if (doorLogo) {
        doorLogo.addEventListener('click', () => {
            loginOverlay.classList.add('visible');
        });
    }

    // 关闭登录界面
    if (closeLogin) {
        closeLogin.addEventListener('click', () => {
            loginOverlay.classList.remove('visible');
            resetLoginForm();
        });
    }

    // 点击背景关闭登录界面
    if (loginOverlay) {
        loginOverlay.addEventListener('click', (e) => {
            if (e.target === loginOverlay) {
                loginOverlay.classList.remove('visible');
                resetLoginForm();
            }
        });
    }

    // 用户选择
    userBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            userBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedUser = btn.dataset.user;
            
            passwordContainer.classList.add('visible');
            setTimeout(() => {
                passwordInput.focus();
            }, 100);
        });
    });

    // 密码输入回车登录
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performLogin();
            }
        });
    }

    // 重置登录表单
    function resetLoginForm() {
        userBtns.forEach(b => b.classList.remove('selected'));
        if (passwordContainer) passwordContainer.classList.remove('visible');
        if (passwordInput) passwordInput.value = '';
        selectedUser = null;
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) errorDiv.classList.remove('show');
    }

    // 执行登录
    function performLogin() {
        if (!selectedUser) {
            showError('请先选择用户');
            return;
        }
        
        if (!passwordInput.value) {
            showError('请输入密码');
            return;
        }

        if (login(selectedUser, passwordInput.value)) {
            // 登录成功，直接跳转
            window.location.href = 'index.html';
        } else {
            showError('密码错误');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    // ESC 键关闭登录界面
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginOverlay && loginOverlay.classList.contains('visible')) {
            loginOverlay.classList.remove('visible');
            resetLoginForm();
        }
    });

    // 窗口大小改变时更新
    window.addEventListener('resize', updateVideoSize);
    
    // 初始化尺寸
    setTimeout(updateVideoSize, 500);
});

// 导出函数供其他页面使用
window.Life29Auth = {
    checkLoginStatus,
    login,
    logout,
    getCurrentUser
};
