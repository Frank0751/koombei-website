/*
 * KoomBei client-side spam guard.
 *
 * A free, no-backend layer that stops the large majority of automated form
 * spam. It is NOT a substitute for Web3Forms' own server-side spam filtering
 * (its `botcheck` honeypot is validated server-side too, and hCaptcha can be
 * added later if ever needed - see ASSETS_NEEDED.md); it is the first, silent
 * line of defence in front of it.
 *
 * Three checks, applied by each form's submit handler via KBSpam.check(form):
 *   1. Honeypot  - the hidden `botcheck` box should never be ticked; bots tick it.
 *   2. Time-trap - a form submitted within MIN_MS of loading is almost certainly
 *                  automated (humans take longer than 2 seconds to read + fill).
 *   3. Cooldown  - blocks rapid repeat submissions of the same form.
 *
 * Any form that opts in with the `data-kb-guard` attribute gets a load
 * timestamp stamped on it automatically.
 */
(function () {
  'use strict';

  var MIN_MS = 2000;        // faster than this after load = looks automated
  var COOLDOWN_MS = 20000;  // minimum gap between submits of the same form

  function loadedAt(form) { return form.__kbLoaded || 0; }

  function keyFor(form) {
    return 'kb-lastsubmit-' + (form.id || form.getAttribute('action') || 'form');
  }

  window.KBSpam = {
    /*
     * Returns '' when the submission looks legitimate, otherwise a short reason
     * code: 'bot' (honeypot tripped - handle silently), 'fast' (too quick), or
     * 'cooldown' (submitted again too soon).
     */
    check: function (form) {
      // Honeypot: Web3Forms uses a hidden `botcheck` checkbox; we also still
      // honour the older `_gotcha` text field in case any form keeps it.
      var hp = form.querySelector('input[name="botcheck"], input[name="_gotcha"]');
      if (hp && (hp.type === 'checkbox' ? hp.checked : hp.value !== '')) return 'bot';

      if (Date.now() - loadedAt(form) < MIN_MS) return 'fast';

      try {
        var last = parseInt(localStorage.getItem(keyFor(form)) || '0', 10);
        if (Date.now() - last < COOLDOWN_MS) return 'cooldown';
      } catch (e) { /* storage unavailable - skip cooldown */ }

      return '';
    },

    /* Call after a successful submit so the cooldown starts. */
    mark: function (form) {
      try { localStorage.setItem(keyFor(form), String(Date.now())); }
      catch (e) { /* ignore */ }
    },

    /* Friendly, non-technical message for a blocked (non-bot) submission. */
    message: function (reason) {
      if (reason === 'fast') return 'Please take a moment to complete the form before submitting.';
      if (reason === 'cooldown') return 'You just sent this - please wait a few seconds before submitting again.';
      return 'Please try again.';
    }
  };

  function stampForms() {
    var forms = document.querySelectorAll('form[data-kb-guard]');
    for (var i = 0; i < forms.length; i++) forms[i].__kbLoaded = Date.now();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stampForms);
  } else {
    stampForms();
  }
})();
