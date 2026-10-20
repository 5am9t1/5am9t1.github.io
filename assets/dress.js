/* 5am9t1.com dress, 2026-10-20 (house_style_pass, No-AI-look: FREE).
   Vanilla ports from house_style_pass/references/dress-pieces.md:
   D2 Number Ticker (Magic UI) · D3 Interactive Hover Button (Magic UI) · D5 Lens (Magic UI / Aceternity)
   · D6 Following pointer (Aceternity). D1 BlurText, D4 Focus Cards and D8 grain are CSS only (dress.css).
   D7 Video Text is played and paused by media.js like every other muted clip.
   Every piece: nothing under prefers-reduced-motion; pointer pieces only on a fine pointer that hovers. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* D3 Interactive Hover Button: an arrow slides in (CSS does the motion; also on keyboard focus) */
  Array.prototype.forEach.call(document.querySelectorAll('main .btn'), function (b) {
    if (b.querySelector('.arr')) return;
    var a = document.createElement('span');
    a.className = 'arr'; a.setAttribute('aria-hidden', 'true'); a.textContent = '→';
    b.appendChild(a);
  });

  /* D2 Number Ticker: proof numbers count up once, when they scroll into view.
     The real number stays in the page (visually hidden) for screen readers and Google; the counting
     copy is aria-hidden and keeps the final width, so nothing beside it moves. Numbers under 10, years
     (data-static) and anything already on screen at load are left alone. */
  function tickers() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var ease = function (p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); };
    function fmt(o, v) { return o.pre + (o.comma ? v.toLocaleString('en-GB') : String(v)) + o.post; }
    function run(el) {
      var o = el._tick, t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / 1400);
        o.t.textContent = fmt(o, Math.round(o.n * ease(p)));
        if (p < 1) requestAnimationFrame(step); else o.t.textContent = o.txt;
      }
      requestAnimationFrame(step);
    }
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { watch.unobserve(e.target); run(e.target); } });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(document.querySelectorAll('.chapter-copy .stat strong, .proof dt'), function (el) {
      if (el.hasAttribute('data-static')) return;
      var txt = el.textContent.trim(), m = txt.match(/^(\D*)(\d[\d,]*)(.*)$/);
      if (!m) return;
      var n = parseInt(m[2].replace(/,/g, ''), 10);
      if (!(n >= 10)) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) return;           /* on screen or already scrolled past: leave it */
      el.innerHTML = '<span class="visually-hidden">' + esc(txt) + '</span><span class="tick" aria-hidden="true">' + esc(txt) + '</span>';
      var t = el.querySelector('.tick');
      t.style.minWidth = Math.ceil(t.getBoundingClientRect().width) + 'px';
      el._tick = { t: t, txt: txt, pre: m[1], n: n, post: m[3], comma: m[2].indexOf(',') > -1 };
      t.textContent = fmt(el._tick, 0);
      watch.observe(el);
    });
  }
  tickers();

  if (reduce || !fine) return;

  /* D5 Lens: a 190 px magnifier (zoom 2.2) over the 3D render stills. It reads the full-size file
     the viewer opens (data-img), fetched on first hover; the tile's own image fills in until then. */
  Array.prototype.forEach.call(document.querySelectorAll('#renders .render .g-tile'), function (tile) {
    var img = tile.querySelector('img'), btn = tile.querySelector('.g-open');
    if (!img || tile.querySelector('video')) return;
    var big = btn && btn.getAttribute('data-img'), src = '', R = 95, Z = 2.2;
    var lens = document.createElement('span');
    lens.className = 'lens'; lens.setAttribute('aria-hidden', 'true');
    tile.appendChild(lens); tile.classList.add('has-lens');
    tile.addEventListener('pointerenter', function () {
      if (!src) {
        src = img.currentSrc || img.src;
        if (big) { var pre = new Image(); pre.onload = function () { src = big; lens.style.backgroundImage = 'url("' + big + '")'; }; pre.src = big; }
      }
      tile.classList.add('lens-on');
    });
    tile.addEventListener('pointerleave', function () { tile.classList.remove('lens-on'); });
    tile.addEventListener('pointermove', function (e) {
      if (!img.naturalWidth) return;
      var r = tile.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      var s = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);   /* object-fit: cover */
      var rw = img.naturalWidth * s, rh = img.naturalHeight * s, ox = (r.width - rw) / 2, oy = (r.height - rh) / 2;
      lens.style.backgroundImage = 'url("' + src + '")';
      lens.style.backgroundSize = (rw * Z) + 'px ' + (rh * Z) + 'px';
      lens.style.backgroundPosition = (-((x - ox) * Z - R)) + 'px ' + (-((y - oy) * Z - R)) + 'px';
      lens.style.transform = 'translate(' + (x - R) + 'px,' + (y - R) + 'px)';
    });
  });

  /* D6 Following pointer: a Play / View circle trails the pointer over the case clips */
  var SEL = '.chapter-media .g-tile';
  if (!document.querySelector(SEL)) return;
  var c = document.createElement('div');
  c.className = 'view-cursor'; c.setAttribute('aria-hidden', 'true');
  c.innerHTML = '<span class="vc">Play</span>';
  document.body.appendChild(c);
  document.documentElement.classList.add('has-view-cursor');
  var vc = c.firstChild, tx = -200, ty = -200, x = -200, y = -200, on = false, raf = 0, last = null;
  function loop() {
    x += (tx - x) * 0.22; y += (ty - y) * 0.22;
    c.style.transform = 'translate(' + (x - 42).toFixed(1) + 'px,' + (y - 42).toFixed(1) + 'px)';
    raf = (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) ? requestAnimationFrame(loop) : 0;
  }
  document.addEventListener('pointermove', function (e) {
    tx = e.clientX; ty = e.clientY;
    var t = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (t !== last) {
      last = t;
      var b = t && t.querySelector('.g-open');
      if (b) vc.textContent = b.hasAttribute('data-img') ? 'View' : 'Play';
    }
    if (!!t !== on) { on = !!t; c.classList.toggle('on', on); }
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener('pointerleave', function () { on = false; last = null; c.classList.remove('on'); });
})();
