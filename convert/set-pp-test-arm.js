/**
 * Convert experiment — post-purchase thank-you test.
 *
 * Paste into the custom JS of BOTH variations (site-wide experiment):
 *   Original  -> ARM = 'control'
 *   Variation -> ARM = 'variant'
 *
 * Writes the `_pp_test` cart attribute once the cart has items. It carries
 * over to the order, where the thank-you extension reads it. Never
 * overwrites an existing value. Runs on page load and after every AJAX
 * add-to-cart (fetch and XHR, e.g. cart drawers).
 *
 * Note: "Buy it now" / express checkout buttons on the PDP skip the cart, so
 * those orders have no attribute and are treated as "not in test".
 */
(function () {
  var ARM = 'variant';
  var KEY = '_pp_test';

  if (window.__ppTestArmInstalled) return;
  window.__ppTestArmInstalled = true;

  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  var isCartAdd = function (url) { return /\/cart\/add(\.js)?(\?|$)/.test(String(url)); };
  var nativeFetch = window.fetch.bind(window);
  var running = false;
  var rerun = false;

  function setArm() {
    if (running) { rerun = true; return; }
    running = true;

    nativeFetch(root + 'cart.js', { credentials: 'same-origin' })
      .then(function (response) { return response.json(); })
      .then(function (cart) {
        if (!cart.item_count || (cart.attributes && cart.attributes[KEY])) return;
        var attributes = {};
        attributes[KEY] = ARM;
        return nativeFetch(root + 'cart/update.js', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributes: attributes })
        });
      })
      .catch(function () {})
      .then(function () {
        running = false;
        if (rerun) { rerun = false; setArm(); }
      });
  }

  window.fetch = function (input) {
    var result = nativeFetch.apply(null, arguments);
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (isCartAdd(url)) result.then(setArm, function () {});
    return result;
  };

  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (isCartAdd(url)) this.addEventListener('load', setArm);
    return nativeOpen.apply(this, arguments);
  };

  setArm();
})();
