// Opening hours without the typing. Pick a preset, or set one day and copy it
// across — the customer never enters the same times seven times over.

import { CopyPlus } from 'lucide-react'

import { DAYS, LIMITS } from '../lib/model.js'
import { HOURS_PRESETS, applyPreset, copyDayTo, setDay, summariseHours } from '../lib/hours.js'
import { Field, TextArea, classNames } from './ui.jsx'

export function HoursEditor({ hours, errors = {}, onChange, onAnnounce }) {
  const announce = (message) => {
    if (onAnnounce) onAnnounce(message)
  }

  return (
    <div className="hours">
      <div className="hours__presets">
        <span className="hours__presets-label">Start from:</span>
        {HOURS_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="pill-button"
            onClick={() => {
              onChange(applyPreset(hours, preset.id))
              announce(`Opening hours set to ${preset.label}.`)
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {errors.general && <p className="field__error" role="alert">{errors.general}</p>}

      <ul className="hours__list">
        {DAYS.map((day) => {
          const entry = hours.days[day.key]
          const dayError = errors[day.key]
          return (
            <li
              key={day.key}
              className={classNames('hours__day', !entry.open && 'hours__day--closed', dayError && 'hours__day--error')}
              data-anchor={`hours-${day.key}`}
            >
              <div className="hours__toggle">
                <input
                  id={`hours-${day.key}-open`}
                  type="checkbox"
                  checked={entry.open}
                  onChange={(event) => onChange(setDay(hours, day.key, { open: event.target.checked }))}
                />
                <label htmlFor={`hours-${day.key}-open`}>{day.label}</label>
              </div>

              {entry.open ? (
                <div className="hours__times">
                  <label className="hours__time">
                    <span>Opens</span>
                    <input
                      type="time"
                      className="text-input"
                      value={entry.from}
                      aria-invalid={dayError ? true : undefined}
                      onChange={(event) => onChange(setDay(hours, day.key, { from: event.target.value }))}
                    />
                  </label>
                  <label className="hours__time">
                    <span>Closes</span>
                    <input
                      type="time"
                      className="text-input"
                      value={entry.to}
                      aria-invalid={dayError ? true : undefined}
                      onChange={(event) => onChange(setDay(hours, day.key, { to: event.target.value }))}
                    />
                  </label>
                  <button
                    type="button"
                    className="ghost-button"
                    title={`Copy ${day.label}'s times to every day`}
                    aria-label={`Copy ${day.label}'s times to every day`}
                    onClick={() => {
                      onChange(copyDayTo(hours, day.key, 'all'))
                      announce(`Copied ${day.label}'s times to every day.`)
                    }}
                  >
                    <CopyPlus size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <p className="hours__closed">Closed</p>
              )}

              {dayError && <p className="field__error" role="alert">{dayError}</p>}
            </li>
          )
        })}
      </ul>

      <div className="hours__summary" aria-live="polite">
        <strong>Your week</strong>
        <ul>
          {summariseHours(hours).map((row) => (
            <li key={row.label}>
              <span>{row.label}</span>
              <span>{row.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <Field
        label="Anything unusual about these hours?"
        hint="Optional — bank holidays, seasonal changes, a team that works different hours"
      >
        {({ id }) => (
          <TextArea
            id={id}
            rows={3}
            maxLength={LIMITS.notes}
            placeholder="e.g. Closed between Christmas and New Year. The workshop opens at 07:30."
            value={hours.notes}
            onChange={(value) => onChange({ ...hours, notes: value })}
          />
        )}
      </Field>
    </div>
  )
}
