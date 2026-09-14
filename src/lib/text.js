// Small text helpers shared by the draft loader and the workbook exporter.
//
// Control characters are removed by code point rather than by a regular
// expression so that no literal control byte ever appears in this source file.

const TAB = 9
const LINE_FEED = 10
const CARRIAGE_RETURN = 13
const SPACE = 32
const DELETE = 127

/** Remove control characters, keeping tabs and newlines that answers may use. */
export function stripControlCharacters(value) {
  if (typeof value !== 'string') return ''
  let result = ''
  for (const character of value.replace(/\r\n?/g, '\n')) {
    const code = character.codePointAt(0)
    const isControl = code < SPACE || code === DELETE
    const isAllowed = code === TAB || code === LINE_FEED || code === CARRIAGE_RETURN
    if (isControl && !isAllowed) continue
    result += character
  }
  return result
}

/** Remove control characters and collapse all whitespace to single spaces. */
export function toSingleLine(value) {
  return stripControlCharacters(value).replace(/\s+/g, ' ').trim()
}

const FILENAME_RESERVED = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*'])

/** Strip everything an operating system refuses to accept in a file name. */
export function stripFilenameCharacters(value) {
  let result = ''
  for (const character of stripControlCharacters(String(value || ''))) {
    if (FILENAME_RESERVED.has(character)) continue
    const code = character.codePointAt(0)
    if (code < SPACE || code === DELETE) continue
    result += character
  }
  return result
}
