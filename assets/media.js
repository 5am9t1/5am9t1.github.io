/* ==========================================================================
   Media on the page. The page works without this file: videos show their
   poster, and the YouTube tile is a still.

   - Clips play only while on screen, and never under reduced motion.
   - Every clip gets a pause button (WCAG 2.2.2: motion over 5 s can stop).
   - YouTube loads nothing until the visitor taps, then uses the
     no-cookie domain.
   ========================================================================== */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var io = 'IntersectionObserver' in window;

  /* --- clips ---------------------------------------------------------------- */
  var clips = Array.prototype.slice.call(document.querySelectorAll('video[muted]'));

  clips.forEach(function (v) {
    var box = v.parentElement;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'clip-toggle';
    box.appendChild(btn);
    v._userPaused = reduce.matches;
    function label() {
      var playing = !v.paused;
      btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
      btn.dataset.state = playing ? 'playing' : 'paused';
    }
    btn.addEventListener('click', function () {
      if (v.paused) { v._userPaused = false; v.play().catch(function () {}); }
      else { v._userPaused = true; v.pause(); }
    });
    v.addEventListener('play', label);
    v.addEventListener('pause', label);
    label();
  });

  /* reel.js holds the hero's stage video (v._reelHold) until the line reaches stage 4 */
  function wake(v) { if (!v._userPaused && !v._reelHold && !reduce.matches) v.play().catch(function () {}); }

  if (io) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) wake(e.target); else e.target.pause();
      });
    }, { threshold: 0.35 });
    clips.forEach(function (v) { seen.observe(v); });
  }

  if (reduce.addEventListener) {
    reduce.addEventListener('change', function () {
      clips.forEach(function (v) { if (reduce.matches) { v._userPaused = true; v.pause(); } });
    });
  }

  /* --- YouTube, click to load --------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-yt]'), function (box) {
    var btn = box.querySelector('.yt-play');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.dataset.yt + '?autoplay=1&rel=0';
      f.title = btn.getAttribute('aria-label').replace(/^Play /, '');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      box.replaceChildren(f);
      f.focus();
    });
  });

  /* --- marquee: paused while off screen ------------------------------------- */
  var m = document.querySelector('.marquee');
  if (m && io) {
    new IntersectionObserver(function (e) { m.classList.toggle('paused', !e[0].isIntersecting); }).observe(m);
  }
})();
