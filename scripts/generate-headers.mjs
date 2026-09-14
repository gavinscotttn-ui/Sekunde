#!/usr/bin/env node
// Regenerates vercel.json from security/headers.js.
//   npm run headers        writes the file
//   npm run headers:check  fails if the committed file is out of date

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { buildVercelConfig } from '../security/headers.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, 'vercel.json')
const expected = `${JSON.stringify(buildVercelConfig(), null, 2)}\n`

if (process.argv.includes('--check')) {
  let actual = ''
  try {
    actual = readFileSync(target, 'utf8')
  } catch {
    console.error('vercel.json is missing. Run: npm run headers')
    process.exit(1)
  }
  if (actual !== expected) {
    console.error('vercel.json is out of date. Run: npm run headers')
    process.exit(1)
  }
  console.log('vercel.json matches security/headers.js')
} else {
  writeFileSync(target, expected)
  console.log(`Wrote ${target}`)
}
