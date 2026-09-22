/* ==========================================================================
   Chapter galleries: any tile with a .g-open button plays full size in a
   native <dialog> (Esc closes, focus is trapped, focus returns to the tile).
   data-src  = a local MP4, played with its sound and controls.
   data-img  = a still, shown full size (with data-bg: a logo on its tile colour).
   data-yt   = a YouTube id, loaded from the no-cookie domain only on click.
   Page clips pause while the player is open and resume when it closes.
   Without this file the tiles are still visible, looping previews.
   ========================================================================== */
(function () {
  var buttons = document.querySelectorAll('.g-open');
  if (!buttons.length || typeof HTMLDialogElement !== 'function') return;

  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Video player');
  dlg.innerHTML = '<div class="lb-frame"><div class="lb-body"></div><p class="lb-title"></p></div>' +
    '<button class="lb-close" type="button" aria-label="Close the player">×</button>';
  document.body.appendChild(dlg);
  var body = dlg.querySelector('.lb-body');
  var title = dlg.querySelector('.lb-title');
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
    }
    body.replaceChildren(node);
    title.textContent = btn.dataset.title || '';
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
