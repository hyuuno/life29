// 安全验证模块
const SecureAuth = (function() {
    const v = function(p) {
        if (p.length !== 4) return false;
        const d = p.split('').map(Number);
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

// 状态
let currentVideoIndex = 0;
let selectedUser = null;
let isMuted = true;
let enteredPin = '';

// ── 登录状态 ──────────────────────────────────────────
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

function login(username, pin) {
    if (SecureAuth.verify(pin)) {
        sessionStorage.setItem('life29_logged_in', 'true');
        sessionStorage.setItem('life29_user', username);
        sessionStorage.setItem('life29_login_time', new Date().toISOString());
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem('life29_logged_in');
    sessionStorage.removeItem('life29_user');
    sessionStorage.removeItem('life29_login_time');
    window.location.href = 'login.html';
}

function getCurrentUser() {
    return sessionStorage.getItem('life29_user');
}

// ── 错误 / PIN ────────────────────────────────────────
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 3000);
    }
}

function updatePinDots() {
    document.querySelectorAll('.pin-dot').forEach((dot, i) => {
        dot.classList.toggle('filled', i < enteredPin.length);
        dot.classList.remove('error');
    });
}

function showPinError() {
    document.querySelectorAll('.pin-dot').forEach(dot => dot.classList.add('error'));
    setTimeout(() => { enteredPin = ''; updatePinDots(); }, 400);
}

// ── 随机索引 ──────────────────────────────────────────
function getRandomVideoIndex(excludeIndex) {
    const pool = VIDEO_CONFIG.map((_, i) => i).filter(i => i !== excludeIndex);
    return pool[Math.floor(Math.random() * pool.length)];
}

// ── HUD 时钟 ─────────────────────────────────────────
function startHudClock() {
    const hudTime = document.getElementById('hudTime');
    const hudDate = document.getElementById('hudDate');
    if (!hudTime || !hudDate) return;

    function tick() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        hudTime.textContent = `${h}:${m}:${s}`;

        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const d  = String(now.getDate()).padStart(2, '0');
        const y  = now.getFullYear();
        hudDate.textContent = `${mo}/${d}/${y}`;
    }
    tick();
    setInterval(tick, 1000);
}

// ── 核心：切换视频（同时切换屏幕视频 + 模糊背景视频） ──
function switchVideo(index) {
    const scrVideos = document.querySelectorAll('.screen-video');
    const bgVideos  = document.querySelectorAll('.blur-video');
    const videoName = document.getElementById('videoName');
    const hudLabel  = document.getElementById('hudLabel');

    // 1. 退出当前视频
    const prevScr = scrVideos[currentVideoIndex];
    const prevBg  = bgVideos[currentVideoIndex];

    prevScr.classList.remove('active');
    prevBg.classList.remove('active');

    setTimeout(() => {
        prevScr.pause();
        prevBg.pause();
    }, 1200);

    // 2. 切入新视频
    currentVideoIndex = index;

    const newScr = scrVideos[currentVideoIndex];
    const newBg  = bgVideos[currentVideoIndex];

    // 重置到同一时间点，保持同步
    newScr.currentTime = 0;
    newBg.currentTime  = 0;

    newScr.classList.add('active');
    newBg.classList.add('active');

    newScr.play().catch(() => {});
    newBg.play().catch(() => {});

    // 3. 更新标签
    const name = VIDEO_CONFIG[currentVideoIndex].name;
    if (videoName) {
        videoName.style.opacity = '0';
        setTimeout(() => { videoName.textContent = name; videoName.style.opacity = '1'; }, 300);
    }
    if (hudLabel) hudLabel.textContent = name;
}

// ── DOM 加载完成 ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    if (checkLoginStatus()) return;

    const scrVideos       = document.querySelectorAll('.screen-video');
    const bgVideos        = document.querySelectorAll('.blur-video');
    const randomToggle    = document.getElementById('randomToggle');
    const doorLogo        = document.getElementById('doorLogo');
    const loginOverlay    = document.getElementById('loginOverlay');
    const closeLogin      = document.getElementById('closeLogin');
    const userBtns        = document.querySelectorAll('.user-btn');
    const passwordContainer = document.getElementById('passwordContainer');
    const videoName       = document.getElementById('videoName');
    const soundToggle     = document.getElementById('soundToggle');
    const bgmAudio        = document.getElementById('bgmAudio');
    const numKeys         = document.querySelectorAll('.num-key');
    const hudLabel        = document.getElementById('hudLabel');

    // 随机初始视频
    currentVideoIndex = Math.floor(Math.random() * VIDEO_CONFIG.length);

    // 初始化所有视频
    scrVideos.forEach((vid, i) => {
        vid.classList.remove('active');
        vid.load();
        if (i === currentVideoIndex) {
            vid.classList.add('active');
            vid.play().catch(() => {});
        }
        // 视频播完 -> 随机切换
        vid.addEventListener('ended', () => {
            if (i === currentVideoIndex) switchVideo(getRandomVideoIndex(currentVideoIndex));
        });
    });

    bgVideos.forEach((vid, i) => {
        vid.classList.remove('active');
        vid.load();
        if (i === currentVideoIndex) {
            vid.classList.add('active');
            vid.play().catch(() => {});
        }
    });

    // 更新标签
    const initialName = VIDEO_CONFIG[currentVideoIndex].name;
    if (videoName)  videoName.textContent  = initialName;
    if (hudLabel)   hudLabel.textContent   = initialName;

    // 启动 HUD 时钟
    startHudClock();

    // ── 随机切换按钮 ──
    randomToggle?.addEventListener('click', () => {
        switchVideo(getRandomVideoIndex(currentVideoIndex));
    });

    // ── 声音控制 ──
    soundToggle?.addEventListener('click', () => {
        isMuted = !isMuted;
        soundToggle.classList.toggle('muted', isMuted);
        if (isMuted) {
            bgmAudio?.pause();
        } else {
            if (bgmAudio) { bgmAudio.volume = 0.3; bgmAudio.play().catch(() => {}); }
        }
    });

    // ── 门 Logo → 打开登录 ──
    doorLogo?.addEventListener('click', () => loginOverlay.classList.add('visible'));

    // ── 关闭登录 ──
    closeLogin?.addEventListener('click', () => {
        loginOverlay.classList.remove('visible');
        resetLoginForm();
    });

    loginOverlay?.addEventListener('click', (e) => {
        if (e.target === loginOverlay) {
            loginOverlay.classList.remove('visible');
            resetLoginForm();
        }
    });

    // ── 用户选择 ──
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

    // ── 数字键盘 ──
    numKeys.forEach(key => {
        key.addEventListener('click', () => {
            const num    = key.dataset.num;
            const action = key.dataset.action;
            if (num !== undefined) {
                if (enteredPin.length < 4) {
                    enteredPin += num;
                    updatePinDots();
                    if (enteredPin.length === 4) setTimeout(performLogin, 150);
                }
            } else if (action === 'clear') {
                enteredPin = '';
                updatePinDots();
            } else if (action === 'confirm') {
                performLogin();
            }
        });
    });

    // ── 重置表单 ──
    function resetLoginForm() {
        userBtns.forEach(b => b.classList.remove('selected'));
        passwordContainer?.classList.remove('visible');
        enteredPin = '';
        updatePinDots();
        selectedUser = null;
        document.getElementById('errorMessage')?.classList.remove('show');
    }

    // ── 执行登录 ──
    function performLogin() {
        if (!selectedUser) { showError('请先选择用户'); return; }
        if (enteredPin.length !== 4) { showError('请输入4位密码'); return; }
        if (login(selectedUser, enteredPin)) {
            window.location.href = 'index.html';
        } else {
            showPinError();
            showError('密码错误');
        }
    }

    // ── 键盘支持 ──
    document.addEventListener('keydown', (e) => {
        if (!loginOverlay?.classList.contains('visible')) return;
        if (e.key === 'Escape') {
            loginOverlay.classList.remove('visible');
            resetLoginForm();
        } else if (passwordContainer.classList.contains('visible')) {
            if (e.key >= '0' && e.key <= '9' && enteredPin.length < 4) {
                enteredPin += e.key;
                updatePinDots();
                if (enteredPin.length === 4) setTimeout(performLogin, 150);
            } else if (e.key === 'Backspace') {
                enteredPin = enteredPin.slice(0, -1);
                updatePinDots();
            } else if (e.key === 'Enter') {
                performLogin();
            }
        }
    });
});

// 导出
window.Life29Auth = { checkLoginStatus, login, logout, getCurrentUser };
