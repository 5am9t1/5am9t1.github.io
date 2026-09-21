/* ==========================================================================
   The particle network behind "The machine behind it".

   Rebuilt 2026-09-21 from the particles.js effect on Sam's old 5am9t1.com
   (80 dots, links under 150px, repulse on hover, push on click). Plain
   canvas, no third-party script: particles.js 2.0.0 dates from 2015, is
   unmaintained, and loaded from a CDN on every visit.

   House rules it keeps: no glow (flat dots), low opacity so text on top
   stays readable, paused when off screen, and a single still frame under
   prefers-reduced-motion. The page works the same without it.
   ========================================================================== */
(function () {
  var host = document.querySelector('[data-network]');
  if (!host || !window.HTMLCanvasElement) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'network';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var DOT = 'rgba(162, 156, 194, 0.26)';     /* --ink-2 at 0.26: text on a dot measures 4.95:1 (0.32 failed at 4.33) */
  var LINK = '162, 156, 194';                /* line colour, alpha per distance */
  var LINK_MAX = 0.16;
  var REACH = 150;                           /* link distance, as the original */
  var REPEL = 120;                           /* cursor push-away radius */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var dpr = 1, w = 0, h = 0, dots = [], pointer = { x: -9999, y: -9999 };
  var running = false, visible = false, raf = 0;

  function count() {
    /* the original's density: roughly 80 dots per 800 x 800, capped for phones */
    return Math.max(24, Math.min(110, Math.round((w * h) / 9000)));
  }

  function make(x, y) {
    var a = Math.random() * Math.PI * 2, s = 0.25 + Math.random() * 0.45;
    return { x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 1 + Math.random() * 1.6 };
  }

  function size() {
    var r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.round(r.width); h = Math.round(r.height);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = count();
    while (dots.length < n) dots.push(make(Math.random() * w, Math.random() * h));
    dots.length = n;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < dots.length; i++) {
      for (var j = i + 1; j < dots.length; j++) {
        var dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < REACH) {
          ctx.strokeStyle = 'rgba(' + LINK + ',' + (LINK_MAX * (1 - d / REACH)).toFixed(3) + ')';
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

  function sync() {
    if (visible && !reduce.matches) start(); else { stop(); draw(); }
  }

  host.addEventListener('pointermove', function (e) {
    var r = host.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
  });
  host.addEventListener('pointerleave', function () { pointer.x = pointer.y = -9999; });
  host.addEventListener('click', function (e) {
    if (reduce.matches || e.target.closest('a, button')) return;
    var r = host.getBoundingClientRect();
    for (var i = 0; i < 4; i++) dots.push(make(e.clientX - r.left, e.clientY - r.top));
    if (dots.length > count() + 40) dots.splice(0, dots.length - (count() + 40));
    if (!running) draw();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }).observe(host);
  } else { visible = true; }

  var t = 0;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { size(); draw(); }, 150); });
  if (reduce.addEventListener) reduce.addEventListener('change', sync);

  size(); draw(); sync();
})();
