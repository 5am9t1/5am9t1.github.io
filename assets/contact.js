/* ==========================================================================
   The contact form. Sends to /contact.php without leaving the page; the
   script on the server emails the message to sam@5am9t1.com.

   - Without script the form posts to /contact.php the normal way, and the
     server sends the visitor back to /?sent=1#contact (or sent=0).
   - Where PHP does not run (a preview host), the post fails and the
     visitor is pointed to the email address, so no message is lost.
   - Spam: the hidden _gotcha field and a send limit, both on the server.
   ========================================================================== */
(function () {
  var form = document.querySelector('[data-contact]');
  if (!form || !window.fetch) return;
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');

  /* the quote questions show only when the enquiry is a quote (all show without script) */
  var quote = form.querySelector('[data-quote]');
  function showQuote() {
    var pick = form.querySelector('input[name="enquiry"]:checked');
    var on = !pick || pick.value.indexOf('quote') !== -1;
    quote.hidden = !on;
    quote.querySelectorAll('input').forEach(function (i) { i.disabled = !on; });   /* disabled fields are not sent */
  }
  if (quote) {
    form.querySelectorAll('input[name="enquiry"]').forEach(function (r) { r.addEventListener('change', showQuote); });
    showQuote();
  }

  function say(text, kind) {
    status.textContent = text;
    status.dataset.kind = kind || '';
  }

  /* back from a no-script send */
  var sent = /[?&]sent=([01])/.exec(location.search);
  if (sent) {
    say(sent[1] === '1' ? 'Thank you. Your message is in my inbox.' : 'That did not send. Please email sam@5am9t1.com.', sent[1] === '1' ? 'ok' : 'error');
    history.replaceState(null, '', location.pathname + location.hash);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var bad = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (f) { return !f.checkValidity(); });
    form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
    if (bad.length) {
      bad.forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
      bad[0].focus();
      say(bad[0].type === 'email' && bad[0].value ? 'Please check your email address.' : 'Please fill in every field.', 'error');
      return;
    }

    button.disabled = true;
    say('Sending…');

    /* Bluehost's bot check answers a visitor's first request to a .php file with
       409 and a one-line script that sets a cookie and reloads. A background send
       cannot reload, so the message was lost (measured 2026-09-23). Set the cookie
       that reply names and send once more. */
    function send(retry) {
      return fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(function (r) {
          return r.text().then(function (t) {
            var challenge = /document\.cookie\s*=\s*"(humans_\d+=\w+)"/.exec(t);
            if (r.status === 409 && challenge && retry) {
              document.cookie = challenge[1] + '; path=/; SameSite=Lax';
              return send(false);
            }
            var d = {};
            try { d = JSON.parse(t); } catch (e) {}
            return { r: r, d: d };
          });
        });
    }

    send(true)
      .then(function (res) {
        if (!res.r.ok || !res.d.ok) throw new Error(res.d.message || '');
        form.reset();
        if (quote) showQuote();
        say(res.d.message || 'Thank you. Your message is in my inbox.', 'ok');
      })
      .catch(function (err) {
        say(err.message || 'That did not send. Please try again, or email sam@5am9t1.com.', 'error');
      })
      .then(function () { button.disabled = false; });
  });
})();
