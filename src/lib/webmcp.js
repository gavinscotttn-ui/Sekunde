// Optional integration with browsers that expose a WebMCP model context, so an
// assistant can fill in the two identity fields on the customer's behalf.
//
// Deliberately narrow: the tool can only write the company name and the name of
// the person completing the form, both length limited and stripped of control
// characters. It cannot read what has been typed, change any answer, trigger a
// download, or reach the network.

import { LIMITS } from './model.js'
import { toSingleLine } from './text.js'

export function registerAssistantTools(setData, setStep) {
  const context = typeof document !== 'undefined' ? document.modelContext : undefined
  if (!context || typeof context.registerTool !== 'function') return undefined

  const lifecycle = new AbortController()
  const onFailure = (error) => console.warn('Assistant tool registration was refused', error)

  try {
    Promise.resolve(
      context.registerTool(
        {
          name: 'set_crf_identity',
          title: 'Set the CRF company and form filler',
          description:
            'Set the company name and the full name of the person completing the visible Telecom Networks customer requirements form.',
          inputSchema: {
            type: 'object',
            properties: {
              companyName: { type: 'string', minLength: 2, maxLength: LIMITS.name },
              completedBy: { type: 'string', minLength: 2, maxLength: LIMITS.name },
            },
            required: ['companyName', 'completedBy'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const companyName = toSingleLine(input?.companyName ?? '').slice(0, LIMITS.name)
            const completedBy = toSingleLine(input?.completedBy ?? '').slice(0, LIMITS.name)
            if (companyName.length < 2 || completedBy.length < 2) {
              throw new Error('Both companyName and completedBy must contain at least two characters.')
            }
            setData((current) => ({ ...current, companyName, completedBy }))
            setStep(0)
            return { updated: true, step: 'About you' }
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(onFailure)
  } catch (error) {
    onFailure(error)
  }

  return () => lifecycle.abort()
}
