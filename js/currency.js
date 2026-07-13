/*
 * KoomBei currency localisation.
 *
 * Base prices are authored in the HTML as GHS via data-ghs="<amount>".
 * On load we:
 *   1. Pick the visitor's currency (saved pref → geo-IP lookup → locale → USD).
 *   2. Fetch a live GHS→X rate table (cached in localStorage for 12h, with a
 *      hard-coded fallback so the site never shows a broken price offline).
 *   3. Render every [data-ghs] node as "<local> <amount>" plus, where asked,
 *      a secondary USD (or local) reference line.
 *   4. Offer a currency picker in the nav so visitors can override.
 *
 * Language.js owns the shared KB render pipeline; we register a pass at a
 * higher priority so currency always renders AFTER text is swapped (the
 * language pass rewrites the same nodes from its English snapshot).
 */
(function () {
  'use strict';

  var STORE_CUR = 'kb-currency';
  var STORE_RATES = 'kb-rates';
  var RATES_TTL = 12 * 60 * 60 * 1000; // 12 hours

  /* A curated list — code, symbol, decimals, and a friendly name. Order here
     is the order shown in the picker (majors first, then GHS home currency). */
  var CURRENCIES = [
    { code: 'USD', symbol: '$',    dec: 0, name: 'US Dollar' },
    { code: 'EUR', symbol: '€',    dec: 0, name: 'Euro' },
    { code: 'GBP', symbol: '£',    dec: 0, name: 'British Pound' },
    { code: 'CAD', symbol: 'CA$',  dec: 0, name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$',   dec: 0, name: 'Australian Dollar' },
    { code: 'NGN', symbol: '₦',    dec: 0, name: 'Nigerian Naira' },
    { code: 'ZAR', symbol: 'R',    dec: 0, name: 'South African Rand' },
    { code: 'KES', symbol: 'KSh',  dec: 0, name: 'Kenyan Shilling' },
    { code: 'INR', symbol: '₹',    dec: 0, name: 'Indian Rupee' },
    { code: 'AED', symbol: 'AED ', dec: 0, name: 'UAE Dirham' },
    { code: 'CNY', symbol: '¥',    dec: 0, name: 'Chinese Yuan' },
    { code: 'JPY', symbol: '¥',    dec: 0, name: 'Japanese Yen' },
    { code: 'BRL', symbol: 'R$',   dec: 0, name: 'Brazilian Real' },
    { code: 'GHS', symbol: 'GHS ', dec: 0, name: 'Ghana Cedi' }
  ];

  /* Fallback GHS→X rates (approx., mid-2026). Only used until the live fetch
     lands or when the network is unavailable. Values = units of X per 1 GHS. */
  var FALLBACK = {
    base: 'GHS',
    rates: {
      GHS: 1, USD: 0.068, EUR: 0.063, GBP: 0.054, CAD: 0.093, AUD: 0.103,
      NGN: 105, ZAR: 1.24, KES: 8.8, INR: 5.9, AED: 0.25, CNY: 0.49,
      JPY: 10.4, BRL: 0.37
    },
    ts: 0,
    fallback: true
  };

  /* Map common country codes → default currency for geo detection. */
  var COUNTRY_CUR = {
    US: 'USD', GB: 'GBP', GH: 'GHS', NG: 'NGN', ZA: 'ZAR', KE: 'KES',
    IN: 'INR', AE: 'AED', CN: 'CNY', JP: 'JPY', BR: 'BRL', CA: 'CAD',
    AU: 'AUD', NZ: 'AUD',
    DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', PT: 'EUR',
    IE: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR'
  };

  function known(code) {
    for (var i = 0; i < CURRENCIES.length; i++) if (CURRENCIES[i].code === code) return CURRENCIES[i];
    return null;
  }

  function saved() {
    try { return localStorage.getItem(STORE_CUR); } catch (e) { return null; }
  }

  function localeCurrencyGuess() {
    var loc = (navigator.language || 'en-US');
    var region = loc.split('-')[1];
    if (region && COUNTRY_CUR[region.toUpperCase()]) return COUNTRY_CUR[region.toUpperCase()];
    return null;
  }

  var state = {
    cur: saved() && known(saved()) ? saved() : (localeCurrencyGuess() || 'USD'),
    rates: FALLBACK,
    picker: null,
    geoTried: false
  };

  /* ── Rates ── */
  function loadCachedRates() {
    try {
      var raw = localStorage.getItem(STORE_RATES);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (obj && obj.rates && obj.rates.GHS && (Date.now() - obj.ts) < RATES_TTL) return obj;
    } catch (e) { /* ignore */ }
    return null;
  }

  function fetchRates() {
    var cached = loadCachedRates();
    if (cached) { state.rates = cached; return; }

    // Free, key-less endpoint. GHS base → all symbols we need.
    var url = 'https://open.er-api.com/v6/latest/GHS';
    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.rates || !data.rates.USD) return;
        var picked = { base: 'GHS', rates: { GHS: 1 }, ts: Date.now(), fallback: false };
        for (var i = 0; i < CURRENCIES.length; i++) {
          var c = CURRENCIES[i].code;
          if (typeof data.rates[c] === 'number') picked.rates[c] = data.rates[c];
          else if (FALLBACK.rates[c]) picked.rates[c] = FALLBACK.rates[c];
        }
        state.rates = picked;
        try { localStorage.setItem(STORE_RATES, JSON.stringify(picked)); } catch (e) { /* ignore */ }
        if (window.KB) window.KB.render();
      })
      .catch(function () { /* keep fallback silently */ });
  }

  /* ── Geo detection (only when the visitor has no saved preference) ── */
  function detectGeo() {
    if (saved() || state.geoTried) return;
    state.geoTried = true;
    fetch('https://ipapi.co/json/')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var cur = data.currency && known(data.currency) ? data.currency
                : (data.country_code && COUNTRY_CUR[data.country_code]) || null;
        if (cur && known(cur) && !saved()) {
          state.cur = cur;
          if (window.KB) window.KB.render();
        }
      })
      .catch(function () { /* locale guess already applied */ });
  }

  /* ── Formatting ── */
  function convert(ghs) {
    var rate = state.rates.rates[state.cur];
    if (typeof rate !== 'number') rate = FALLBACK.rates[state.cur] || 1;
    return ghs * rate;
  }

  function roundNice(v) {
    // Tidy "from" prices: round to a sensible step so we never show $136.4207.
    if (v >= 1000) return Math.round(v / 10) * 10;
    if (v >= 100)  return Math.round(v / 5) * 5;
    if (v >= 10)   return Math.round(v);
    return Math.round(v * 100) / 100;
  }

  function fmt(code, amount) {
    var c = known(code) || CURRENCIES[0];
    var rounded = roundNice(amount);
    var str;
    try {
      str = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: rounded >= 10 ? 0 : 2,
        minimumFractionDigits: 0
      }).format(rounded);
    } catch (e) {
      str = String(rounded);
    }
    return c.symbol + str;
  }

  /* ── Render pass ── */
  function renderPrices() {
    var nodes = document.querySelectorAll('[data-ghs]');
    var t = (window.KB && window.KB.i18n) ? window.KB.i18n.t.bind(window.KB.i18n) : function (s) { return s; };
    var fromWord = t('from');
    var approx = '≈ ';

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var ghs = parseFloat(el.getAttribute('data-ghs'));
      if (isNaN(ghs)) continue;

      // Preserve any trailing unit markup (e.g. "<span>/ project</span>" or
      // "<sub>from</sub>"). Cache the tag + original English text so we can
      // re-translate the unit on every render (currency rebuilds innerHTML,
      // which would otherwise detach it from the language engine).
      if (!el.hasAttribute('data-unit-cached')) {
        var unit = el.querySelector('span, sub');
        el.setAttribute('data-unit-tag', unit ? unit.tagName.toLowerCase() : '');
        el.setAttribute('data-unit-cls', unit ? unit.className : '');
        el.setAttribute('data-unit-text', unit ? unit.textContent.trim() : '');
        el.setAttribute('data-unit-cached', '1');
      }
      var unitTag = el.getAttribute('data-unit-tag');
      var unitHTML = '';
      if (unitTag) {
        var unitTxt = el.getAttribute('data-unit-text');
        var cls = el.getAttribute('data-unit-cls');
        unitHTML = '<' + unitTag + (cls ? ' class="' + cls + '"' : '') + '>' + t(unitTxt) + '</' + unitTag + '>';
      }

      var main = fmt(state.cur, convert(ghs));
      var prefix = el.hasAttribute('data-from') ? (fromWord.charAt(0).toUpperCase() + fromWord.slice(1) + ' ') : '';

      var html = prefix + main + (unitHTML ? ' ' + unitHTML : '');

      // Secondary reference line: always show USD as the common anchor; if the
      // visitor's currency already IS USD, show the GHS base price instead.
      if (el.hasAttribute('data-alt')) {
        var altCode, altVal;
        if (state.cur === 'USD') {
          altCode = 'GHS'; altVal = ghs;
        } else {
          altCode = 'USD'; altVal = ghs * (state.rates.rates.USD || FALLBACK.rates.USD);
        }
        html += '<span class="price-alt">' + approx + fmt(altCode, altVal) + '</span>';
      }

      el.innerHTML = html;
    }

    if (state.picker) {
      var cobj = known(state.cur);
      state.picker.setCode(state.cur);
      state.picker.setSelected(state.cur);
    }
  }

  /* ── Picker ── */
  function buildPicker() {
    if (!window.KB || !window.KB.picker) return;
    var tools = window.KB.toolsContainer();
    if (!tools || tools.querySelector('.kb-cur-picker')) return;

    state.picker = window.KB.picker({
      ariaLabel: 'Currency',
      icon: '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
        '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4"/>' +
        '<path d="M12.5 7.5c-.6-.8-1.6-1.2-2.6-1.1-1.4 0-2.5.9-2.5 2s1.1 1.7 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2c-1 .1-2-.3-2.6-1.1M10 5v10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
      items: CURRENCIES.map(function (c) {
        return { value: c.code, label: c.name, meta: c.code };
      }),
      onSelect: function (code) {
        state.cur = code;
        try { localStorage.setItem(STORE_CUR, code); } catch (e) { /* ignore */ }
        window.KB.render();
      }
    });
    state.picker.el.classList.add('kb-cur-picker');
    tools.appendChild(state.picker.el);
  }

  function boot() {
    if (!window.KB) {
      // i18n.js normally sets this up; guard just in case load order changes.
      window.KB = { passes: [], addPass: function (fn, p) { this.passes.push({ fn: fn, prio: p || 0 }); this.passes.sort(function (a, b) { return a.prio - b.prio; }); }, render: function () { for (var i = 0; i < this.passes.length; i++) try { this.passes[i].fn(); } catch (e) {} } };
    }
    fetchRates();
    buildPicker();
    window.KB.addPass(renderPrices, 10); // after language (prio 0)
    window.KB.render();
    detectGeo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
