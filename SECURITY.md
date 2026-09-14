# Security notes

The promise this page makes to customers is narrow and absolute: **what they
type never leaves their device.** Everything below exists to make that promise
enforceable by the browser rather than merely true by good intentions.

If you find a problem, please email info@telecomnetworks.co.uk rather than
opening a public issue.

## Threat model

The page handles commercially sensitive but not regulated data: staff names,
work email addresses, phone numbers and opening hours. The realistic risks are
(a) that data leaking to a third party, (b) an attacker tampering with the page
to collect it, and (c) a malicious file being used to attack the person filling
the form in. There is no server, no session and no credential, so there is
nothing to authenticate, nothing to authorise and no store to breach.

## Design

**No backend.** The site is static files. There is no API, no database, no
logging of form data and no server-side rendering. The completed spreadsheet is
assembled by JavaScript in the customer's browser and handed to the browser's
own download machinery.

**No storage.** The app writes nothing to `localStorage`, `sessionStorage`,
IndexedDB or cookies. Answers live in React state and are gone on refresh. An
end-to-end test asserts this after the form has been filled in. "Save progress"
is an explicit user action that writes a file to their own device.

**No outbound requests.** After the page and its two bundles load, nothing is
fetched. `connect-src 'none'` means a `fetch`, `XMLHttpRequest`, WebSocket or
`sendBeacon` would be refused by the browser even if one were introduced by
accident or by a compromised dependency. An end-to-end test asserts that every
request the page makes is to its own origin.

**No third-party anything.** No fonts, no CDNs, no analytics, no tag manager, no
embedded widgets. Every asset is served from the same origin.

## Content-Security-Policy

Defined once in `security/headers.js`, injected into `index.html` at build time
and written into `vercel.json` as a real HTTP header. A unit test fails if those
two copies drift apart.

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:;
font-src 'self'; connect-src 'none'; media-src 'none'; object-src 'none';
frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none';
form-action 'none'; frame-ancestors 'none';
require-trusted-types-for 'script'; trusted-types 'none';
upgrade-insecure-requests
```

Notes on the strict choices:

- **No `'unsafe-inline'`, anywhere.** Not for scripts and not for styles. That
  is why no component sets a `style` attribute and why the progress indicator is
  a real `<progress>` element rather than a div with a calculated width. A unit
  test greps the sources for inline styles.
- **`trusted-types 'none'`** with `require-trusted-types-for 'script'` closes
  the classic DOM-XSS sinks in Chromium. No policy is registered because nothing
  in the app assigns markup — no `innerHTML`, no `dangerouslySetInnerHTML`, no
  `eval`, no `new Function`. A unit test greps for all of those too.
- **`frame-ancestors 'none'`** is sent as a header (browsers ignore it in a
  `<meta>` tag), backed by `X-Frame-Options: DENY`.

Alongside it: HSTS, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, a `Permissions-Policy` that switches off every
device feature, the three cross-origin isolation headers, and `no-store` on the
HTML so nobody is served a stale form.

## Handling untrusted input

Three things entering the app are treated as hostile:

1. **Everything the customer types.** It is rendered by React as text, which
   escapes it, and written to the spreadsheet through ExcelJS, which escapes XML
   and stores answers as text cells. An answer beginning `=`, `+`, `-` or `@`
   therefore stays literal text in Excel instead of becoming a formula — the
   classic CSV-injection trick. A unit test builds a workbook from hostile input
   and asserts no formula elements appear in any sheet.

2. **A resumed "Save progress" file.** `src/lib/draft.js` never trusts the file.
   It rejects anything over 2 MB, anything that is not our own format, and
   anything from a different schema version. Then it copies values onto a freshly
   created form: every choice must appear in an allow-list, every string is
   stripped of control characters and length capped, the staff list is capped at
   250 people, and identifiers are regenerated. Keys we do not recognise are
   dropped rather than merged, so a tampered draft cannot add fields or reach the
   prototype chain.

3. **The optional assistant tool** (`src/lib/webmcp.js`). Where a browser exposes
   a WebMCP model context, one tool is registered that can set the company name
   and the name of the person completing the form — both scrubbed and length
   capped. It cannot read answers, change any other field, trigger a download or
   touch the network.

## File names and links

Download names are scrubbed of path separators, control characters, Windows
reserved characters and reserved device names, trimmed of leading dots, and
capped in length. The `mailto:` handover percent-encodes its subject and body,
so no newline can be injected into the message headers. Every external link
carries `rel="noreferrer noopener"`, checked by a unit test.

## Dependencies

Four runtime dependencies: React, React DOM, ExcelJS and Lucide's icons. ExcelJS
is loaded with a dynamic import, so it is only fetched if somebody reaches the
download button. `uuid` is pinned through an `overrides` entry to a version
without the bounds-check advisory that ExcelJS's own range allows.
`npm audit` reports zero vulnerabilities.

## What is deliberately not claimed

- The page cannot attach the spreadsheet to an email for the customer. Browsers
  do not allow it, and any site that says otherwise is doing something else. The
  customer attaches the file they just downloaded.
- Nothing here protects a customer whose own device or email account is already
  compromised.
- The security headers only apply where the host actually sends them. If you
  move the site off Vercel, carry `security/headers.js` across with it.
