// 认证检查脚本 - 在所有受保护页面中引入
(function() {
    'use strict';

    // 检查登录状态
    function checkAuth() {
        const isLoggedIn = sessionStorage.getItem('life29_logged_in');
        const currentUser = sessionStorage.getItem('life29_user');
        
        // 如果未登录，重定向到登录页
        if (isLoggedIn !== 'true' || !currentUser) {
            // 保存当前页面URL，登录后可以返回
            sessionStorage.setItem('life29_redirect_url', window.location.href);
            window.location.href = 'login.html';
            return false;
        }
        
        return true;
    }

    // 页面加载时立即检查
    if (!checkAuth()) {
        return;
    }

    // 添加登出功能到页面
    function addLogoutButton() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', insertLogoutUI);
        } else {
            insertLogoutUI();
        }
    }

    function insertLogoutUI() {
        const currentUser = sessionStorage.getItem('life29_user');
        const userName = currentUser === 'wiwi' ? 'Wiwi' : 'Yuyu';
        
        // 创建用户信息和登出按钮
        const userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'life29-user-info';
        userInfoDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 12px 20px;
            border-radius: 30px;
            box-shadow: 0 4px 20px rgba(251, 111, 146, 0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            transition: all 0.3s ease;
        `;

        userInfoDiv.innerHTML = `
            <span style="
                font-size: 14px;
                font-weight: 600;
                color: #FF8FAB;
                display: flex;
                align-items: center;
                gap: 6px;
            ">
                ${currentUser === 'wiwi' ? '🌸' : '🌺'} ${userName}
            </span>
            <button id="life29-logout-btn" style="
                background: linear-gradient(135deg, #FF8FAB, #FB6F92);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(251, 111, 146, 0.3);
            ">
                登出
            </button>
        `;

        document.body.appendChild(userInfoDiv);

        // 登出按钮事件
        const logoutBtn = document.getElementById('life29-logout-btn');
        logoutBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 12px rgba(251, 111, 146, 0.4)';
        });

        logoutBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(251, 111, 146, 0.3)';
        });

        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要登出吗？')) {
                sessionStorage.removeItem('life29_logged_in');
                sessionStorage.removeItem('life29_user');
                sessionStorage.removeItem('life29_login_time');
                sessionStorage.removeItem('life29_redirect_url');
                window.location.href = 'login.html';
            }
        });

        // 悬停效果
        userInfoDiv.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });

        userInfoDiv.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }

    // 添加登出按钮
    addLogoutButton();

    // 监听存储变化（用于多标签页同步）
    window.addEventListener('storage', function(e) {
        if (e.key === 'life29_logged_in' && e.newValue !== 'true') {
            window.location.href = 'login.html';
        }
    });

    // 定期检查会话（可选，用于额外的安全性）
    setInterval(checkAuth, 60000); // 每分钟检查一次

})();
