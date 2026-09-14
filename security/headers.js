// Single source of truth for the security headers.
//
// vite.config.js injects the Content-Security-Policy into the built index.html
// as a <meta> tag, and scripts/generate-headers.mjs writes the same policy into
// vercel.json so the host sends it as a real HTTP header. A unit test fails the
// build if the two ever drift apart.
//
// The application is a static page: no backend, no API, no storage. The policy
// is written to match that exactly, so anything unexpected is refused by the
// browser rather than merely discouraged by code review.

/** @type {Array<[string, string]>} */
const CSP_DIRECTIVES = [
  // Nothing is allowed unless a directive below says otherwise.
  ['default-src', "'none'"],
  // Only our own bundled JavaScript. No inline scripts, no eval, no CDNs.
  ['script-src', "'self'"],
  // Stylesheets ship as files; inline style attributes are not used anywhere.
  ['style-src', "'self'"],
  // The logo is an SVG file; data: covers any inlined icon assets.
  ['img-src', "'self' data:"],
  ['font-src', "'self'"],
  // The page never calls out: no fetch, no XHR, no WebSocket, no beacon.
  // This is what makes "your answers never leave this device" enforceable.
  ['connect-src', "'none'"],
  ['media-src', "'none'"],
  ['object-src', "'none'"],
  ['frame-src', "'none'"],
  ['worker-src', "'none'"],
  ['manifest-src', "'none'"],
  // No <base> tag can repoint relative URLs, and no form can post anywhere.
  ['base-uri', "'none'"],
  ['form-action', "'none'"],
  // The page may not be framed, so clickjacking is off the table.
  ['frame-ancestors', "'none'"],
  // Blocks the classic DOM-XSS sinks (innerHTML and friends) in supporting
  // browsers. Nothing in the app assigns markup, so no policy is needed.
  ['require-trusted-types-for', "'script'"],
  ['trusted-types', "'none'"],
]

export const CONTENT_SECURITY_POLICY = [
  ...CSP_DIRECTIVES.map(([name, value]) => `${name} ${value}`),
  'upgrade-insecure-requests',
].join('; ')

// frame-ancestors is ignored when a policy arrives in a <meta> tag, and browsers
// log a console warning about it, so the meta copy leaves it out. The HTTP
// header above is what actually stops the page being framed.
export const CONTENT_SECURITY_POLICY_META = [
  ...CSP_DIRECTIVES.filter(([name]) => name !== 'frame-ancestors').map(([name, value]) => `${name} ${value}`),
  'upgrade-insecure-requests',
].join('; ')

export const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'ambient-light-sensor=()',
  'autoplay=()',
  'battery=()',
  'bluetooth=()',
  'camera=()',
  'display-capture=()',
  'geolocation=()',
  'gyroscope=()',
  'hid=()',
  'idle-detection=()',
  'local-fonts=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'serial=()',
  'storage-access=()',
  'usb=()',
  'xr-spatial-tracking=()',
  'interest-cohort=()',
  'browsing-topics=()',
].join(', ')

/** Headers applied to every response. */
export const BASE_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Origin-Agent-Cluster', value: '?1' },
]

/** The Vercel configuration generated from the values above. */
export function buildVercelConfig() {
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    framework: 'vite',
    cleanUrls: true,
    trailingSlash: false,
    headers: [
      { source: '/(.*)', headers: BASE_HEADERS },
      {
        // Fingerprinted bundles never change under the same name.
        source: '/assets/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Always serve the newest form rather than a stale cached copy.
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        source: '/index.html',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ],
  }
}
