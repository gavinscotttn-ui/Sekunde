// The per-person choices, asked in the words a customer would use. The same
// editor is used for "what everyone gets" and for one individual who needs
// something different, so the two can never drift apart. Pass `only` to show
// just the questions still outstanding.

import {
  CALLER_ID_OPTIONS,
  HANDSET_OPTIONS,
  LIMITS,
  MOBILE_APP_OPTIONS,
  VOICEMAIL_OPTIONS,
  YES_NO,
  applyVoicemailChoice,
  normaliseSettings,
  voicemailChoice,
} from '../lib/model.js'
import { ChoiceField, Field, HelpNote, TextInput } from './ui.jsx'

export function SettingsEditor({ settings, errors = {}, onChange, anchorPrefix, compact = false, only }) {
  const update = (field, value) => onChange(normaliseSettings({ ...settings, [field]: value }))
  const anchor = (field) => (anchorPrefix ? `${anchorPrefix}-${field}` : undefined)
  const shows = (field) => !only || only.includes(field)

  return (
    <div className={compact ? 'settings-editor settings-editor--compact' : 'settings-editor'}>
      {shows('voicemail') && (
        <ChoiceField
          label="If nobody answers, can callers leave a message?"
          anchor={anchor('voicemail')}
          error={errors.voicemail}
          options={VOICEMAIL_OPTIONS}
          value={voicemailChoice(settings)}
          onChange={(choice) => onChange(normaliseSettings(applyVoicemailChoice(settings, choice)))}
        />
      )}

      {shows('callerId') && (
        <ChoiceField
          label="When they ring someone, what number should show up?"
          columns="three"
          anchor={anchor('callerId')}
          error={errors.callerId}
          options={CALLER_ID_OPTIONS}
          value={settings.callerId}
          onChange={(value) => update('callerId', value)}
        >
          {settings.callerId === 'Alternative number' && (
            <Field
              label="Which number should show up?"
              anchor={anchor('callerIdNumber')}
              error={errors.callerIdNumber}
            >
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  maxLength={LIMITS.phone}
                  placeholder="e.g. 0141 404 5441"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  value={settings.callerIdNumber}
                  onChange={(value) => update('callerIdNumber', value)}
                />
              )}
            </Field>
          )}
        </ChoiceField>
      )}

      {shows('handset') && (
        <ChoiceField
          label="What phone sits on their desk?"
          columns="three"
          anchor={anchor('handset')}
          error={errors.handset}
          options={HANDSET_OPTIONS}
          value={settings.handset}
          onChange={(value) => update('handset', value)}
        />
      )}

      {shows('mobileApp') && (
        <ChoiceField
          label="Do they need to take work calls on their mobile?"
          hint="Whichever phone most of the team carries"
          columns="three"
          anchor={anchor('mobileApp')}
          error={errors.mobileApp}
          options={MOBILE_APP_OPTIONS}
          value={settings.mobileApp}
          onChange={(value) => update('mobileApp', value)}
        />
      )}

      {shows('desktopApp') && (
        <ChoiceField
          label="Do they need to take work calls on their computer?"
          columns="two"
          anchor={anchor('desktopApp')}
          error={errors.desktopApp}
          options={YES_NO}
          value={settings.desktopApp}
          onChange={(value) => update('desktopApp', value)}
        >
          <HelpNote title="What are the apps for?">
            The apps let someone make and take work calls from their mobile or laptop, wherever they are — handy for
            working from home, or covering the phones out of hours. Anyone using an app needs an email address so we
            can send them their sign-in.
          </HelpNote>
        </ChoiceField>
      )}
    </div>
  )
}
