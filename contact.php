<?php
/* ==========================================================================
   The contact form handler. Runs on the Bluehost server, next to index.html.
   It emails each enquiry to sam@5am9t1.com with the visitor's address as
   Reply-To, so "Reply" in the inbox answers the visitor.

   - With script: contact.js posts here and reads the JSON answer.
   - Without script: the browser posts here and is sent back to /#contact
     with ?sent=1 (sent) or ?sent=0 (not sent).
   - Spam: the hidden _gotcha field (bots fill it; we pretend to accept),
     a limit of 5 sends per visitor per hour, and length limits.
   - Header injection: only the visitor's email reaches a header, and only
     after it passes FILTER_VALIDATE_EMAIL (no line breaks possible).
   ========================================================================== */

const TO      = 'sam@5am9t1.com';
const FROM    = 'sam@5am9t1.com';   /* same domain as the server, so SPF passes */
const LIMIT   = 5;                  /* sends per visitor ... */
const WINDOW  = 3600;               /* ... per this many seconds */

$wants_json = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function finish($ok, $code, $message) {
    global $wants_json;
    http_response_code($code);
    if ($wants_json) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        header('Location: /?sent=' . ($ok ? '1' : '0') . '#contact', true, 303);
    }
    exit;
}

/* one line of text: no control characters, trimmed, capped */
function line($key, $max) {
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) return '';
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v);
    return mb_substr(trim($v), 0, $max);
}

/* a value from a fixed list, or '' */
function pick($key, $allowed) {
    $v = line($key, 100);
    return in_array($v, $allowed, true) ? $v : '';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    finish(false, 405, 'Send the form to use this address.');
}

/* bot filled the hidden field: say yes, send nothing */
if (trim((string)($_POST['_gotcha'] ?? '')) !== '') finish(true, 200, 'Thank you.');

$name    = line('name', 100);
$email   = line('email', 200);
$message = is_string($_POST['message'] ?? null) ? mb_substr(trim(str_replace("\r", '', $_POST['message'])), 0, 5000) : '';

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    finish(false, 422, 'Please fill in your name, a valid email and a message.');
}

$enquiry   = pick('enquiry', ['A quote for a project', 'A question', 'Something else']);
$budget    = pick('budget', ['Under £1,000', '£1,000 to £5,000', '£5,000 to £15,000', 'Over £15,000', 'Not sure yet']);
$timeframe = pick('timeframe', ['As soon as possible', 'In 1 to 3 months', 'No fixed date']);
$needs_ok  = ['AI systems and agents', 'Website or online store', 'App or game', 'Video and motion', '3D, brand and design', 'Music and audio'];
$needs     = array_values(array_intersect(is_array($_POST['needs'] ?? null) ? $_POST['needs'] : [], $needs_ok));

/* rate limit: a small file per visitor (hashed IP), outside the web folder when possible */
$dir = sys_get_temp_dir() . '/5am9t1-form';
if (!is_dir($dir)) @mkdir($dir, 0700, true);
$file  = $dir . '/' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'contact');
$now   = time();
$times = is_file($file) ? array_filter(array_map('intval', explode(',', (string)@file_get_contents($file))), function ($t) use ($now) { return $t > $now - WINDOW; }) : [];
if (count($times) >= LIMIT) finish(false, 429, 'Too many messages in a short time. Please email ' . TO . ' directly.');

/* the email */
$body = "Name: $name\nEmail: $email\n";
if ($enquiry)   $body .= "Enquiry: $enquiry\n";
if ($needs)     $body .= 'Needs: ' . implode(', ', $needs) . "\n";
if ($budget)    $body .= "Budget: $budget\n";
if ($timeframe) $body .= "Timeframe: $timeframe\n";
$body .= "\n$message\n\n--\nSent from the form at 5am9t1.com\n";

$subject = 'New enquiry from 5am9t1.com: ' . ($enquiry ?: 'message') . ' (' . $name . ')';
$headers = implode("\r\n", [
    'From: 5am9t1.com form <' . FROM . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = mail(TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . FROM);
if (!$sent) finish(false, 500, 'That did not send. Please email ' . TO . '.');

$times[] = $now;
@file_put_contents($file, implode(',', $times), LOCK_EX);
finish(true, 200, 'Thank you. Your message is in my inbox.');
