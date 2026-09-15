#!/usr/bin/env node
// Regenerates every host configuration file from security/headers.js, so the
// same security headers are sent whichever way the site ends up being hosted.
//
//   npm run headers        writes the files
//   npm run headers:check  fails if any committed file is out of date

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { GENERATED_FILES } from '../security/headers.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const checking = process.argv.includes('--check')
const stale = []

for (const file of GENERATED_FILES) {
  const target = join(root, file.path)
  const expected = file.build()

  if (checking) {
    let actual = null
    try {
      actual = readFileSync(target, 'utf8')
    } catch {
      stale.push(`${file.path} (missing)`)
      continue
    }
    if (actual !== expected) stale.push(file.path)
    continue
  }

  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, expected)
  console.log(`Wrote ${file.path}`)
}

if (checking) {
  if (stale.length) {
    console.error(`Out of date: ${stale.join(', ')}\nRun: npm run headers`)
    process.exit(1)
  }
  console.log(`All ${GENERATED_FILES.length} host configuration files match security/headers.js`)
}
