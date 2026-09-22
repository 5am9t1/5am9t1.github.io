/* ==========================================================================
   The particle network behind the whole page.

   Rebuilt 2026-09-21 from the particles.js effect on Sam's old 5am9t1.com
   (80 dots, links under 150px, repulse on hover, push on click, fixed
   behind everything on black). Plain canvas, no third-party script:
   particles.js 2.0.0 dates from 2015, is unmaintained, and loaded from a
   CDN on every visit.

   House rules it keeps: no glow (flat dots), low opacity so text on top
   stays readable, paused while the tab is hidden, and a single still frame
   under prefers-reduced-motion. The page works the same without it.
   ========================================================================== */
(function () {
  if (!window.HTMLCanvasElement) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'network';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* Colours are --ink-2 mixed into the page ground (#0B0A10) and drawn solid in
     'lighten' mode, so where a line crosses a dot the brighter one wins instead
     of the two adding up. Worst case under text is then the dot: 4.95:1.
     (Plain alpha let a dot plus a line reach 3.41:1, measured 09-21.) */
  function tone(a) {
    return 'rgb(' + Math.round(11 + 151 * a) + ',' + Math.round(10 + 146 * a) + ',' + Math.round(16 + 178 * a) + ')';
  }
  var DOT = tone(0.26);
  var LINK_MAX = 0.22;                       /* was 0.16: Sam asked for a bigger network (09-21) */
  var REACH = 190;                           /* link distance; the original used 150 */
  var REPEL = 120;                           /* cursor push-away radius */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var dpr = 1, w = 0, h = 0, dots = [], pointer = { x: -9999, y: -9999 };
  var running = false, raf = 0;

  function count() {
    /* the original's density: roughly 80 dots per 800 x 800, capped for phones */
    return Math.max(24, Math.min(110, Math.round((w * h) / 9000)));
  }

  function make(x, y) {
    var a = Math.random() * Math.PI * 2, s = 0.25 + Math.random() * 0.45;
    return { x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 1.6 + Math.random() * 1.8 };
  }

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = count();
    while (dots.length < n) dots.push(make(Math.random() * w, Math.random() * h));
    dots.length = n;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighten';
    for (var i = 0; i < dots.length; i++) {
      for (var j = i + 1; j < dots.length; j++) {
        var dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < REACH) {
          ctx.strokeStyle = tone(LINK_MAX * (1 - d / REACH));
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = DOT;
    for (var k = 0; k < dots.length; k++) {
      ctx.beginPath(); ctx.arc(dots[k].x, dots[k].y, dots[k].r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < dots.length; i++) {
      var p = dots[i];
      var dx = p.x - pointer.x, dy = p.y - pointer.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < REPEL && d > 0.1) { var f = (1 - d / REPEL) * 2.2; p.x += (dx / d) * f; p.y += (dy / d) * f; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function start() { if (running || reduce.matches) return; running = true; raf = requestAnimationFrame(step); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function sync() { if (!document.hidden && !reduce.matches) start(); else { stop(); draw(); } }

  window.addEventListener('pointermove', function (e) { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', function () { pointer.x = pointer.y = -9999; });
  document.addEventListener('click', function (e) {
    if (reduce.matches || e.target.closest('a, button, video, audio, iframe, input, label')) return;
    for (var i = 0; i < 4; i++) dots.push(make(e.clientX, e.clientY));
    if (dots.length > count() + 40) dots.splice(0, dots.length - (count() + 40));
    if (!running) draw();
  });

  document.addEventListener('visibilitychange', sync);
  var t = 0;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { size(); draw(); }, 150); });
  if (reduce.addEventListener) reduce.addEventListener('change', sync);

  size(); draw(); sync();
})();
