import { useMemo, useState } from 'react'
import { Copy, ListPlus, Mail, Plus, Trash2, Wand2 } from 'lucide-react'

import {
  LIMITS,
  MAX_STAFF,
  SETTING_KEYS,
  TEAM_PRESETS,
  createPerson,
  createSettings,
  describeSettings,
  effectiveSettings,
  matchPreset,
  needsEmail,
  normaliseSettings,
  usesTeamDefaults,
} from '../../lib/model.js'
import { settingsErrors } from '../../lib/validation.js'
import { EMAIL_PATTERNS, applyEmailPattern, parsePeopleList } from '../../lib/bulk.js'
import { Callout, ChoiceField, Field, TextArea, TextInput, classNames } from '../ui.jsx'
import { SettingsEditor } from '../SettingsEditor.jsx'

function hasSettingErrors(personErrors) {
  return SETTING_KEYS.some((field) => personErrors[field])
}

/** Pick a common setup in one click, then answer only what is left over. */
function TeamOptions({ data, setData, errors, customCount, onApplyToAll }) {
  const [editing, setEditing] = useState(false)
  const chosen = SETTING_KEYS.some((key) => data.defaults[key])
  const preset = matchPreset(data.defaults)
  const outstanding = Object.keys(settingsErrors(data.defaults))
  const setDefaults = (settings) => setData((current) => ({ ...current, defaults: normaliseSettings(settings) }))

  if (!chosen && !editing) {
    return (
      <section className="panel panel--defaults" aria-labelledby="defaults-heading">
        <h2 id="defaults-heading">How is your team set up?</h2>
        <p className="panel__lead">Pick the closest match. It applies to everyone, and you can change it later.</p>
        <ul className="preset-grid">
          {TEAM_PRESETS.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => setDefaults(createSettings(item.settings))}>
                <strong>{item.title}</strong>
                <span>{item.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="link-button" onClick={() => setEditing(true)}>
          Or choose each option yourself
        </button>
      </section>
    )
  }

  return (
    <section className="panel panel--defaults" aria-labelledby="defaults-heading">
      <h2 id="defaults-heading">Options for everyone</h2>

      {chosen && !editing && (
        <p className="panel__summary">
          <span className="chip chip--preset">{preset ? preset.title : 'Your choices'}</span>
          <span>{describeSettings(data.defaults)}</span>
        </p>
      )}

      {outstanding.length > 0 && !editing && (
        <div className="panel__outstanding">
          <p className="panel__lead">
            {outstanding.length === 1 ? 'Just one thing left to choose.' : 'A couple of things left to choose.'}
          </p>
          <SettingsEditor
            settings={data.defaults}
            errors={errors}
            anchorPrefix="default"
            only={outstanding}
            onChange={setDefaults}
          />
        </div>
      )}

      {editing && (
        <SettingsEditor
          settings={data.defaults}
          errors={errors}
          anchorPrefix="default"
          onChange={setDefaults}
        />
      )}

      <div className="panel__footer">
        <button type="button" className="link-button" onClick={() => setEditing((value) => !value)}>
          {editing ? 'Done with these options' : 'Change these options'}
        </button>
        {customCount > 0 && (
          <button type="button" className="secondary-button" onClick={onApplyToAll}>
            <Wand2 size={17} aria-hidden="true" /> Use these for everyone
          </button>
        )}
      </div>
    </section>
  )
}

function PersonRow({
  person,
  index,
  defaults,
  errors,
  expanded,
  onToggleExpanded,
  onChange,
  onDuplicate,
  onRemove,
  canRemove,
}) {
  const settings = effectiveSettings(person, defaults)
  const inherits = usesTeamDefaults(person)
  const emailRequired = needsEmail(settings)

  return (
    <li className={classNames('person', !inherits && 'person--custom')}>
      <div className="person__row">
        <span className="person__index" aria-hidden="true">{index + 1}</span>

        <Field label="Full name" anchor={`staff-${index}-name`} error={errors.name} className="person__name">
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              autoComplete="off"
              maxLength={LIMITS.name}
              placeholder="First and last name"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              value={person.name}
              onChange={(value) => onChange({ ...person, name: value })}
            />
          )}
        </Field>

        <Field
          label="Email address"
          optional={!emailRequired}
          anchor={`staff-${index}-email`}
          error={errors.email}
          className="person__email"
        >
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="email"
              autoComplete="off"
              maxLength={LIMITS.email}
              placeholder="name@company.co.uk"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              value={person.email}
              onChange={(value) => onChange({ ...person, email: value })}
            />
          )}
        </Field>

        <div className="person__actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => onDuplicate(person)}
            aria-label={`Copy ${person.name.trim() || `person ${index + 1}`}`}
            title="Add another person with the same options"
          >
            <Copy size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="ghost-button ghost-button--danger"
            onClick={() => onRemove(person.id)}
            disabled={!canRemove}
            aria-label={`Remove ${person.name.trim() || `person ${index + 1}`}`}
            title="Remove this person"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="person__settings">
        {inherits ? (
          <span className="person__summary-text">Same options as everyone else</span>
        ) : (
          <p className="person__summary">
            <span className="chip chip--custom">Set individually</span>
            <span className="person__summary-text">{describeSettings(settings)}</span>
          </p>
        )}
        <div className="person__setting-actions">
          {!inherits && (
            <button type="button" className="link-button" onClick={() => onChange({ ...person, custom: null })}>
              Back to team options
            </button>
          )}
          <button
            type="button"
            className="link-button"
            aria-expanded={expanded}
            onClick={() => {
              if (inherits && !expanded) onChange({ ...person, custom: createSettings(defaults) })
              onToggleExpanded(person.id)
            }}
          >
            {expanded ? 'Hide options' : inherits ? 'Different for this person' : 'Edit their options'}
          </button>
        </div>
      </div>

      {expanded && person.custom && (
        <div className="person__editor">
          <SettingsEditor
            compact
            settings={person.custom}
            errors={errors}
            anchorPrefix={`staff-${index}`}
            onChange={(next) => onChange({ ...person, custom: next })}
          />
        </div>
      )}
    </li>
  )
}

export function PeopleStep({ data, setData, errors }) {
  const [expanded, setExpanded] = useState(() => new Set())
  const [quickName, setQuickName] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [domain, setDomain] = useState('')
  const [patternId, setPatternId] = useState('first.last')
  const [status, setStatus] = useState('')

  const staffErrors = errors.staff || []
  const defaultErrors = errors.defaults || {}
  const customCount = useMemo(() => data.staff.filter((person) => person.custom).length, [data.staff])
  const atLimit = data.staff.length >= MAX_STAFF

  const toggleExpanded = (id) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updatePerson = (updated) => {
    setData((current) => ({
      ...current,
      staff: current.staff.map((person) => (person.id === updated.id ? updated : person)),
    }))
  }

  const addPeople = (entries) => {
    if (!entries.length) return
    setData((current) => {
      const room = Math.max(0, MAX_STAFF - current.staff.length)
      const additions = entries.slice(0, room).map((entry) => createPerson(entry))
      // The blank starter row makes way for the first real person.
      const staff = current.staff.length === 1 && !current.staff[0].name.trim() && !current.staff[0].email.trim()
        ? additions
        : [...current.staff, ...additions]
      return { ...current, staff: staff.length ? staff : current.staff }
    })
  }

  const handleQuickAdd = () => {
    const name = quickName.trim()
    if (!name || atLimit) return
    addPeople([{ name }])
    setQuickName('')
    setStatus(`Added ${name}.`)
  }

  const handleBulkAdd = () => {
    const entries = parsePeopleList(bulkText)
    if (!entries.length) {
      setStatus('No names were found in that list.')
      return
    }
    addPeople(entries)
    setBulkText('')
    setStatus(`Added ${entries.length} ${entries.length === 1 ? 'person' : 'people'}.`)
  }

  const handleDuplicate = (person) => {
    if (atLimit) return
    setData((current) => {
      const position = current.staff.findIndex((item) => item.id === person.id)
      const copy = createPerson({
        custom: person.custom ? createSettings(person.custom) : null,
      })
      const staff = [...current.staff]
      staff.splice(position + 1, 0, copy)
      return { ...current, staff }
    })
    setStatus('Added a new person with the same options.')
  }

  const handleRemove = (id) => {
    setData((current) => {
      if (current.staff.length <= 1) return current
      return { ...current, staff: current.staff.filter((person) => person.id !== id) }
    })
    setStatus('Removed a person.')
  }

  const handleApplyDefaultsToAll = () => {
    if (!customCount) return
    const question =
      customCount === 1
        ? 'One person has their own options. Replace them with the team options?'
        : `${customCount} people have their own options. Replace them all with the team options?`
    if (!window.confirm(question)) return
    setData((current) => ({ ...current, staff: current.staff.map((person) => ({ ...person, custom: null })) }))
    setExpanded(new Set())
    setStatus('Everyone now uses the same options.')
  }

  const handleEmailPattern = () => {
    const result = applyEmailPattern(data.staff, { domain, patternId })
    if (!result.filled) {
      setStatus('No addresses could be filled in. Check the domain and that names are entered.')
      return
    }
    setData((current) => ({ ...current, staff: result.staff }))
    setStatus(`Filled in ${result.filled} email ${result.filled === 1 ? 'address' : 'addresses'}.`)
  }

  return (
    <section className="step-panel" aria-labelledby="step-heading">
      <p className="step-kicker">Step 2 of 4</p>
      <h1 id="step-heading">Your team</h1>
      <p className="step-lead">Set the options once, then add your people.</p>

      <TeamOptions
        data={data}
        setData={setData}
        errors={defaultErrors}
        customCount={customCount}
        onApplyToAll={handleApplyDefaultsToAll}
      />

      <section className="panel" aria-labelledby="staff-heading">
        <h2 id="staff-heading">
          Who needs a phone or an app? <span className="panel__count">{data.staff.length}</span>
        </h2>

        <ul className="person-list">
          {data.staff.map((person, index) => {
            const personErrors = staffErrors[index] || {}
            return (
              <PersonRow
                key={person.id}
                person={person}
                index={index}
                defaults={data.defaults}
                errors={personErrors}
                expanded={expanded.has(person.id) || hasSettingErrors(personErrors)}
                onToggleExpanded={toggleExpanded}
                onChange={updatePerson}
                onDuplicate={handleDuplicate}
                onRemove={handleRemove}
                canRemove={data.staff.length > 1}
              />
            )
          })}
        </ul>

        {defaultErrors.settings && <p className="field__error">{defaultErrors.settings}</p>}

        <div className="quick-add">
          <Field label="Add someone" className="quick-add__field">
            {({ id }) => (
              <TextInput
                id={id}
                autoComplete="off"
                maxLength={LIMITS.name}
                placeholder="Type a name and press Enter"
                value={quickName}
                onChange={setQuickName}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  handleQuickAdd()
                }}
              />
            )}
          </Field>
          <button
            type="button"
            className="primary-button primary-button--small"
            onClick={handleQuickAdd}
            disabled={atLimit}
          >
            <Plus size={17} aria-hidden="true" /> Add
          </button>
        </div>

        {atLimit && (
          <Callout tone="warning">
            <p>This form holds up to {MAX_STAFF} people. If you have more, please call and we will take the list.</p>
          </Callout>
        )}

        <details className="tool-details">
          <summary>
            <ListPlus size={16} aria-hidden="true" /> Paste a list instead
          </summary>
          <div className="tool-details__body">
            <Field label="Your staff list" hint="One person per line. Add an email after a comma if you have it.">
              {({ id }) => (
                <TextArea
                  id={id}
                  rows={5}
                  maxLength={LIMITS.notes}
                  placeholder={'Jane Smith, jane@company.co.uk\nRoss Kerr\nAisha Khan <aisha@company.co.uk>'}
                  value={bulkText}
                  onChange={setBulkText}
                />
              )}
            </Field>
            <button type="button" className="secondary-button" onClick={handleBulkAdd} disabled={atLimit}>
              <ListPlus size={17} aria-hidden="true" /> Add these people
            </button>
          </div>
        </details>

        <details className="tool-details">
          <summary>
            <Mail size={16} aria-hidden="true" /> Fill in email addresses for me
          </summary>
          <div className="tool-details__body">
            <p className="tool-details__intro">
              Give us your domain and house style, and anyone still missing an address gets one. Addresses you have
              already typed are left alone.
            </p>
            <Field label="Email domain" hint="Just the part after the @">
              {({ id }) => (
                <TextInput
                  id={id}
                  autoComplete="off"
                  maxLength={LIMITS.email}
                  placeholder="company.co.uk"
                  value={domain}
                  onChange={setDomain}
                />
              )}
            </Field>
            <ChoiceField
              label="Pattern"
              columns="four"
              options={EMAIL_PATTERNS.map((pattern) => ({ value: pattern.id, label: pattern.label }))}
              value={patternId}
              onChange={setPatternId}
            />
            <button type="button" className="secondary-button" onClick={handleEmailPattern}>
              <Wand2 size={17} aria-hidden="true" /> Fill in missing addresses
            </button>
          </div>
        </details>

        <p className="status-line" role="status" aria-live="polite">{status}</p>
      </section>
    </section>
  )
}
