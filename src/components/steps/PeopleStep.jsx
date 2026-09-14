import { useMemo, useState } from 'react'
import { Copy, ListPlus, Mail, Plus, Trash2, UserRound, Users, Wand2 } from 'lucide-react'

import {
  LIMITS,
  MAX_STAFF,
  createPerson,
  createSettings,
  describeSettings,
  effectiveSettings,
  needsEmail,
  normaliseSettings,
  usesTeamDefaults,
} from '../../lib/model.js'
import { EMAIL_PATTERNS, applyEmailPattern, parsePeopleList } from '../../lib/bulk.js'
import { Callout, ChoiceField, Field, TextArea, TextInput, classNames } from '../ui.jsx'
import { SettingsEditor } from '../SettingsEditor.jsx'

const SETTING_FIELDS = ['voicemail', 'voicemailToEmail', 'callerId', 'callerIdNumber', 'handset', 'mobileApp', 'desktopApp']

function hasSettingErrors(personErrors) {
  return SETTING_FIELDS.some((field) => personErrors[field])
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
        <span className="person__index" aria-hidden="true">
          <UserRound size={16} />
          {index + 1}
        </span>

        <Field label="Full name" required anchor={`staff-${index}-name`} error={errors.name} className="person__name">
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
          hint={emailRequired ? 'Needed for the apps or voicemail chosen' : 'Optional'}
          required={emailRequired}
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
            title="Add another person with the same settings"
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
        <p className="person__summary">
          <span className={classNames('chip', inherits ? 'chip--default' : 'chip--custom')}>
            {inherits ? 'Team defaults' : 'Set individually'}
          </span>
          <span className="person__summary-text">{describeSettings(settings) || 'No options chosen yet'}</span>
        </p>
        <div className="person__setting-actions">
          {!inherits && (
            <button
              type="button"
              className="link-button"
              onClick={() => onChange({ ...person, custom: null })}
            >
              Back to team defaults
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
      return { ...current, staff: [...current.staff, ...additions] }
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
        name: '',
        email: '',
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
        ? 'One person has their own options. Replace them with the team defaults?'
        : `${customCount} people have their own options. Replace them all with the team defaults?`
    if (!window.confirm(question)) return
    setData((current) => ({
      ...current,
      staff: current.staff.map((person) => ({ ...person, custom: null })),
    }))
    setExpanded(new Set())
    setStatus('Everyone now uses the team defaults.')
  }

  const handleEmailPattern = () => {
    const result = applyEmailPattern(data.staff, { domain, patternId })
    if (!result.filled) {
      setStatus('No email addresses could be filled in. Check the domain and that names are entered.')
      return
    }
    setData((current) => ({ ...current, staff: result.staff }))
    setStatus(`Filled in ${result.filled} email ${result.filled === 1 ? 'address' : 'addresses'}.`)
  }

  return (
    <section className="step-panel" aria-labelledby="step-heading">
      <p className="step-kicker">Step 2 of 4</p>
      <h1 id="step-heading">Your team</h1>
      <p className="step-lead">
        Set the options once for the whole team, then add your people. Change an individual only where they need
        something different.
      </p>

      <section className="panel panel--defaults" aria-labelledby="defaults-heading">
        <header className="panel__header">
          <span className="panel__icon" aria-hidden="true"><Users size={20} /></span>
          <div>
            <h2 id="defaults-heading">Options for everyone</h2>
            <p>
              These apply to every person below and to anyone you add next. Nobody has to be set up twice.
            </p>
          </div>
        </header>

        <SettingsEditor
          settings={data.defaults}
          errors={defaultErrors}
          anchorPrefix="default"
          onChange={(next) => setData((current) => ({ ...current, defaults: normaliseSettings(next) }))}
        />

        {customCount > 0 && (
          <div className="panel__footer">
            <p>
              {customCount === 1 ? 'One person has' : `${customCount} people have`} their own options at the moment.
            </p>
            <button type="button" className="secondary-button" onClick={handleApplyDefaultsToAll}>
              <Wand2 size={17} aria-hidden="true" /> Use these for everyone
            </button>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="staff-heading">
        <header className="panel__header">
          <span className="panel__icon" aria-hidden="true"><UserRound size={20} /></span>
          <div>
            <h2 id="staff-heading">
              People <span className="panel__count">{data.staff.length}</span>
            </h2>
            <p>Add everyone who needs a phone, an app or a voicemail box.</p>
          </div>
        </header>

        <ul className="person-list">
          {data.staff.map((person, index) => {
            const personErrors = staffErrors[index] || {}
            const forceOpen = hasSettingErrors(personErrors)
            return (
              <PersonRow
                key={person.id}
                person={person}
                index={index}
                defaults={data.defaults}
                errors={personErrors}
                expanded={expanded.has(person.id) || forceOpen}
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
          <button type="button" className="primary-button primary-button--small" onClick={handleQuickAdd} disabled={atLimit}>
            <Plus size={17} aria-hidden="true" /> Add person
          </button>
        </div>

        {atLimit && (
          <Callout tone="warning">
            <p>
              This form holds up to {MAX_STAFF} people. If you have more, please call us and we will handle the list
              for you.
            </p>
          </Callout>
        )}

        <details className="tool-details">
          <summary>
            <ListPlus size={16} aria-hidden="true" /> Add several people at once
          </summary>
          <div className="tool-details__body">
            <Field
              label="Paste your staff list"
              hint="One person per line. Add an email after a comma if you have it."
            >
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
            <Mail size={16} aria-hidden="true" /> Fill in email addresses from a pattern
          </summary>
          <div className="tool-details__body">
            <p className="tool-details__intro">
              If your addresses follow a house style, enter the domain and we will fill in anyone still missing one.
              Addresses you have already typed are left alone.
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
