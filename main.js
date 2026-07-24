/* Papyr — site behaviour.
   Routing, header state, mobile nav, FAQ accordions, scroll reveals.
   No dependencies. */
(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var body = document.body;

  /* Route name -> { id, path, title } */
  var ROUTES = {
    landing: { id: 'page-landing', path: '/',        title: 'Papyr — A calm, private place for your words' },
    support: { id: 'page-support', path: '/support', title: 'Support — Papyr' },
    terms:   { id: 'page-terms',   path: '/terms',   title: 'Terms of Service — Papyr' },
    privacy: { id: 'page-privacy', path: '/privacy', title: 'Privacy Policy — Papyr' }
  };

  function routeFromPath(pathname) {
    var clean = (pathname || '/').replace(/\/+$/, '') || '/';
    for (var name in ROUTES) {
      if (ROUTES[name].path === clean) return name;
    }
    return 'landing';
  }

  function currentPage() { return body.getAttribute('data-page') || 'landing'; }

  /* ---------- header ---------- */
  var ticking = false;
  function updateHeader() {
    var solid = (window.scrollY || document.documentElement.scrollTop) > 24 || currentPage() !== 'landing';
    header.classList.toggle('solid', solid);
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateHeader); }
  }

  /* ---------- mobile nav ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  function setNav(open) {
    body.classList.toggle('nav-open', open);
    if (navToggle) navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () { setNav(!body.classList.contains('nav-open')); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) {
      setNav(false);
      if (navToggle) navToggle.focus();
    }
  });

  /* ---------- routing ---------- */
  function showPage(name, opts) {
    opts = opts || {};
    if (!ROUTES[name]) name = 'landing';
    body.setAttribute('data-page', name);
    for (var key in ROUTES) {
      document.getElementById(ROUTES[key].id).classList.toggle('active', key === name);
    }
    document.title = ROUTES[name].title;
    setNav(false);

    if (opts.push) {
      history.pushState({ page: name }, '', ROUTES[name].path);
    } else if (opts.replace) {
      history.replaceState({ page: name }, '', ROUTES[name].path);
    }
    if (!opts.keepScroll) window.scrollTo(0, 0);
    updateHeader();
    observeReveal();
  }

  function goAnchor(id) {
    function doScroll(attempt) {
      var el = document.getElementById(id);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 66, behavior: 'smooth' });
      } else if ((attempt || 0) < 10) {
        setTimeout(function () { doScroll((attempt || 0) + 1); }, 60);
      }
    }
    if (currentPage() !== 'landing') {
      showPage('landing', { push: true });
      setTimeout(function () { doScroll(0); }, 60);
    } else {
      setNav(false);
      doScroll(0);
    }
  }

  document.addEventListener('click', function (e) {
    var navEl = e.target.closest('[data-nav]');
    if (navEl) { e.preventDefault(); showPage(navEl.getAttribute('data-nav'), { push: true }); return; }
    var anchorEl = e.target.closest('[data-anchor]');
    if (anchorEl) { e.preventDefault(); goAnchor(anchorEl.getAttribute('data-anchor')); }
  });

  window.addEventListener('popstate', function (e) {
    var name = (e.state && e.state.page) || routeFromPath(location.pathname);
    showPage(name, { keepScroll: false });
  });

  /* ---------- FAQ ---------- */
  /* Animates real height (measured from scrollHeight) so long answers can't clip. */
  document.querySelectorAll('[data-faq]').forEach(function (list) {
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.faq-q');
      if (!btn) return;
      var item = btn.parentElement;
      var panel = item.querySelector('.faq-a');
      var willOpen = !item.classList.contains('open');

      list.querySelectorAll('.faq-item').forEach(function (it) {
        it.classList.remove('open');
        it.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        it.querySelector('.faq-a').style.setProperty('--h', '0px');
      });

      if (willOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.setProperty('--h', panel.scrollHeight + 'px');
      }
    });
  });

  /* ---------- scroll reveals ---------- */
  var io = null;
  function observeReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.io').forEach(function (el) { el.classList.add('seen'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('seen'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px' });
    }
    document.querySelectorAll('.io:not(.seen)').forEach(function (el) { io.observe(el); });
  }

  /* ---------- init ---------- */
  window.addEventListener('scroll', onScroll, { passive: true });
  document.getElementById('year').textContent = new Date().getFullYear();
  showPage(routeFromPath(location.pathname), { replace: true, keepScroll: true });
})();
