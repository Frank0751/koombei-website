/*
 * KoomBei motion layer — progressive enhancement only.
 * Everything here is optional polish: if prefers-reduced-motion is set, or the
 * device is low-powered, we bail out of the heavier effects and leave the
 * static (already-styled) page untouched.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
                 (navigator.deviceMemory && navigator.deviceMemory < 4);

  /* ── 1. Scroll progress bar ── */
  function scrollProgress() {
    if (reduce) return;
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
      bar.style.width = (pct * 100).toFixed(2) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ── 2. Animated number counters ── */
  function counters() {
    var nums = document.querySelectorAll('[data-target]');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-target'));
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = target + suffix; return; }
      var dur = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ── 3. Fire the process infographic's line + node reveal ── */
  function processReveal() {
    var section = document.querySelector('.process-section');
    if (!section) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    io.observe(section);
  }

  /* ── 4. 3D tilt on cards ── */
  function tilt() {
    if (reduce || lowPower) return;
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return; // skip touch
    var selectors = '.why-card, .service-card, .work-card, .serve-card, .testimonial-card, .pkg, .globe-feature-icon';
    var cards = document.querySelectorAll(selectors);
    var MAX = 6; // degrees

    cards.forEach(function (card) {
      card.classList.add('kb-tilt');
      var raf = null;
      function move(e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          card.style.transform = 'perspective(800px) rotateX(' + (-py * MAX).toFixed(2) +
            'deg) rotateY(' + (px * MAX).toFixed(2) + 'deg) translateY(-4px)';
          raf = null;
        });
      }
      function leave() {
        if (raf) { window.cancelAnimationFrame(raf); raf = null; }
        card.style.transform = '';
      }
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
    });
  }

  /* ── 5. Magnetic primary buttons ── */
  function magnetic() {
    if (reduce || lowPower) return;
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;
    var btns = document.querySelectorAll('.btn-primary, .nav-cta, .btn-submit');
    btns.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ── 6. Subtle parallax on hero background ── */
  function heroParallax() {
    if (reduce || lowPower) return;
    var hero = document.querySelector('.hero, .services-hero, .portfolio-hero');
    if (!hero) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = (window.scrollY || window.pageYOffset) * 0.25;
        hero.style.backgroundPosition = 'center calc(50% + ' + y.toFixed(0) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  }

  function boot() {
    scrollProgress();
    counters();
    processReveal();
    tilt();
    magnetic();
    heroParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
