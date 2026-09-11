(function () {
  // 年份
  document.getElementById('year').textContent = String(new Date().getFullYear());

  // 主题切换
  let root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');

  function syncThemeIcon() {
    themeBtn.textContent = root.getAttribute('data-theme') === 'light' ? '☀️' : '🌙';
  }
  syncThemeIcon();
  themeBtn.addEventListener('click', function () {
    let next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeIcon();
  });

  // 移动端菜单
  let menuBtn = document.getElementById('menuBtn');
  let navLinks = document.getElementById('navLinks');
  menuBtn.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') navLinks.classList.remove('open');
  });

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
    }, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('visible'); });
  }
})();