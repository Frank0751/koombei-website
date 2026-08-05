/*
 * KoomBei homepage hero video.
 *
 * The <video> ships with preload="none" and no src, so it costs nothing until
 * this runs. We attach the real source only after the window load event, which
 * keeps the video out of the critical path: the poster image is what paints,
 * and the video is a progressive enhancement layered over it.
 *
 * The video is only suppressed for prefers-reduced-motion. That is an
 * accessibility requirement, not a bandwidth policy: a looping background
 * animation can be genuinely disorienting, and those users keep the poster.
 * Every other visitor gets the video, per the site owner's decision.
 *
 * If anything fails (blocked by CSP, decode error, autoplay refused, offline)
 * we simply never add .is-ready, so the poster stays visible and the hero
 * still looks correct. There is no error state the visitor can see.
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

  function reveal() {
    video.classList.add('is-ready');
  }

  function start() {
    // canplaythrough means enough is buffered to run the loop without a stall,
    // so the crossfade never lands on a frozen or partially decoded frame.
    video.addEventListener('canplaythrough', reveal, { once: true });
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
    } else if (video.classList.contains('is-ready')) {
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
