/* ==========================================================================
   The reel hero: one real NeuroLoop 100 video through the line that made it.

   Scroll inside the hero becomes one number, p (0 to 1), and p picks the
   current stage (1 to 7). Everything visible derives from that stage, so
   scrolling back reverses every change (M3). Stages are discrete: nothing
   is scrubbed frame by frame, and the video plays only from stage 4.

   Without this file, or under prefers-reduced-motion, the hero is a plain
   page: the finished video and all 7 steps as a list (M2). The class
   .is-live is the only switch.
   ========================================================================== */
(function () {
  var reel = document.querySelector('.reel');
  if (!reel) return;
  var line = reel.querySelector('.line');
  var runway = reel.querySelector('.reel-runway');
  var stage = reel.querySelector('.stage');
  var video = reel.querySelector('video[data-reel]');
  var heads = Array.prototype.slice.call(reel.querySelectorAll('.steps h3'));
  var details = Array.prototype.slice.call(reel.querySelectorAll('.steps .detail'));
  var bars = Array.prototype.slice.call(reel.querySelectorAll('.line-progress span'));
  var layers = Array.prototype.slice.call(reel.querySelectorAll('[data-at], [data-from]'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var STEPS = 7;
  var current = 0, live = false, near = true;

  function navH() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64; }

  function holdVideo(n) {
    if (!video) return;
    video._reelHold = n < 4;
    if (n >= 3 && video.preload === 'none') video.preload = 'auto';
    if (n >= 4 && near && !video._userPaused) video.play().catch(function () {});
    else video.pause();
  }

  function setStep(n) {
    if (n === current) return;
    current = n;
    reel.setAttribute('data-step', n);
    layers.forEach(function (el) {
      var on = el.hasAttribute('data-at') ? n === +el.getAttribute('data-at') : n >= +el.getAttribute('data-from');
      el.classList.toggle('on', on);
    });
    heads.forEach(function (h, i) {
      h.classList.toggle('done', i + 1 < n);
      h.classList.toggle('now', i + 1 === n);
      if (i + 1 === n) h.setAttribute('aria-current', 'step'); else h.removeAttribute('aria-current');
    });
    details.forEach(function (d, i) { d.classList.toggle('now', i + 1 === n); });
    bars.forEach(function (b, i) { b.classList.toggle('done', i + 1 < n); b.classList.toggle('now', i + 1 === n); });
    stage.classList.toggle('passed', n >= 6);
    holdVideo(n);
  }

  function measure() {
    if (!live) return;
    var r = runway.getBoundingClientRect();
    var p = (navH() + line.offsetHeight - r.top) / r.height;
    p = Math.max(0, Math.min(1, p));
    var step = 1 + Math.min(STEPS - 1, Math.floor(p * STEPS));
    /* --sp: how far through the current stage (0 to 1), so something moves on every scroll tick */
    var sp = Math.max(0, Math.min(1, p * STEPS - (step - 1)));
    reel.style.setProperty('--p', p.toFixed(4));
    reel.style.setProperty('--sp', sp.toFixed(4));
    setStep(step);
  }
  /* measured in the handler itself: scroll events already come once per frame,
     and a requestAnimationFrame hop stalls while the tab is in the background */
  function onScroll() { measure(); }

  function enable() {
    if (live) return;
    live = true;
    reel.classList.add('is-live');
    current = 0;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    measure();
  }
  function disable() {
    live = false;
    reel.classList.remove('is-live');
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    layers.forEach(function (el) { el.classList.remove('on'); });
    heads.forEach(function (h) { h.classList.remove('done', 'now'); h.removeAttribute('aria-current'); });
    details.forEach(function (d) { d.classList.remove('now'); });
    bars.forEach(function (b) { b.classList.remove('done', 'now'); });
    stage.classList.remove('passed');
    if (video) { video._reelHold = false; video.pause(); }
    current = 0;
  }
  function sync() { if (reduce.matches) disable(); else enable(); }

  /* watch the stage, not the section: the section's last pixels sit under the
     fixed nav while the first chapter plays, and that kept this video running */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      near = e[0].intersectionRatio >= 0.25;
      reel.classList.toggle('in-view', near);       /* pauses the scroll cue's loop off screen */
      if (live) holdVideo(current);
    }, { threshold: [0, 0.25] }).observe(stage);
  }
  if (reduce.addEventListener) reduce.addEventListener('change', sync);
  sync();
})();
