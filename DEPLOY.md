# Putting the form online

About five minutes, all in a web browser. You do not need to install anything,
open a terminal, or edit any files. Everything the site needs is already in the
repository.

---

## Put it online

1. Go to **[vercel.com](https://vercel.com)** and click **Sign Up** (or **Log
   In**). Choose **Continue with GitHub** and sign in as the account that owns
   `gavinscotttn-ui/Sekunde`.

2. On the Vercel dashboard, click **Add New…** → **Project**.

3. Find **Sekunde** in the list and click **Import**. If it is not listed,
   click **Adjust GitHub App Permissions** and give Vercel access to the
   repository, then come back.

4. Vercel fills in the settings by itself — Framework *Vite*, build command
   `npm run build`, output directory `dist`. **Leave everything as it is.** There
   are no environment variables to add.

5. Click **Deploy**, and wait a minute or two.

Vercel then shows you a link like `sekunde-abc123.vercel.app`. That is your
form, live. Click it.

## Check it worked

Open the link and go through these four:

1. The page loads and asks for a **company name**.
2. Click **Continue**, pick a setup, add yourself as a person, and work through
   to the end.
3. On the last step, click **Download completed CRF**. Open the spreadsheet —
   four tabs, your answers in them.
4. Back on the form, click **Download the form** in the right-hand column. The
   plain classic CRF should open in Excel.

If all four work, you are done. Send the link to a customer.

## Put it on your own web address

The `vercel.app` link works perfectly well, but something like
`crf.telecomnetworks.co.uk` looks better on an email to a customer.

1. In Vercel, open the project → **Settings** → **Domains**.
2. Type the address you want and click **Add**.
3. Vercel shows you one DNS record to create. Give that to whoever manages your
   DNS — it is a single CNAME.
4. Once the record is live, Vercel sorts out the HTTPS certificate on its own.

## Changing it later

Anything pushed to this branch on GitHub goes live automatically, usually within
a minute. Nothing else to do.

If a change ever turns out to be wrong: in Vercel, open the project →
**Deployments**, find the last version that was fine, click the **⋯** menu
beside it and choose **Promote to Production**. That puts it straight back.

## Things worth knowing

- **No customer data ever reaches Vercel.** The form runs entirely in the
  customer's browser, and the spreadsheet is built on their own machine. Vercel
  only ever serves the page itself.
- **The page is hidden from Google on purpose.** The link is meant to be sent to
  a customer, not found in a search.
- **The security headers come across automatically** — they are in
  `vercel.json`, which Vercel reads on every deployment. There is nothing to
  switch on.

Hosting it somewhere other than Vercel one day? See
[deploy/README.md](deploy/README.md). You will not need it otherwise.
