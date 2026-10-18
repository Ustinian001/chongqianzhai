(function () {
  // 年份
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // 主题切换
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');

  function syncThemeIcon() {
    if (!themeBtn) return;
    themeBtn.textContent = root.getAttribute('data-theme') === 'light' ? '☀️' : '🌙';
  }
  syncThemeIcon();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeIcon();
    });
  }

  // 移动端菜单
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') navLinks.classList.remove('open');
    });
  }

  // 滚动出现
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
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