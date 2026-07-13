/*
 * KoomBei reviews guard.
 *
 * The Trustpilot widgets/links in index.html point to
 * https://www.trustpilot.com/review/koombei.com and /evaluate/koombei.com.
 * Those URLs 404 until a Trustpilot Business account actually exists for
 * koombei.com (that step requires the site owner - it needs a business
 * email and domain verification, so it can't be automated here).
 *
 * Until then, this script hides the TrustBox widgets and disables the
 * "Write a review" / "Read reviews" links so visitors never land on a dead
 * Trustpilot 404 page. The footer link instead scrolls to the real, already
 *-live testimonials on the homepage.
 *
 * TO GO LIVE: after creating your Trustpilot Business account and replacing
 * PLACEHOLDER_TRUSTPILOT_BUSINESS_UNIT_ID in index.html (see
 * ASSETS_NEEDED.md), flip the flag below to true.
 */
(function () {
  'use strict';

  var TRUSTPILOT_READY = false;

  function boot() {
    if (TRUSTPILOT_READY) return;

    var onHomepage = !/\/pages\//.test(location.pathname);
    var anchorHref = (onHomepage ? '' : '../index.html') + '#client-stories';

    // Live TrustBox block (homepage only): hide the widgets, disable the CTA.
    document.querySelectorAll('.reviews-live').forEach(function (block) {
      block.querySelectorAll('.trustpilot-widget').forEach(function (w) {
        w.style.display = 'none';
      });
      var cta = block.querySelector('.reviews-cta');
      if (cta) {
        cta.textContent = 'Reviews launching soon';
        cta.removeAttribute('href');
        cta.setAttribute('aria-disabled', 'true');
        cta.style.opacity = '0.55';
        cta.style.pointerEvents = 'none';
      }
      var head = block.querySelector('.reviews-live-head');
      if (head && !head.querySelector('.reviews-soon-note')) {
        var note = document.createElement('p');
        note.className = 'reviews-soon-note';
        note.textContent = "We're setting up verified reviews - check back soon, or read the client stories above.";
        head.appendChild(note);
      }
    });

    // Footer "Read reviews" links (every page): repoint to the real,
    // already-live testimonials instead of a Trustpilot 404.
    document.querySelectorAll('a[href="https://www.trustpilot.com/review/koombei.com"]').forEach(function (a) {
      a.setAttribute('href', anchorHref);
      a.removeAttribute('target');
      a.removeAttribute('rel');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
