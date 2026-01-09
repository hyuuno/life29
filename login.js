// 登录凭证
const CREDENTIALS = {
    'wiwi': 'MyLittleFlower9529',
    'yuyu': 'MyLittleFlower9529'
};

// 检查是否已登录
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('life29_logged_in');
    const currentUser = sessionStorage.getItem('life29_user');
    
    if (isLoggedIn === 'true' && currentUser) {
        // 如果在登录页面且已登录，重定向到主页
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
        // 登录成功
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
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 3000);
}

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    if (checkLoginStatus()) {
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const usernameSelect = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // 表单提交事件
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = usernameSelect.value;
        const password = passwordInput.value;

        // 验证输入
        if (!username) {
            showError('请选择用户 💕');
            usernameSelect.focus();
            return;
        }

        if (!password) {
            showError('请输入密码 🔒');
            passwordInput.focus();
            return;
        }

        // 验证登录
        if (login(username, password)) {
            // 登录成功，添加成功动画
            const loginButton = document.querySelector('.login-button');
            loginButton.innerHTML = '<span class="button-text">✨ 登录成功！</span>';
            loginButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            
            // 延迟跳转，让用户看到成功消息
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        } else {
            // 登录失败
            showError('密码错误，请重试 😢');
            passwordInput.value = '';
            passwordInput.focus();
            
            // 添加抖动效果
            loginForm.style.animation = 'none';
            setTimeout(() => {
                loginForm.style.animation = '';
            }, 10);
        }
    });

    // 输入框焦点效果
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.transition = 'transform 0.3s ease';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    // Enter键快速登录
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});

// 导出函数供其他页面使用
window.Life29Auth = {
    checkLoginStatus,
    login,
    logout,
    getCurrentUser
};
