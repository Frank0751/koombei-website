/*
 * Seasonal promotions.
 *
 * Add a promo to the list below with a start and end date and it appears on
 * its own, then disappears on its own. Nothing needs deploying to end one.
 *
 * Dates are inclusive and read in the visitor's own time, so a December promo
 * runs until the end of 31 December wherever the visitor is. Dismissal is
 * remembered per promo, so turning off this year's Christmas bar does not
 * hide next year's.
 *
 * To change an offer, edit one entry. To end one early, set `ends` to
 * yesterday, or delete the entry.
 */
(function () {
  'use strict';

  var PROMOS = [
    {
      id: 'christmas-2026',
      starts: '2026-12-01',
      ends: '2026-12-31',
      label: 'December',
      message: 'Book a project this month and three months of care after launch is included.',
      cta: { text: 'Start a project', href: 'contact' }
    }
  ];

  /* Compare on calendar date, not timestamp, so a promo does not end at
     midnight UTC for someone who is still on the 31st locally. */
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function live(p) {
    var n = today();
    return p.starts <= n && n <= p.ends;
  }

  function dismissed(id) {
    try { return localStorage.getItem('kb-promo-' + id) === 'off'; }
    catch (e) { return false; }
  }

  /* The bar sits on every page at a different depth, so work the path out
     rather than hard coding one. */
  function resolve(target) {
    if (/^(https?:|\/|#)/.test(target)) return target;
    var depth = location.pathname.replace(/^\/|\/$/g, '').split('/').length - 1;
    var inPages = location.pathname.indexOf('/pages/') !== -1;
    if (inPages && depth === 1) return target + '.html';
    if (inPages && depth > 1) return '../' + target + '.html';
    if (depth === 0) return 'pages/' + target + '.html';
    return '/pages/' + target + '.html';
  }

  function build(p) {
    var bar = document.createElement('div');
    bar.className = 'promo-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', p.label + ' offer');

    var inner = document.createElement('div');
    inner.className = 'promo-inner';

    var tag = document.createElement('span');
    tag.className = 'promo-tag';
    tag.textContent = p.label;
    inner.appendChild(tag);

    var msg = document.createElement('span');
    msg.className = 'promo-msg';
    msg.textContent = p.message;
    inner.appendChild(msg);

    if (p.cta) {
      var a = document.createElement('a');
      a.className = 'promo-cta';
      a.href = resolve(p.cta.href);
      a.textContent = p.cta.text;
      inner.appendChild(a);
    }

    bar.appendChild(inner);

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'promo-close';
    close.setAttribute('aria-label', 'Dismiss this offer');
    close.textContent = '×';
    close.addEventListener('click', function () {
      bar.remove();
      document.documentElement.classList.remove('has-promo');
      try { localStorage.setItem('kb-promo-' + p.id, 'off'); } catch (e) {}
    });
    bar.appendChild(close);

    return bar;
  }

  function boot() {
    var p = PROMOS.filter(function (x) { return live(x) && !dismissed(x.id); })[0];
    if (!p) return;
    var nav = document.querySelector('nav');
    if (!nav || !nav.parentNode) return;
    nav.parentNode.insertBefore(build(p), nav);
    document.documentElement.classList.add('has-promo');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
