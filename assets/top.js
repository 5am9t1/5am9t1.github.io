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
  /* Round 21: 'load' waits for every picture and the first clips, which on a slow line is 8 s or
     more (measured 2026-09-25 at 5 Mbit/s). A visitor who has already scrolled to a chapter must
     not be thrown back to the top, so the jump below only runs if they have not touched the page. */
  var touched = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) {
    window.addEventListener(t, function () { touched = true; }, { passive: true, once: true, capture: true });
  });
  window.addEventListener('load', function () {
    if (touched) { setTimeout(dropHash, 0); return; }
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
   Menu button for phones and tablets (Sam, 2026-09-23: "no hamburger menu").
   Below 900 px the header hides every link except "What I can build" and
   "Contact". This adds a button that opens ALL of them, plus the social
   icons, built from the header's own links, so there is one list to edit.
   Closes on a link tap, Escape, a tap outside, or a resize to desktop.
   ========================================================================== */
(function () {
  function init() {
    var nav = document.querySelector('.nav'), inner = nav && nav.querySelector('.nav-inner');
    if (!inner || inner.querySelector('.nav-toggle')) return;

    var menu = document.createElement('div');
    menu.className = 'nav-menu';
    menu.id = 'nav-menu';
    menu.hidden = true;
    var list = document.createElement('ul');
    var socials = document.createElement('div');
    socials.className = 'nav-menu-social';
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      var copy = a.cloneNode(true);
      copy.removeAttribute('class');
      if (a.classList.contains('social-icon')) { copy.className = 'social-icon'; socials.appendChild(copy); return; }
      var li = document.createElement('li');
      li.appendChild(copy);
      list.appendChild(li);
    });
    menu.appendChild(list);
    menu.appendChild(socials);
    document.body.appendChild(menu);

    var ICON_OPEN = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    var ICON_CLOSE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-controls', 'nav-menu');

    function set(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      btn.innerHTML = open ? ICON_CLOSE : ICON_OPEN;
      document.documentElement.classList.toggle('nav-open', open);
    }
    set(false);
    inner.appendChild(btn);

    btn.addEventListener('click', function () { set(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) set(false);
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (m) { if (m.matches) set(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
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
/* Round 20 (Sam, 2026-09-25: "it shows black first"). Waiting for 'load' meant waiting for EVERY
   poster and font too: measured 5.9 s on a cold visit, so the logo wall was still empty 2.7 s after
   scrolling to it. Now the rest starts as soon as the first screen's pictures (the hero wall, or any
   fetchpriority="high" image) are in; 'load' stays as the fallback. A page with no first-screen
   pictures keeps the old behaviour, so it never competes with its own first paint. */
(function () {
  var started = false;
  function loadAll() {
    if (started) return;
    started = true;
    /* low priority (round 21): these ~40 logos and renders must not queue ahead of the chapter
       posters and clips a visitor is looking at. Measured 09-25 at 5 Mbit/s: K!NG posters 5.2 s. */
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.fetchPriority = 'low'; img.loading = 'eager'; });
  }
  function whenFirstScreenIn() {
    var first = Array.prototype.slice.call(document.querySelectorAll('.wall img, img[fetchpriority="high"]'));
    if (!first.length) return;
    var left = first.length;
    function one() { if (--left === 0) loadAll(); }
    first.forEach(function (img) {
      if (img.complete) one();
      else { img.addEventListener('load', one, { once: true }); img.addEventListener('error', one, { once: true }); }
    });
  }
  if (document.readyState === 'complete') loadAll();
  else {
    window.addEventListener('load', loadAll);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whenFirstScreenIn);
    else whenFirstScreenIn();
  }
})();
