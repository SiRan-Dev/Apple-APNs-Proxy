(function () {
  'use strict';

  var root = document.documentElement;
  var themeButton = document.querySelector('.theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var toast = document.getElementById('toast');
  var progressBar = document.getElementById('read-progress');
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc nav a'));
  var toastTimer;

  /* Theme ------------------------------------------------------ */

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#0e0f11' : '#f3f1eb');
    }
    if (themeButton) {
      var isDark = theme === 'dark';
      themeButton.setAttribute('aria-pressed', String(isDark));
      themeButton.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
    }
  }

  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('apns-theme', next);
      } catch (e) {}
    });
  }

  /* Reading progress ------------------------------------------- */

  function updateProgress() {
    if (!progressBar) return;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var value = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = Math.min(100, Math.max(0, value)).toFixed(2) + '%';
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateProgress();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateProgress();

  /* Copy buttons ----------------------------------------------- */

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  function showToast(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 1900);
  }

  document.querySelectorAll('.copy-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      var text = button.getAttribute('data-copy') || '';
      var label = button.textContent;

      function done(ok) {
        if (!ok) {
          showToast('复制失败，请手动选择文本');
          return;
        }
        button.textContent = '已复制';
        button.classList.add('is-copied');
        showToast('已复制到剪贴板');
        window.setTimeout(function () {
          button.textContent = label;
          button.classList.remove('is-copied');
        }, 1700);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          done(true);
        }).catch(function () {
          done(fallbackCopy(text));
        });
      } else {
        done(fallbackCopy(text));
      }
    });
  });

  /* TOC active state ------------------------------------------- */

  if (tocLinks.length && 'IntersectionObserver' in window) {
    var linkByTarget = {};
    tocLinks.forEach(function (link) {
      linkByTarget[link.getAttribute('href').slice(1)] = link;
    });

    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible.add(entry.target.id);
        } else {
          visible.delete(entry.target.id);
        }
      });

      var activeId = null;
      for (var i = 0; i < tocLinks.length; i += 1) {
        var id = tocLinks[i].getAttribute('href').slice(1);
        if (visible.has(id)) {
          activeId = id;
          break;
        }
      }

      tocLinks.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href').slice(1) === activeId);
      });
    }, {
      rootMargin: '-18% 0px -66% 0px',
      threshold: 0
    });

    Object.keys(linkByTarget).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }
}());
