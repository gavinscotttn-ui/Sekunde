#!/usr/bin/env node
// Serves the built site with exactly the headers the host is configured to
// send, so the production Content-Security-Policy can be exercised locally and
// in the end-to-end tests. Static files only: no uploads, no API, no state.

import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BASE_HEADERS } from '../security/headers.js'

const ROOT = resolve(fileURLToPath(new URL('../dist', import.meta.url)))
const PORT = Number(process.env.PORT || 4173)
const HOST = process.env.HOST || '127.0.0.1'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname)
  const candidate = resolve(join(ROOT, normalize(pathname)))
  // Refuse anything that escapes the build directory.
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null
  try {
    return statSync(candidate).isDirectory() ? join(candidate, 'index.html') : candidate
  } catch {
    return null
  }
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed')
    return
  }

  const file = resolveRequestPath(request.url) ?? join(ROOT, 'index.html')
  let info
  try {
    info = statSync(file)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found')
    return
  }

  const headers = Object.fromEntries(BASE_HEADERS.map(({ key, value }) => [key, value]))
  headers['Content-Type'] = TYPES[extname(file)] || 'application/octet-stream'
  headers['Content-Length'] = info.size
  headers['Cache-Control'] = file.includes(`${sep}assets${sep}`)
    ? 'public, max-age=31536000, immutable'
    : 'no-store, must-revalidate'

  response.writeHead(200, headers)
  if (request.method === 'HEAD') {
    response.end()
    return
  }
  createReadStream(file).pipe(response)
})

server.listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT} with production headers on http://${HOST}:${PORT}`)
})
