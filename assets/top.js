/* ==========================================================================
   Every page load starts at the top (Sam, 2026-09-22).
   - The browser's own scroll memory is off, so a reload does not put the
     visitor back where they were.
   - A link to a section (/#contact from a case page) still lands on that
     section. The #part is then taken out of the address, so a reload after
     it starts at the top. Same after a tap on a nav link.
   Loaded in <head> without defer, so it runs before the browser restores.
   ========================================================================== */
(function () {
  if (!('scrollRestoration' in history)) return;
  history.scrollRestoration = 'manual';
  function dropHash() {
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  }
  window.addEventListener('load', function () {
    /* Jump to the #section ourselves. Left to the browser, the jump is a smooth
       scroll that can still be running (or never start, in a background tab)
       when the hash is dropped below, and the visitor stays at the top.
       Measured 2026-09-23: /about/#music and /about/#services both stayed at 0. */
    var id = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    var target = id && document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(dropHash, 0);
  });
  window.addEventListener('hashchange', dropHash);
})();

/* ==========================================================================
   No black tiles on the way down (Sam, 2026-09-23).
   Images below the first screen are loading="lazy", so the first screen
   paints fast. But lazy images only start loading as they near the screen,
   so a quick scroll outran them: 43 of 58 home images were still empty
   4 s after load. Once the page has loaded, switch every lazy image to
   eager, top of the page first, so the whole set (5.8 MB on home) is in
   before anyone reaches it.
   ========================================================================== */
(function () {
  function loadAll() {
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
  }
  if (document.readyState === 'complete') loadAll();
  else window.addEventListener('load', loadAll);
})();
