/* ==========================================================================
   Chapter galleries: any tile with a .g-open button plays full size in a
   native <dialog> (Esc closes, focus is trapped, focus returns to the tile).
   data-src  = a local MP4, played with its sound and controls.
   data-img  = a still, shown full size (with data-bg: a logo on its tile colour).
   data-yt   = a YouTube id, loaded from the no-cookie domain only on click.
   data-href = the live address of a website film: a "Go to the website" button under the film
               opens it in a new tab (Sam, 2026-11-12: "see it a bit better").
   data-note = a short line in the same place when there is no live address yet ("Launching soon").
   Page clips pause while the player is open and resume when it closes.
   Without this file the tiles are still visible, looping previews.
   ========================================================================== */
(function () {
  var buttons = document.querySelectorAll('.g-open');
  if (!buttons.length || typeof HTMLDialogElement !== 'function') return;

  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Video player');
  dlg.innerHTML = '<div class="lb-frame"><div class="lb-body"></div><p class="lb-title"></p>' +
    '<a class="btn btn-primary lb-visit" target="_blank" rel="noopener" hidden>Go to the website<span class="lb-ext" aria-hidden="true">↗</span></a>' +
    '<p class="lb-note" hidden></p></div>' +
    '<button class="lb-close" type="button" aria-label="Close the player">×</button>';
  document.body.appendChild(dlg);
  var frame = dlg.querySelector('.lb-frame');
  var body = dlg.querySelector('.lb-body');
  var title = dlg.querySelector('.lb-title');
  var visit = dlg.querySelector('.lb-visit');
  var note = dlg.querySelector('.lb-note');
  var resume = [];

  function open(btn) {
    resume = Array.prototype.filter.call(document.querySelectorAll('video'), function (v) { return !v.paused; });
    resume.forEach(function (v) { v.pause(); });
    var node;
    if (btn.dataset.yt) {
      node = document.createElement('iframe');
      node.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.yt + '?autoplay=1&rel=0';
      node.title = btn.dataset.title || 'Video';
      node.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      node.allowFullscreen = true;
      node.referrerPolicy = 'strict-origin-when-cross-origin';
    } else if (btn.dataset.img) {
      node = document.createElement('img');
      node.src = btn.dataset.img;
      node.alt = btn.dataset.title || '';
      if (btn.dataset.bg) {                       /* a logo: shown large on its own tile colour */
        node.className = 'lb-logo';
        node.style.background = btn.dataset.bg === 'white' ? '#FFFFFF' : btn.dataset.bg === 'black' ? '#000000' : '';
      }
    } else {
      node = document.createElement('video');
      node.src = btn.dataset.src;
      node.controls = true;
      node.autoplay = true;
      node.playsInline = true;
      node.setAttribute('aria-label', btn.dataset.title || 'Video');
      /* Round 23: the full-size clip needs ~2.5 s to buffer before it plays (measured live
         2026-09-26, Chris reel, fast line), and the player was an empty frame until then. Show the
         tile's still instead: it is already on screen, so it paints at once. */
      var tile = btn.closest('.g-tile');
      var still = tile && tile.querySelector('video[poster]');
      if (still) node.poster = still.getAttribute('poster');
      else {                                      /* a website film: its tile is a still of the top of the page */
        still = tile && tile.querySelector('img');
        if (still) node.poster = still.currentSrc || still.src;
      }
    }
    body.replaceChildren(node);
    title.textContent = btn.dataset.title || '';
    var href = btn.dataset.href || '';
    visit.hidden = !href;
    if (href) {
      visit.href = href;
      visit.setAttribute('aria-label', 'Go to ' + (btn.dataset.site || 'the website') + ', opens in a new tab');
    } else visit.removeAttribute('href');
    note.hidden = !btn.dataset.note;
    note.textContent = btn.dataset.note || '';
    frame.classList.toggle('lb-has-visit', !!(href || btn.dataset.note));
    dlg.showModal();
  }

  function shut() { if (dlg.open) dlg.close(); }

  dlg.addEventListener('close', function () {
    body.replaceChildren();                       /* stops the sound and the iframe */
    resume.forEach(function (v) { v.play().catch(function () {}); });
    resume = [];
  });
  dlg.querySelector('.lb-close').addEventListener('click', shut);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) shut(); });   /* a click on the backdrop */

  Array.prototype.forEach.call(buttons, function (b) {
    b.addEventListener('click', function () { open(b); });
  });
})();
