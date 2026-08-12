/*
 * Gift KoomBei - Paystack inline checkout for voluntary gifts.
 *
 * The key below is Paystack's PUBLIC key (pk_live_). Like the Web3Forms
 * access key elsewhere in this codebase, it is public by design: it can
 * only initialise a payment INTO KoomBei's Paystack account, never read
 * or move money out. The secret key (sk_live_) lives only in the Paystack
 * dashboard and must never appear in this repo or any client-side code.
 *
 * Why client-side-only is safe here: the amount is chosen by the giver,
 * so there is nothing to tamper with - unlike a product checkout, no
 * goods are released based on the client's claim of payment. Paystack
 * completes the charge on its own servers and the money lands in the
 * dashboard either way. If KoomBei ever sells products through Paystack,
 * that flow will need server-side verification with the secret key.
 *
 * Performance: Paystack's inline.js is only fetched on the first gift
 * attempt, never on page load, so the homepage weight is unchanged for
 * the overwhelming majority of visitors who never open the gift form.
 * The popup is an iframe overlay, not a browser popup, so blockers and
 * the async load do not interfere with it.
 *
 * Charges are in GHS (the account's settlement currency). Card, Mobile
 * Money, and bank channels are enabled; international cards can pay a
 * GHS amount through Paystack as normal.
 */
(function () {
  'use strict';

  var PAYSTACK_PUBLIC_KEY = 'pk_live_eca91385b22de3f6b50c9b16a264174f451647f7';
  var PAYSTACK_SRC = 'https://js.paystack.co/v1/inline.js';
  var MIN_GHS = 5;
  var MAX_GHS = 100000;

  var form = document.getElementById('giftForm');
  if (!form) return;

  var emailInput  = form.querySelector('input[name="gift_email"]');
  var customInput = form.querySelector('input[name="gift_custom"]');
  var submitBtn   = form.querySelector('.gift-submit');
  var successBox  = document.getElementById('giftSuccess');
  var presets     = form.querySelectorAll('.gift-preset');
  var selectedGhs = null;

  presets.forEach(function (btn) {
    btn.addEventListener('click', function () {
      presets.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      selectedGhs = parseInt(btn.dataset.ghs, 10);
      customInput.value = '';
    });
  });

  customInput.addEventListener('input', function () {
    presets.forEach(function (b) { b.classList.remove('active'); });
    selectedGhs = null;
  });

  var loaderPromise = null;
  function loadPaystack() {
    if (window.PaystackPop) return Promise.resolve();
    if (loaderPromise) return loaderPromise;
    loaderPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PAYSTACK_SRC;
      s.onload = resolve;
      s.onerror = function () { loaderPromise = null; reject(new Error('paystack load failed')); };
      document.head.appendChild(s);
    });
    return loaderPromise;
  }

  function chosenAmount() {
    var custom = parseFloat(customInput.value);
    if (!isNaN(custom) && custom > 0) return custom;
    return selectedGhs;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = emailInput.value.trim();
    var ghs = chosenAmount();

    if (!email || email.indexOf('@') < 1) {
      alert('Please enter the email address for your receipt.');
      emailInput.focus();
      return;
    }
    if (!ghs) {
      alert('Please pick an amount or enter your own.');
      return;
    }
    if (ghs < MIN_GHS) {
      alert('The minimum gift is GHS ' + MIN_GHS + '.');
      return;
    }
    if (ghs > MAX_GHS) {
      alert('That amount is above the online limit. Please email info@koombei.com and we will arrange it directly.');
      return;
    }

    var originalText = submitBtn.textContent;
    submitBtn.textContent = 'Opening secure checkout...';
    submitBtn.disabled = true;

    function restore() {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }

    loadPaystack().then(function () {
      var handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: Math.round(ghs * 100), // pesewas
        currency: 'GHS',
        channels: ['card', 'mobile_money', 'bank'],
        ref: 'KBGIFT-' + Date.now() + '-' + Math.floor(Math.random() * 1000000),
        metadata: {
          custom_fields: [{
            display_name: 'Purpose',
            variable_name: 'purpose',
            value: 'Gift to KoomBei via koombei.com'
          }]
        },
        callback: function () {
          form.style.display = 'none';
          successBox.style.display = 'block';
        },
        onClose: restore
      });
      handler.openIframe();
      restore(); // popup is open; the form underneath goes back to normal
    }).catch(function () {
      restore();
      alert('The payment window could not load. Please check your connection and try again, or email info@koombei.com.');
    });
  });
})();
