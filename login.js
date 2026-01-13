// 安全验证模块 - 密码不以明文存储
const SecureAuth = (function() {
    // 简单的混淆验证 - 通过数学运算验证
    // 验证逻辑: 输入的四位数字相乘等于特定值，且满足特定条件
    const v = function(p) {
        if (p.length !== 4) return false;
        const d = p.split('').map(Number);
        // 9*5*2*9 = 810, 9+5+2+9 = 25, 第一位=第四位, 第三位最小
        const m = d[0] * d[1] * d[2] * d[3];
        const s = d[0] + d[1] + d[2] + d[3];
        return m === 810 && s === 25 && d[0] === d[3] && d[2] < d[0] && d[2] < d[1] && d[2] < d[3];
    };
    return { verify: v };
})();

// 视频配置
const VIDEO_CONFIG = [
    { id: 'video0', name: '金门大桥' },
    { id: 'video1', name: '乐高' },
    { id: 'video2', name: '花' },
    { id: 'video3', name: 'theater' },
    { id: 'video4', name: 'minisoda' }
];

// 状态管理
let currentVideoIndex = 0;
let selectedUser = null;
let isMuted = true;
let enteredPin = '';

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
function login(username, pin) {
    if (SecureAuth.verify(pin)) {
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

// 更新 PIN 圆点显示
function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('filled', index < enteredPin.length);
        dot.classList.remove('error');
    });
}

// PIN 错误动画
function showPinError() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach(dot => {
        dot.classList.add('error');
    });
    setTimeout(() => {
        enteredPin = '';
        updatePinDots();
    }, 400);
}

// 获取随机视频索引（排除当前视频）
function getRandomVideoIndex(excludeIndex) {
    const availableIndices = VIDEO_CONFIG
        .map((_, index) => index)
        .filter(index => index !== excludeIndex);
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
}

// 切换视频
function switchVideo(index) {
    const videos = document.querySelectorAll('.background-video');
    const videoName = document.getElementById('videoName');
    
    videos[currentVideoIndex].classList.remove('active');
    videos[currentVideoIndex].pause();
    
    currentVideoIndex = index;
    
    const newVideo = videos[currentVideoIndex];
    newVideo.currentTime = 0;
    newVideo.classList.add('active');
    newVideo.play().catch(e => console.log('Video play failed:', e));
    
    if (videoName) {
        videoName.style.opacity = '0';
        setTimeout(() => {
            videoName.textContent = VIDEO_CONFIG[currentVideoIndex].name;
            videoName.style.opacity = '1';
        }, 300);
    }
}

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    if (checkLoginStatus()) {
        return;
    }

    const videos = document.querySelectorAll('.background-video');
    const randomToggle = document.getElementById('randomToggle');
    const doorLogo = document.getElementById('doorLogo');
    const loginOverlay = document.getElementById('loginOverlay');
    const closeLogin = document.getElementById('closeLogin');
    const userBtns = document.querySelectorAll('.user-btn');
    const passwordContainer = document.getElementById('passwordContainer');
    const videoName = document.getElementById('videoName');
    const soundToggle = document.getElementById('soundToggle');
    const bgmAudio = document.getElementById('bgmAudio');
    const numKeys = document.querySelectorAll('.num-key');

    // 随机选择初始视频
    currentVideoIndex = Math.floor(Math.random() * VIDEO_CONFIG.length);
    
    // 初始化所有视频
    videos.forEach((video, index) => {
        video.classList.remove('active');
        video.load();
        
        if (index === currentVideoIndex) {
            video.classList.add('active');
            video.play().catch(e => console.log('Initial video play failed:', e));
        }
        
        video.addEventListener('ended', () => {
            if (index === currentVideoIndex) {
                const nextIndex = getRandomVideoIndex(currentVideoIndex);
                switchVideo(nextIndex);
            }
        });
    });
    
    if (videoName) {
        videoName.textContent = VIDEO_CONFIG[currentVideoIndex].name;
    }

    // 随机按钮点击
    if (randomToggle) {
        randomToggle.addEventListener('click', () => {
            const nextIndex = getRandomVideoIndex(currentVideoIndex);
            switchVideo(nextIndex);
        });
    }

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

    // 门 Logo 点击
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

    // 点击背景关闭
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
            enteredPin = '';
            updatePinDots();
        });
    });

    // 数字键盘点击
    numKeys.forEach(key => {
        key.addEventListener('click', () => {
            const num = key.dataset.num;
            const action = key.dataset.action;
            
            if (num !== undefined) {
                // 数字键
                if (enteredPin.length < 4) {
                    enteredPin += num;
                    updatePinDots();
                    
                    // 自动提交
                    if (enteredPin.length === 4) {
                        setTimeout(performLogin, 150);
                    }
                }
            } else if (action === 'clear') {
                // 清除
                enteredPin = '';
                updatePinDots();
            } else if (action === 'confirm') {
                // 确认
                performLogin();
            }
        });
    });

    // 重置登录表单
    function resetLoginForm() {
        userBtns.forEach(b => b.classList.remove('selected'));
        if (passwordContainer) passwordContainer.classList.remove('visible');
        enteredPin = '';
        updatePinDots();
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
        
        if (enteredPin.length !== 4) {
            showError('请输入4位密码');
            return;
        }

        if (login(selectedUser, enteredPin)) {
            window.location.href = 'index.html';
        } else {
            showPinError();
            showError('密码错误');
        }
    }

    // 键盘支持
    document.addEventListener('keydown', (e) => {
        if (loginOverlay && loginOverlay.classList.contains('visible')) {
            if (e.key === 'Escape') {
                loginOverlay.classList.remove('visible');
                resetLoginForm();
            } else if (passwordContainer.classList.contains('visible')) {
                if (e.key >= '0' && e.key <= '9' && enteredPin.length < 4) {
                    enteredPin += e.key;
                    updatePinDots();
                    if (enteredPin.length === 4) {
                        setTimeout(performLogin, 150);
                    }
                } else if (e.key === 'Backspace') {
                    enteredPin = enteredPin.slice(0, -1);
                    updatePinDots();
                } else if (e.key === 'Enter') {
                    performLogin();
                }
            }
        }
    });
});

// 导出函数
window.Life29Auth = {
    checkLoginStatus,
    login,
    logout,
    getCurrentUser
};
