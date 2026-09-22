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
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(dropHash, 0);   /* after the browser has jumped to the section */
  });
  window.addEventListener('hashchange', dropHash);
})();
