(function () {
    // 1. 自动更新页脚年份
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // 2. 主题切换（白天/黑夜）与本地存储同步
    const root = document.documentElement;
    const themeBtn = document.getElementById('themeBtn');

    function syncThemeIcon() {
        if (!themeBtn) return;
        // 根据当前的 data-theme 属性设置按钮图标
        themeBtn.textContent = root.getAttribute('data-theme') === 'light' ? '☀️' : '🌙';
    }

    // 页面加载时同步一次图标
    syncThemeIcon();

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            // 判断当前主题并取反
            const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            // 更新 HTML 属性
            root.setAttribute('data-theme', next);
            // 存入浏览器本地存储（关键：实现跨页面同步）
            try { localStorage.setItem('theme', next); } catch (e) {}
            // 更新按钮图标
            syncThemeIcon();
        });
    }

    // 3. 移动端菜单折叠/展开
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function () {
            navLinks.classList.toggle('open');
        });
        // 点击菜单里的链接后，自动收起菜单
        navLinks.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') navLinks.classList.remove('open');
        });
    }

    // 4. 滚动出现动画（IntersectionObserver）
    const items = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target); // 动画执行一次后停止观察，提升性能
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        items.forEach(function (el) { io.observe(el); });
    } else {
        // 兼容不支持 IntersectionObserver 的旧浏览器
        items.forEach(function (el) { el.classList.add('visible'); });
    }
})();

/* ---------- 基础防护：右键 / F12 / 查看源码 / 另存图片 ----------
   纯前端做不到真正禁止：源码、图片最终都要下载到浏览器，懂行的人照样能拿到。
   这里只是把最常见的手势和快捷键挡掉，日常浏览不受影响。 */
(function () {
    function stop(e) {
        e.preventDefault();
        return false;
    }

    // 右键菜单（含「图片另存为」）
    document.addEventListener('contextmenu', stop, { passive: false });

    // 拖拽图片到桌面/其他窗口
    document.addEventListener('dragstart', function (e) {
        if (e.target && e.target.tagName === 'IMG') stop(e);
    });

    // 选中文字/图片（配合 CSS 的 user-select: none）
    document.addEventListener('selectstart', function (e) {
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
        stop(e);
    });

    // F12、Ctrl+Shift+I/J/C/K（开发者工具）、Ctrl+U（查看源码）、Ctrl+S（保存网页）
    document.addEventListener('keydown', function (e) {
        var key = String(e.key || '').toLowerCase();
        var mod = e.ctrlKey || e.metaKey;

        if (key === 'f12') return stop(e);
        if (mod && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) return stop(e);
        if (mod && !e.shiftKey && !e.altKey && (key === 'u' || key === 's')) return stop(e);
    }, true);
})();