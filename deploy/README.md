# Moving the site somewhere other than Vercel

You almost certainly do not need this folder. The site is set up for Vercel,
which reads `vercel.json` in the project root, and [DEPLOY.md](../DEPLOY.md)
explains that in five steps.

These files exist so the security headers can travel with the site if it ever
moves. **Everything here is generated** by `npm run headers` from
`security/headers.js` — edit that file, not these.

| File | For | What to do with it |
| --- | --- | --- |
| `netlify.toml` | Netlify | Copy it to the project root before connecting the repo. |
| `_headers` | Netlify, Cloudflare Pages | Copy it into `public/` so it ends up in the build. |
| `nginx.conf` | Your own nginx server | Paste inside the `server` block, then reload nginx. |
| `apache.htaccess` | Apache, most cPanel hosting | Copy into the site directory as `.htaccess`. Needs `mod_headers`. |

Whatever you use, the site must be served over HTTPS and must send these
headers. They are what make "your answers never leave this device" something the
browser enforces rather than something we merely promise.
