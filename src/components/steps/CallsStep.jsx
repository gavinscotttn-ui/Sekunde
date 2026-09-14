import { useState } from 'react'
import { AlertTriangle, CalendarClock, ListTree, Settings2 } from 'lucide-react'

import { CALL_PATTERN_OPTIONS, LIMITS, RECORDING_OPTIONS, YES_NO } from '../../lib/model.js'
import { looksLikeUkMobile } from '../../lib/validation.js'
import {
  Callout,
  CheckRow,
  ChoiceField,
  Field,
  HelpNote,
  QuestionGroup,
  TextArea,
  TextInput,
} from '../ui.jsx'
import { HoursEditor } from '../HoursEditor.jsx'

const HELP = {
  porting:
    'List every number that should move across, including your advertised main numbers and any direct dials. Put a short label beside each one so we know who or what it belongs to.',
  autoAttendant:
    'An auto attendant is the recorded menu callers hear, such as “Press 1 for sales, press 2 for accounts”. Tell us which option each person should answer.',
  recordings:
    'You can send us an audio file you already have, record your own (the BroadSoft Recorder app makes this easy), or ask us to arrange a professional recording, which is chargeable.',
  callPattern:
    '“Ring everyone at once” is fastest to answer. “Ring one after another” follows the order you give us, which suits teams with a first point of contact.',
  pickup:
    'People in the same pick-up group can answer each other’s ringing phones from their own desk — useful when someone steps away.',
  emergency:
    'If the network ever goes down, we divert your calls to this number automatically so nothing is missed. A mobile works best.',
}

export function CallsStep({ data, setData, errors }) {
  const [announcement, setAnnouncement] = useState('')
  const a = data.additional
  const set = (field) => (value) =>
    setData((current) => ({ ...current, additional: { ...current.additional, [field]: value } }))

  const divertWarning =
    a.emergencyDivert.trim() && !errors.emergencyDivert && !looksLikeUkMobile(a.emergencyDivert)

  return (
    <section className="step-panel" aria-labelledby="step-heading">
      <p className="step-kicker">Step 3 of 4</p>
      <h1 id="step-heading">Call handling</h1>
      <p className="step-lead">
        How calls should reach you during normal hours, at lunchtime, out of hours and in the unlikely event of an
        outage. Questions only appear when they apply to you.
      </p>

      <QuestionGroup
        badge={<AlertTriangle size={18} />}
        title="Numbers and keeping calls flowing"
        description="The two things we cannot set your system up without."
      >
        <Field
          label="Emergency divert number"
          hint="Where calls should go if the network is ever unavailable"
          required
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
                  That does not look like a UK mobile number. That is fine if it is deliberate — we will use it as
                  given.
                </p>
              )}
              <HelpNote>{HELP.emergency}</HelpNote>
            </>
          )}
        </Field>

        <Field
          label="Numbers moving to the new system"
          hint="Main numbers and direct dials, one per line"
          required={!a.noNumbersToPort}
          anchor="portNumbers"
          error={errors.portNumbers}
        >
          {({ id, describedBy, invalid }) => (
            <>
              <TextArea
                id={id}
                rows={5}
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
              <HelpNote>{HELP.porting}</HelpNote>
            </>
          )}
        </Field>
      </QuestionGroup>

      <QuestionGroup
        badge={<ListTree size={18} />}
        title="Menus and voicemail"
        description="How callers are greeted and what happens when nobody can pick up."
      >
        <ChoiceField
          label="Do you need an auto attendant?"
          hint="The recorded menu callers hear, such as “press 1 for sales”"
          required
          columns="two"
          anchor="autoAttendant"
          error={errors.autoAttendant}
          options={YES_NO}
          value={a.autoAttendant}
          onChange={set('autoAttendant')}
        >
          <HelpNote>{HELP.autoAttendant}</HelpNote>
        </ChoiceField>

        {a.autoAttendant === 'yes' && (
          <div className="conditional">
            <Field
              label="Menu options and who answers them"
              required
              anchor="autoGroups"
              error={errors.autoGroups}
            >
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
              required
              columns="three"
              anchor="autoRecording"
              error={errors.autoRecording}
              options={RECORDING_OPTIONS}
              value={a.autoRecording}
              onChange={set('autoRecording')}
            >
              <Field label="Notes or a script for the recording" hint="Optional">
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
              <HelpNote>{HELP.recordings}</HelpNote>
            </ChoiceField>

            <ChoiceField
              label="How should the calls ring?"
              required
              columns="two"
              anchor="callPattern"
              error={errors.callPattern}
              options={CALL_PATTERN_OPTIONS}
              value={a.callPattern}
              onChange={set('callPattern')}
            >
              <HelpNote>{HELP.callPattern}</HelpNote>
            </ChoiceField>
          </div>
        )}

        <ChoiceField
          label="Do you want a company voicemail box?"
          hint="One shared mailbox is usually easier to monitor than several"
          required
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
              label="Where should company messages go, and what should the greeting say?"
              hint="Include the mailbox email address if you know it"
              required
              anchor="voicemailPlan"
              error={errors.voicemailPlan}
            >
              {({ id, describedBy, invalid }) => (
                <TextArea
                  id={id}
                  rows={4}
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
      </QuestionGroup>

      <QuestionGroup
        badge={<CalendarClock size={18} />}
        title="Opening hours and on-hold audio"
        description="We build your call schedules from these times."
      >
        <div className="field" data-anchor="hours-general">
          <p className="field__label" id="hours-label">
            When are you open?
            <span className="field__required">Required</span>
          </p>
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
          required
          columns="two"
          anchor="scheduledClosures"
          error={errors.scheduledClosures}
          options={YES_NO}
          value={a.scheduledClosures}
          onChange={set('scheduledClosures')}
        />

        {a.scheduledClosures === 'yes' && (
          <div className="conditional">
            <Field
              label="Which times, and who do they affect?"
              required
              anchor="closureDetails"
              error={errors.closureDetails}
            >
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
          label="Do you want music or a message while callers are on hold?"
          required
          columns="two"
          anchor="onHold"
          error={errors.onHold}
          options={YES_NO}
          value={a.onHold}
          onChange={set('onHold')}
        />

        {a.onHold === 'yes' && (
          <div className="conditional">
            <Field
              label="How will the on-hold audio be supplied?"
              required
              anchor="onHoldPlan"
              error={errors.onHoldPlan}
            >
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
      </QuestionGroup>

      <QuestionGroup
        badge={<Settings2 size={18} />}
        title="Day-to-day administration"
        description="Who looks after the system, and how the team answers for each other."
      >
        <Field
          label="Nominated portal user"
          hint="We train this person to update holiday messages and make changes"
          required
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
          required
          columns="two"
          anchor="pickupGroups"
          error={errors.pickupGroups}
          options={YES_NO}
          value={a.pickupGroups}
          onChange={set('pickupGroups')}
        >
          <HelpNote>{HELP.pickup}</HelpNote>
        </ChoiceField>

        {a.pickupGroups === 'yes' && (
          <div className="conditional">
            <Field label="Who is in each group?" required anchor="pickupDetails" error={errors.pickupDetails}>
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
          required
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

        <Field label="Anything else we should know?" hint="Optional">
          {({ id }) => (
            <TextArea
              id={id}
              rows={4}
              maxLength={LIMITS.notes}
              placeholder="Special routing, installation dates, site access, anything at all."
              value={a.extraNotes}
              onChange={set('extraNotes')}
            />
          )}
        </Field>
      </QuestionGroup>
    </section>
  )
}
