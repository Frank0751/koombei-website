/*
 * KoomBei consent notice - self-built, no third-party consent-management
 * service, no blocking modal. A single dismissible bottom bar, in the spirit
 * of the unobtrusive banner pattern seen on labdigital.nl.
 *
 * What it's disclosing: currency.js looks up the visitor's approximate
 * location (via ipapi.co) purely to preselect a currency, and reads/writes a
 * few localStorage keys for currency/language preference. Nothing here sets
 * third-party advertising cookies, so this stays an honest notice rather
 * than a hard opt-in gate that would block the currency/language features
 * from working by default.
 */
(function () {
  'use strict';

  var STORE_KEY = 'kb-consent-ack';

  function dismissed() {
    try { return localStorage.getItem(STORE_KEY) === '1'; } catch (e) { return false; }
  }

  function acknowledge() {
    try { localStorage.setItem(STORE_KEY, '1'); } catch (e) { /* ignore */ }
    var bar = document.getElementById('kb-consent-bar');
    if (bar) {
      bar.classList.remove('kb-consent-open');
      setTimeout(function () { bar.remove(); }, 300);
    }
  }

  function boot() {
    if (dismissed()) return;

    var bar = document.createElement('div');
    bar.id = 'kb-consent-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie and privacy notice');
    bar.innerHTML =
      '<p>We use your approximate location to show prices in your currency and language, and a few local browser settings to remember your preferences. We don\'t sell personal data. <a href="mailto:info@koombei.com">Questions? Email us.</a></p>' +
      '<button type="button" id="kb-consent-ok">Got it</button>';
    document.body.appendChild(bar);

    // Force a reflow before adding the open class so the slide-in transition
    // runs. setTimeout (not requestAnimationFrame) so this still fires if the
    // tab is backgrounded or not actively painting when the page loads.
    bar.getBoundingClientRect();
    setTimeout(function () { bar.classList.add('kb-consent-open'); }, 20);

    document.getElementById('kb-consent-ok').addEventListener('click', acknowledge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
