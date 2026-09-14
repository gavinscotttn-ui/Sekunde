import { describe, expect, it } from 'vitest'

import { SETTING_KEYS, TEAM_PRESETS, createSettings, describeSettings, matchPreset } from '../../src/lib/model.js'
import { settingsErrors } from '../../src/lib/validation.js'

describe('team presets', () => {
  it('offers a few genuinely different starting points', () => {
    expect(TEAM_PRESETS.length).toBeGreaterThanOrEqual(3)
    const ids = TEAM_PRESETS.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only ever sets keys the model knows about', () => {
    for (const preset of TEAM_PRESETS) {
      for (const key of Object.keys(preset.settings)) {
        expect(SETTING_KEYS).toContain(key)
      }
    }
  })

  it('leaves at most one question outstanding, so the follow-up copy stays true', () => {
    for (const preset of TEAM_PRESETS) {
      const outstanding = Object.keys(settingsErrors(createSettings(preset.settings)))
      expect(outstanding.length, `${preset.id} leaves ${outstanding.join(', ')}`).toBeLessThanOrEqual(1)
    }
  })

  it('recognises its own presets and nothing else', () => {
    for (const preset of TEAM_PRESETS) {
      expect(matchPreset(createSettings(preset.settings))?.id).toBe(preset.id)
    }
    expect(matchPreset(createSettings())).toBeNull()
  })

  it('describes a chosen preset in plain words', () => {
    const settings = createSettings({ ...TEAM_PRESETS[0].settings })
    expect(describeSettings(settings)).toContain('Corded phone')
  })
})
