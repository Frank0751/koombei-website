/*
 * Front end for the free site audit. Talks to /api/audit, which does the
 * fetching and scoring. Everything is built with createElement rather than
 * innerHTML: the report echoes a title and a URL from somebody else's website,
 * and those are not ours to trust.
 */
(function () {
  'use strict';

  var form = document.getElementById('auditForm');
  if (!form) return;

  var input = document.getElementById('auditUrl');
  var btn = document.getElementById('auditBtn');
  var out = document.getElementById('auditOut');
  var intro = document.getElementById('auditIntro');
  var busy = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function showError(message) {
    clear(out);
    out.appendChild(el('div', 'audit-error', message));
  }

  function verdictOf(c) { return c.pass ? 'Pass' : (c.warn ? 'Worth a look' : 'Needs fixing'); }
  function markOf(c) { return c.pass ? '✓' : (c.warn ? '!' : '✕'); }
  function stateOf(c) { return c.pass ? 'is-pass' : (c.warn ? 'is-warn' : 'is-fail'); }

  function render(data) {
    clear(out);

    /* Score band */
    var band = el('div', 'score-band');
    var fig = el('div', 'score-figure');
    fig.appendChild(el('strong', null, String(data.score)));
    fig.appendChild(el('span', null, '/ 100'));
    band.appendChild(fig);

    var meta = el('div', 'score-meta');
    meta.appendChild(el('div', 'score-site', data.url));
    meta.appendChild(el('div', 'score-tally',
      data.passed + ' passed, ' + data.warned + ' worth a look, ' + data.failed + ' needs fixing'));
    var bar = el('div', 'score-bar');
    var fill = el('i');
    bar.appendChild(fill);
    meta.appendChild(bar);
    band.appendChild(meta);
    out.appendChild(band);
    requestAnimationFrame(function () { fill.style.width = data.score + '%'; });

    /* Failures first: the reason someone ran this. */
    var order = ['Findable', 'Shareable', 'Understood', 'Usable', 'Fast and safe'];
    var groups = {};
    data.checks.forEach(function (c) { (groups[c.group] = groups[c.group] || []).push(c); });

    order.forEach(function (name) {
      var list = groups[name];
      if (!list || !list.length) return;
      list.sort(function (a, b) {
        var rank = function (c) { return c.pass ? 2 : (c.warn ? 1 : 0); };
        return rank(a) - rank(b);
      });

      var section = el('div', 'audit-group');
      section.appendChild(el('h2', null, name));
      list.forEach(function (c) {
        var row = el('div', 'audit-row ' + stateOf(c));
        row.appendChild(el('span', 'audit-mark', markOf(c)));

        var mid = el('div');
        mid.appendChild(el('div', 'audit-label', c.label));
        mid.appendChild(el('div', 'audit-detail', c.detail));
        if (!c.pass) mid.appendChild(el('p', 'audit-fix', c.fix));
        row.appendChild(mid);

        row.appendChild(el('span', 'audit-verdict', verdictOf(c)));
        section.appendChild(row);
      });
      out.appendChild(section);
    });

    /* What now */
    var next = el('div', 'audit-next');
    next.appendChild(el('h2', null, data.failed > 0
      ? 'Want these fixed properly?'
      : 'Your foundations are solid. Want to go further?'));
    next.appendChild(el('p', null, data.failed > 0
      ? 'Every item above is fixable, and most take minutes once you know where to look. Tell us what the site has to do and we will come back within 48 hours.'
      : 'This checks what a crawler sees on one page. Speed on a real phone, structure across the whole site and being quotable by AI search are the next layer.'));
    var cta = el('a', 'btn btn-primary', 'Start a conversation');
    cta.href = 'contact.html';
    next.appendChild(cta);
    out.appendChild(next);

    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;

    var value = (input.value || '').trim();
    if (!value) { showError('Enter a website address first.'); input.focus(); return; }

    busy = true;
    btn.disabled = true;
    btn.textContent = 'Auditing...';
    if (intro) intro.hidden = true;
    clear(out);
    out.appendChild(el('div', 'audit-status', 'Fetching the page, robots.txt and sitemap...'));

    fetch('/api/audit?url=' + encodeURIComponent(value), { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) { showError(data.error); return; }
        render(data);
      })
      .catch(function () {
        showError('Something went wrong reaching that site. Try again, or email info@koombei.com and we will look at it ourselves.');
      })
      .finally(function () {
        busy = false;
        btn.disabled = false;
        btn.textContent = 'Audit my site';
      });
  });
})();
