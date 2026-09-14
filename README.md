# Telecom Networks — Customer Requirements Form

A local HTML tool that happens to be hosted.

Customers answer a handful of plain-English questions about how their phone
system should work, and the page builds the completed CRF spreadsheet **inside
their own browser**. There is no backend, no database, no account, no cookie and
no analytics. Nothing they type is uploaded anywhere, and nothing is kept
between visits.

---

## What it does

| Step | What the customer does |
| --- | --- |
| 1. About you | Company name, their name, an optional reply-to address |
| 2. Your team | Pick the phone/app/voicemail options **once**, add people, change only the exceptions |
| 3. Call handling | Numbers, menus, opening hours, groups — questions appear only when they apply |
| 4. Check and send | Review every answer, download the `.xlsx`, open a pre-addressed email |

### Built so nobody has to answer the same thing twice

- **Options for everyone.** The six per-user settings are chosen once and apply
  to every person, including anyone added later. A person only ever needs a name
  and, where a service requires it, an email address.
- **Use these for everyone.** One button pulls anybody who was set up
  individually back onto the team defaults.
- **Different for this person.** The exceptions get their own options without
  disturbing the rest of the team, and are clearly flagged as such.
- **Add several people at once.** Paste a staff list in almost any shape
  (`Jane Smith`, `Jane Smith, jane@…`, `Jane Smith <jane@…>`, tab separated).
- **Fill in email addresses from a pattern.** Give a domain, pick a house style
  (`jane@`, `jane.smith@`, `jsmith@`, `janesmith@`) and every missing address is
  filled in. Addresses already typed are never overwritten.
- **Opening hours presets.** Pick a common week, or set one day and copy it
  across, instead of typing seven lines of times.
- **Save progress / Resume.** Writes a small JSON file to the customer's own
  device and reads it back later. Still nothing uploaded.
- **Rather fill it out manually?** A permanent button hands over the plain
  classic CRF spreadsheet for anyone who would rather type it into Excel.

## Running it

```bash
npm install
npm run dev        # development server
npm run build      # production build into dist/
npm run preview    # Vite's preview server
```

To preview the build exactly as the host serves it, headers and all:

```bash
npm run build
node scripts/serve-dist.mjs     # http://127.0.0.1:4173
```

## Testing

```bash
npm test           # unit tests (vitest)
npm run test:e2e   # end-to-end tests (playwright, needs a build first)
npm run verify     # headers check + unit tests + build + end-to-end tests
```

The end-to-end suite runs against `scripts/serve-dist.mjs`, so the real
Content-Security-Policy is enforced while the tests drive the page. It asserts,
among other things, that the page makes **no outside requests**, writes
**nothing** to `localStorage`, `sessionStorage` or cookies, and still produces a
valid `.xlsx`.

Playwright needs a Chromium. Either run `npx playwright install chromium` once,
or point at one you already have:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome npm run test:e2e
```

## Deploying

The build is a folder of static files — host it anywhere that can serve them.
`vercel.json` is generated from `security/headers.js`:

```bash
npm run headers         # regenerate vercel.json
npm run headers:check   # fail if it has drifted (runs in npm run verify)
```

If you host it somewhere other than Vercel, copy the same headers across.
`security/headers.js` is the single source of truth; `npm test` fails if
`vercel.json` no longer matches it.

## Layout

```
index.html                  page shell (no inline script or style)
security/headers.js         CSP and hardening headers, single source of truth
scripts/generate-headers.mjs  writes vercel.json
scripts/serve-dist.mjs      static preview server with the production headers
scripts/inspect_workbook.py dumps an .xlsx for comparison with the classic form
src/lib/model.js            the form's data model and team-default logic
src/lib/validation.js       every rule about what counts as a complete answer
src/lib/hours.js            opening-hours presets, copying and summarising
src/lib/bulk.js             pasted staff lists and email patterns
src/lib/draft.js            save / resume, with strict parsing of the file
src/lib/exportWorkbook.js   builds the .xlsx with ExcelJS
src/lib/text.js             control-character and filename scrubbing
src/lib/webmcp.js           optional, deliberately tiny assistant integration
src/components/             the UI
tests/unit, tests/e2e       the suites described above
public/Telecom-Networks-CRF-blank-form.xlsx   the manual fallback download
```

Security decisions and the reasoning behind them are in
[SECURITY.md](SECURITY.md).
