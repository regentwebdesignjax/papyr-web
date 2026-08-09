/* Papyr — scroll choreography.
 *
 * Loaded after main.js. Everything here is progressive enhancement: main.js
 * already renders a complete, readable page, and every effect below is set up
 * inside a gsap.matchMedia() scope so it is torn down cleanly on resize and
 * never registered at all under prefers-reduced-motion.
 */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  var mm = gsap.matchMedia();
  var REDUCED = '(prefers-reduced-motion: reduce)';
  var OK = '(prefers-reduced-motion: no-preference)';

  /* ---------------- split-text reveals ---------------- */
  /* Lines rise out of an overflow-hidden mask. Falls back to a simple fade if
     SplitText is unavailable so headings still animate in. */
  function setupSplit(scope) {
    gsap.utils.toArray('[data-split]').forEach(function (el) {
      var target = el;
      var animate;

      if (window.SplitText) {
        var split = new window.SplitText(el, {
          type: 'lines',
          linesClass: 'sx-line',
          mask: 'lines',
        });
        el.classList.add('is-split');
        animate = split.lines;
      } else {
        el.classList.add('is-split');
        animate = [el];
      }

      gsap.from(animate, {
        yPercent: 115,
        opacity: 0,
        duration: 1.05,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    gsap.utils.toArray('[data-split-words]').forEach(function (el) {
      var animate;
      if (window.SplitText) {
        var split = new window.SplitText(el, { type: 'words', wordsClass: 'sx-word' });
        animate = split.words;
      } else {
        animate = [el];
      }
      el.classList.add('is-split');
      gsap.from(animate, {
        opacity: 0.12,
        duration: 0.6,
        ease: 'none',
        stagger: 0.12,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true },
      });
    });
  }

  /* ---------------- hero ---------------- */
  function setupHero(scope, allowGL) {
    var section = document.querySelector('.hero-x');
    var canvas = document.querySelector('[data-hero-canvas]');
    var fallback = document.querySelector('[data-hero-fallback]');
    if (!section || !canvas) return;

    var handle = null;
    var progress = { v: 0 };

    // Drive either the shader or the CSS cross-fade from the same value.
    function apply(v) {
      progress.v = v;
      if (handle) handle.setProgress(v);
      else if (fallback) fallback.style.setProperty('--t', v.toFixed(4));
    }

    gsap.to(progress, {
      v: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: function (self) { apply(self.progress); },
      },
    });

    if (!allowGL) return;

    // WebGL2 only, and only once the browser is idle — never blocks first paint.
    var gl = null;
    try { gl = canvas.getContext('webgl2'); } catch (e) { gl = null; }
    if (!gl) return;

    var start = function () {
      import('./hero-gl.js')
        .then(function (m) {
          return m.initHero(canvas, {
            imageA: 'assets/photos/laptop-001-1440.webp',
            imageB: 'assets/photos/notebook-002-1440.webp',
            displacement: 'assets/paper-texture.webp',
          });
        })
        .then(function (h) {
          handle = h;
          handle.setProgress(progress.v);
          canvas.classList.add('is-live');
        })
        .catch(function () {
          /* Keep the CSS fallback. Nothing to do. */
        });
    };

    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2500 });
    else setTimeout(start, 1200);
  }

  /* ---------------- pinned horizontal feature rail ---------------- */
  function setupRail() {
    var rail = document.querySelector('[data-rail]');
    var track = document.querySelector('[data-rail-track]');
    var bar = document.querySelector('[data-rail-bar]');
    if (!rail || !track) return;

    // Distance the track must travel for its last panel to reach the right edge.
    var distance = function () {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    };

    gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: rail,
        start: 'top top',
        end: function () { return '+=' + distance(); },
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (bar) bar.style.setProperty('--p', self.progress.toFixed(4));
        },
      },
    });
  }

  /* ---------------- privacy redaction ---------------- */
  /* The sample entry blurs away and the padlock fades in — the lock feature,
     demonstrated instead of described. */
  function setupRedaction() {
    var fig = document.querySelector('[data-redact]');
    if (!fig) return;
    var page = fig.querySelector('.redact-page');
    var lock = fig.querySelector('.redact-lock');
    var label = fig.querySelector('[data-redact-label]');
    var locked = false;

    ScrollTrigger.create({
      trigger: fig,
      start: 'top 72%',
      end: 'bottom 42%',
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        if (page) {
          page.style.setProperty('--blur', (p * 9).toFixed(2) + 'px');
          page.style.setProperty('--fade', (1 - p * 0.75).toFixed(3));
        }
        if (lock) lock.style.setProperty('--lock', Math.max(0, (p - 0.45) / 0.55).toFixed(3));
        if (label) {
          var nowLocked = p > 0.55;
          if (nowLocked !== locked) {
            locked = nowLocked;
            label.textContent = locked ? 'Locked' : 'Your journal';
          }
        }
      },
    });
  }

  /* ---------------- parallax showcase ---------------- */
  function setupParallax() {
    var scene = document.querySelector('[data-parallax-scene]');
    if (!scene) return;
    gsap.utils.toArray('[data-depth]').forEach(function (el) {
      var depth = parseFloat(el.getAttribute('data-depth')) || 0;
      gsap.fromTo(
        el,
        { yPercent: -depth * 40 },
        {
          yPercent: depth * 40,
          ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    });
  }

  /* ---------------- register ---------------- */
  // Full experience: motion allowed and wide enough to pin a horizontal rail.
  mm.add('(min-width: 900px) and ' + OK, function () {
    setupSplit();
    setupHero(null, true);
    setupRail();
    setupRedaction();
    setupParallax();
  });

  // Narrow: keep the reveals and the redaction, drop the pin and the shader.
  mm.add('(max-width: 899px) and ' + OK, function () {
    setupSplit();
    setupHero(null, false);
    setupRedaction();
  });

  // Reduced motion: nothing is registered at all. CSS already neutralises the
  // pre-animation states, so the page renders complete and static.
  mm.add(REDUCED, function () {});

  // Late-loading images change layout; recompute pin distances when they land.
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
