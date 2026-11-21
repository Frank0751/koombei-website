/*
 * KoomBei homepage hero video.
 *
 * The <video> ships with preload="none" and no src, so it costs nothing until
 * this runs. We attach the real source only after the window load event, which
 * keeps the video out of the critical path: the poster image is what paints,
 * and the video is a progressive enhancement layered over it.
 *
 * Three groups keep the poster instead.
 *
 * prefers-reduced-motion is the accessibility one: a looping background
 * animation can be genuinely disorienting.
 *
 * Save-Data is the visitor telling their browser, at the system level, that
 * they are paying for this. Honouring it is not our judgement call about
 * their connection, it is a request they already made.
 *
 * A 2G or 3G effective connection is the measured one. The file is roughly
 * 17 times the poster, and on a slow link it arrives long after anyone has
 * stopped looking at the hero, so it costs real money and buys nothing.
 *
 * Both of those live on navigator.connection, which only Chromium exposes.
 * Everywhere else the checks are simply absent and the video loads, which is
 * the right failure direction for an enhancement: when we cannot tell, we
 * assume the connection is fine.
 *
 * If anything fails (blocked by CSP, decode error, autoplay refused, offline)
 * the element keeps showing its poster, so the hero still looks correct.
 * There is no error state the visitor can see.
 */
(function () {
  'use strict';

  var video = document.getElementById('heroVideo');
  if (!video) return;

  var src = video.getAttribute('data-src');
  if (!src) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) return; // poster only; nothing is downloaded

  // navigator.connection is Chromium-only. Absent means "cannot tell", and
  // cannot tell means load it.
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    if (conn.saveData === true) return;                       // they asked
    if (/(^|-)[23]g$/.test(conn.effectiveType || '')) return;  // slow-2g, 2g, 3g
  }

  function start() {
    // Nothing to reveal: the element is visible from the start and its poster
    // is the same frame the video opens on, so playback just takes over.
    video.addEventListener('error', function () { /* keep the poster */ }, { once: true });

    video.src = src;
    video.load();

    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      // Autoplay can still be refused (some power-saving modes, strict
      // settings). Not an error worth surfacing: the poster covers it.
      attempt.catch(function () {});
    }
  }

  // Pause while off-screen so we are not decoding frames nobody is looking at.
  function watchVisibility() {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var p = video.play();
          if (p && typeof p.catch === 'function') p.catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.1 }).observe(video);
  }

  // Also stop decoding when the tab is backgrounded.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      video.pause();
    } else {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }
  });

  if (document.readyState === 'complete') {
    start();
    watchVisibility();
  } else {
    window.addEventListener('load', function () {
      start();
      watchVisibility();
    }, { once: true });
  }
})();
