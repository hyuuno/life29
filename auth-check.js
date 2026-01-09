// 认证检查脚本 - 在所有受保护页面中引入
(function() {
    'use strict';

    // 检查登录状态
    function checkAuth() {
        const isLoggedIn = sessionStorage.getItem('life29_logged_in');
        const currentUser = sessionStorage.getItem('life29_user');
        
        // 如果未登录，重定向到登录页
        if (isLoggedIn !== 'true' || !currentUser) {
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

    // 监听存储变化（用于多标签页同步）
    window.addEventListener('storage', function(e) {
        if (e.key === 'life29_logged_in' && e.newValue !== 'true') {
            window.location.href = 'login.html';
        }
    });

    // 定期检查会话
    setInterval(checkAuth, 60000);

})();
