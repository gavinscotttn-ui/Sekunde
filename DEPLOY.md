# Hosting the CRF form

You are hosting a folder of static files. There is no server to run, no database
to provision, no environment variable to set and no secret to keep. Anything
that can serve a folder over HTTPS can host this.

The one thing that **must** travel with the files is the security headers. They
are what make "your answers never leave this device" enforceable rather than
merely true. `security/headers.js` is the single source of truth, and
`npm run headers` generates a ready-made configuration for each host below.

```bash
npm install
npm run verify     # headers check + unit tests + build + browser tests
```

`npm run build` puts the finished site in `dist/`.

---

## Option A — Vercel, straight from GitHub

`vercel.json` is already in the repository, so there is nothing to configure.

1. Sign in at [vercel.com](https://vercel.com) and choose **Add New → Project**.
2. Import `gavinscotttn-ui/Sekunde`.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
   Vercel normally detects all three. Leave environment variables empty.
4. **Deploy.**

Every push to the production branch redeploys automatically. Pushes to other
branches get their own preview URL.

## Option B — Netlify

`netlify.toml` is in the repository, so the build settings come across with it.

**From GitHub:** Add new site → Import an existing project → pick the repo →
Deploy. Node 22, `npm run build`, publish `dist` are all read from the file.

**Without GitHub:** run `npm run build`, then drag the `dist` folder onto
[app.netlify.com/drop](https://app.netlify.com/drop). The headers still apply —
`dist/_headers` is part of the build.

## Option C — Cloudflare Pages

1. Workers & Pages → Create → Pages → Connect to Git → pick the repo.
2. Framework preset **Vite**, build command `npm run build`, output directory
   `dist`.
3. Deploy. Pages reads `dist/_headers` for the security headers.

## Option D — Your own web server

Run `npm run build` and copy the **contents** of `dist/` to the directory the
site is served from. Then apply the headers:

- **nginx** — paste `deploy/nginx.conf` into the relevant `server` block and
  reload (`nginx -t && systemctl reload nginx`).
- **Apache, including most cPanel hosting** — copy `deploy/apache.htaccess` into
  that directory as `.htaccess`. It needs `mod_headers` enabled, which it
  usually is.
- **Anything else** — open `public/_headers`, which lists every header in plain
  text, and set the same ones however your server does it.

HTTPS is not optional: the page sets `Strict-Transport-Security`, and browsers
will not treat it as a secure context otherwise. Let's Encrypt is free.

---

## Check it once it is live

Replace `crf.example.co.uk` with your domain.

```bash
# The security headers really arrived
curl -sSI https://crf.example.co.uk | grep -i -E 'content-security|strict-transport|x-frame|x-content-type|referrer-policy'

# The blank spreadsheet downloads
curl -sSI https://crf.example.co.uk/Telecom-Networks-CRF-blank-form.xlsx | head -3
```

Then, in a browser:

1. The form loads and step 1 asks for a company name.
2. Open the developer console (F12). Fill a couple of fields. **No errors, and
   the Network tab shows nothing but this site's own files.**
3. Complete the form and download the spreadsheet. Open it — four tabs, your
   answers in them.
4. Click **Download the form** in the right-hand column and check the plain
   classic CRF opens in Excel.

[securityheaders.com](https://securityheaders.com) will grade the live site if
you want the headers confirmed by something other than me.

## Sending it to customers

The page is deliberately kept out of search results (`X-Robots-Tag` and
`robots.txt`), because the link is meant to be sent to a customer rather than
found. Send the plain URL; there is nothing to log in to.

## Updating it later

Push to the branch your host builds from, and it redeploys. If you host it
yourself, `npm run build` and copy `dist/` across again.

After changing anything in `security/headers.js`:

```bash
npm run headers    # regenerate all five host configuration files
npm run verify     # and prove nothing broke
```

`npm test` fails if a generated file has drifted from `security/headers.js`, so
the headers cannot quietly rot.
