import { useMemo, useState } from 'react'

import { CALL_PATTERN_OPTIONS, LIMITS, RECORDING_OPTIONS, YES_NO } from '../../lib/model.js'
import { summariseHours } from '../../lib/hours.js'
import { looksLikeUkMobile, validateStep } from '../../lib/validation.js'
import { Callout, CheckRow, ChoiceField, Field, HelpNote, Section, TextArea, TextInput } from '../ui.jsx'
import { HoursEditor } from '../HoursEditor.jsx'

const HELP = {
  porting:
    'List every number that should move across, including your advertised main numbers and any direct dials. Put a short label beside each one so we know who or what it belongs to.',
  autoAttendant:
    'An auto attendant is the recorded menu callers hear, such as “press 1 for sales, press 2 for accounts”. Tell us which option each person should answer.',
  recordings:
    'You can send us an audio file you already have, record your own, or ask us to arrange a professional recording, which is chargeable. The free BroadSoft Recorder app makes a clean phone recording: search for it on the App Store or Google Play.',
  callPattern:
    '“Ring everyone at once” is fastest to answer. “Ring one after another” follows the order you give us, which suits teams with a first point of contact.',
  pickup:
    'People in the same pick-up group can answer each other’s ringing phones from their own desk — useful when someone steps away.',
  emergency:
    'If the network ever goes down, we divert your calls to this number automatically so nothing is missed. A mobile works best.',
}

// Which answers belong to which section, so a section can show a tick when it
// is finished and a one-line summary when it is closed.
const SECTIONS = [
  { id: 'numbers', title: 'Your numbers', keys: ['emergencyDivert', 'portNumbers'] },
  {
    id: 'menus',
    title: 'Menus and voicemail',
    keys: ['autoAttendant', 'autoGroups', 'autoRecording', 'callPattern', 'companyVoicemail', 'voicemailPlan'],
  },
  { id: 'hours', title: 'Opening hours', keys: ['hours', 'scheduledClosures', 'closureDetails', 'onHold', 'onHoldPlan'] },
  { id: 'admin', title: 'Day-to-day running', keys: ['portalUser', 'pickupGroups', 'pickupDetails', 'presentMain'] },
]

function summarise(id, data) {
  const a = data.additional
  if (id === 'numbers') {
    const divert = a.emergencyDivert.trim()
    const count = a.portNumbers.trim() ? a.portNumbers.trim().split('\n').filter(Boolean).length : 0
    const porting = a.noNumbersToPort
      ? 'no numbers to move'
      : `${count} ${count === 1 ? 'number' : 'numbers'} moving`
    return divert ? `Diverts to ${divert} · ${porting}` : ''
  }
  if (id === 'menus') {
    if (!a.autoAttendant) return ''
    return [
      a.autoAttendant === 'yes' ? 'Auto attendant' : 'No auto attendant',
      a.companyVoicemail === 'yes' ? 'company voicemail' : 'no company voicemail',
    ].join(' · ')
  }
  if (id === 'hours') {
    const week = summariseHours(data.hours)[0]
    return week ? `${week.label}: ${week.text}` : ''
  }
  if (id === 'admin') {
    return a.portalUser.trim() ? `${a.portalUser.trim()} looks after the system` : ''
  }
  return ''
}

export function CallsStep({ data, setData, errors }) {
  const [announcement, setAnnouncement] = useState('')
  const a = data.additional
  const set = (field) => (value) =>
    setData((current) => ({ ...current, additional: { ...current.additional, [field]: value } }))

  // Completeness is judged on the live answers, not on whether errors are on show.
  const liveErrors = useMemo(() => validateStep(data, 2), [data])
  const isComplete = (section) => section.keys.every((key) => !liveErrors[key])
  const firstIncomplete = SECTIONS.find((section) => !isComplete(section))
  const [open, setOpen] = useState(() => (firstIncomplete ? firstIncomplete.id : SECTIONS[0].id))

  const toggle = (id) => setOpen((current) => (current === id ? '' : id))
  const openNext = (index) => {
    const next = SECTIONS.slice(index + 1).find((section) => !isComplete(section)) || SECTIONS[index + 1]
    setOpen(next ? next.id : '')
  }

  const divertWarning =
    a.emergencyDivert.trim() && !errors.emergencyDivert && !looksLikeUkMobile(a.emergencyDivert)

  const sectionProps = (section, index) => ({
    id: section.id,
    title: section.title,
    summary: summarise(section.id, data),
    complete: isComplete(section),
    // A section with an error on show stays open so the problem is visible.
    open: open === section.id || section.keys.some((key) => errors[key]),
    onToggle: toggle,
    onNext: index < SECTIONS.length - 1 ? () => openNext(index) : undefined,
    nextLabel: index < SECTIONS.length - 1 ? `Next: ${SECTIONS[index + 1].title.toLowerCase()}` : undefined,
  })

  return (
    <section className="step-panel" aria-labelledby="step-heading">
      <p className="step-kicker">Step 3 of 4</p>
      <h1 id="step-heading">Call handling</h1>
      <p className="step-lead">Four short topics. Open one at a time — everything is needed unless it says optional.</p>

      <div className="sections">
        <Section {...sectionProps(SECTIONS[0], 0)}>
          <Field
            label="Emergency divert number"
            hint="Where calls go if the network is ever unavailable"
            anchor="emergencyDivert"
            error={errors.emergencyDivert}
          >
            {({ id, describedBy, invalid }) => (
              <>
                <TextInput
                  id={id}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={LIMITS.phone}
                  placeholder="e.g. 07700 900123"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  value={a.emergencyDivert}
                  onChange={set('emergencyDivert')}
                />
                {divertWarning && (
                  <p className="field__notice">
                    That does not look like a UK mobile. Fine if it is deliberate — we will use it as given.
                  </p>
                )}
                <HelpNote title="Why do you need this?">{HELP.emergency}</HelpNote>
              </>
            )}
          </Field>

          <Field
            label="Numbers moving to the new system"
            hint="Main numbers and direct dials, one per line"
            anchor="portNumbers"
            error={errors.portNumbers}
          >
            {({ id, describedBy, invalid }) => (
              <>
                <TextArea
                  id={id}
                  rows={4}
                  maxLength={LIMITS.notes}
                  disabled={a.noNumbersToPort}
                  placeholder={'0141 111 1111 — Main number\n0141 222 2222 — Jane Smith direct dial'}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  value={a.portNumbers}
                  onChange={set('portNumbers')}
                />
                <CheckRow checked={a.noNumbersToPort} onChange={set('noNumbersToPort')}>
                  We have no existing numbers to move across
                </CheckRow>
                <HelpNote title="What should I list?">{HELP.porting}</HelpNote>
              </>
            )}
          </Field>
        </Section>

        <Section {...sectionProps(SECTIONS[1], 1)}>
          <ChoiceField
            label="Do you need an auto attendant?"
            hint="The recorded menu callers hear, such as “press 1 for sales”"
            columns="two"
            anchor="autoAttendant"
            error={errors.autoAttendant}
            options={YES_NO}
            value={a.autoAttendant}
            onChange={set('autoAttendant')}
          >
            <HelpNote title="What is an auto attendant?">{HELP.autoAttendant}</HelpNote>
          </ChoiceField>

          {a.autoAttendant === 'yes' && (
            <div className="conditional">
              <Field label="Menu options and who answers them" anchor="autoGroups" error={errors.autoGroups}>
                {({ id, describedBy, invalid }) => (
                  <TextArea
                    id={id}
                    rows={4}
                    maxLength={LIMITS.notes}
                    placeholder={'Press 1 — Sales: Aisha, Ross\nPress 2 — Accounts: Priya, Michael'}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    value={a.autoGroups}
                    onChange={set('autoGroups')}
                  />
                )}
              </Field>

              <ChoiceField
                label="How will the menu recording be supplied?"
                columns="three"
                anchor="autoRecording"
                error={errors.autoRecording}
                options={RECORDING_OPTIONS}
                value={a.autoRecording}
                onChange={set('autoRecording')}
              >
                <Field label="Notes or a script for the recording" optional>
                  {({ id }) => (
                    <TextArea
                      id={id}
                      rows={3}
                      maxLength={LIMITS.notes}
                      placeholder="“Thank you for calling Northshore Engineering…”"
                      value={a.autoRecordingNotes}
                      onChange={set('autoRecordingNotes')}
                    />
                  )}
                </Field>
                <HelpNote title="How do we get a recording made?">{HELP.recordings}</HelpNote>
              </ChoiceField>

              <ChoiceField
                label="How should the calls ring?"
                columns="two"
                anchor="callPattern"
                error={errors.callPattern}
                options={CALL_PATTERN_OPTIONS}
                value={a.callPattern}
                onChange={set('callPattern')}
              >
                <HelpNote title="Which should I choose?">{HELP.callPattern}</HelpNote>
              </ChoiceField>
            </div>
          )}

          <ChoiceField
            label="Do you want a company voicemail box?"
            hint="One shared mailbox is usually easier to monitor than several"
            columns="two"
            anchor="companyVoicemail"
            error={errors.companyVoicemail}
            options={YES_NO}
            value={a.companyVoicemail}
            onChange={set('companyVoicemail')}
          />

          {a.companyVoicemail === 'yes' && (
            <div className="conditional">
              <Field
                label="Where should company messages go?"
                hint="Include the mailbox email address if you know it"
                anchor="voicemailPlan"
                error={errors.voicemailPlan}
              >
                {({ id, describedBy, invalid }) => (
                  <TextArea
                    id={id}
                    rows={3}
                    maxLength={LIMITS.notes}
                    placeholder="Messages to office@company.co.uk. Greeting to cover open and closed hours."
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    value={a.voicemailPlan}
                    onChange={set('voicemailPlan')}
                  />
                )}
              </Field>
            </div>
          )}
        </Section>

        <Section {...sectionProps(SECTIONS[2], 2)}>
          <div className="field" data-anchor="hours-general">
            <p className="field__label">When are you open?</p>
            <HoursEditor
              hours={data.hours}
              errors={errors.hours || {}}
              onChange={(hours) => setData((current) => ({ ...current, hours }))}
              onAnnounce={setAnnouncement}
            />
            <p className="status-line" role="status" aria-live="polite">{announcement}</p>
          </div>

          <ChoiceField
            label="Do the lines close at lunchtime or at other set times?"
            columns="two"
            anchor="scheduledClosures"
            error={errors.scheduledClosures}
            options={YES_NO}
            value={a.scheduledClosures}
            onChange={set('scheduledClosures')}
          />

          {a.scheduledClosures === 'yes' && (
            <div className="conditional">
              <Field label="Which times, and who do they affect?" anchor="closureDetails" error={errors.closureDetails}>
                {({ id, describedBy, invalid }) => (
                  <TextArea
                    id={id}
                    rows={3}
                    maxLength={LIMITS.notes}
                    placeholder="Sales team lunch: 12:00–13:00, Monday to Friday"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    value={a.closureDetails}
                    onChange={set('closureDetails')}
                  />
                )}
              </Field>
            </div>
          )}

          <ChoiceField
            label="Music or a message while callers are on hold?"
            columns="two"
            anchor="onHold"
            error={errors.onHold}
            options={YES_NO}
            value={a.onHold}
            onChange={set('onHold')}
          />

          {a.onHold === 'yes' && (
            <div className="conditional">
              <Field label="How will the on-hold audio be supplied?" anchor="onHoldPlan" error={errors.onHoldPlan}>
                {({ id, describedBy, invalid }) => (
                  <TextArea
                    id={id}
                    rows={3}
                    maxLength={LIMITS.notes}
                    placeholder="We have an MP3 to send you / please arrange a professional recording"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    value={a.onHoldPlan}
                    onChange={set('onHoldPlan')}
                  />
                )}
              </Field>
              <Callout tone="note">
                <p>
                  Please only send music you are licensed to use, or that is royalty-free. Email audio files to
                  info@telecomnetworks.co.uk with your company name and “Audio Recording” in the subject.
                </p>
              </Callout>
            </div>
          )}
        </Section>

        <Section {...sectionProps(SECTIONS[3], 3)}>
          <Field
            label="Who will look after the system?"
            hint="We train this person to update holiday messages and make changes"
            anchor="portalUser"
            error={errors.portalUser}
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                autoComplete="off"
                maxLength={LIMITS.name}
                placeholder="Full name"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                value={a.portalUser}
                onChange={set('portalUser')}
              />
            )}
          </Field>

          <ChoiceField
            label="Do you need call pick-up groups?"
            columns="two"
            anchor="pickupGroups"
            error={errors.pickupGroups}
            options={YES_NO}
            value={a.pickupGroups}
            onChange={set('pickupGroups')}
          >
            <HelpNote title="What is a pick-up group?">{HELP.pickup}</HelpNote>
          </ChoiceField>

          {a.pickupGroups === 'yes' && (
            <div className="conditional">
              <Field label="Who is in each group?" anchor="pickupDetails" error={errors.pickupDetails}>
                {({ id, describedBy, invalid }) => (
                  <TextArea
                    id={id}
                    rows={3}
                    maxLength={LIMITS.notes}
                    placeholder={'Group 1: Aisha, Ross, Megan\nGroup 2: Priya, Michael'}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    value={a.pickupDetails}
                    onChange={set('pickupDetails')}
                  />
                )}
              </Field>
            </div>
          )}

          <ChoiceField
            label="Should everyone show the main number when dialling out?"
            columns="two"
            anchor="presentMain"
            error={errors.presentMain}
            options={[
              { value: 'yes', label: 'Yes, everyone shows the main number' },
              { value: 'no', label: 'No, use the choices from step 2' },
            ]}
            value={a.presentMain}
            onChange={set('presentMain')}
          />

          <Field label="Anything else we should know?" optional>
            {({ id }) => (
              <TextArea
                id={id}
                rows={3}
                maxLength={LIMITS.notes}
                placeholder="Special routing, installation dates, site access, anything at all."
                value={a.extraNotes}
                onChange={set('extraNotes')}
              />
            )}
          </Field>
        </Section>
      </div>
    </section>
  )
}
