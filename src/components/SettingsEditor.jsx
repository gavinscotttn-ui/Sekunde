// The six per-user choices. The same editor is used for the team defaults and
// for an individual who needs something different, so the two can never drift
// apart. Pass `only` to show just the questions still outstanding.

import {
  CALLER_ID_OPTIONS,
  HANDSET_OPTIONS,
  LIMITS,
  MOBILE_APP_OPTIONS,
  YES_NO,
  normaliseSettings,
} from '../lib/model.js'
import { ChoiceField, Field, HelpNote, TextInput } from './ui.jsx'

export const SETTING_HELP = {
  callerId:
    'This is the number customers see when the person calls out. “Main office number” keeps everyone looking like one switchboard. “Their direct dial” shows that person’s own number. “Another number” is any other number on your account.',
  apps:
    'The mobile and desktop apps let staff make, receive and transfer work calls over the internet — handy for remote working, hot-desking and out-of-hours cover. Each person who uses an app needs an email address so we can send their sign-in.',
  voicemail:
    'Voicemail to email sends a copy of each message to the person’s inbox, so they can listen without dialling in.',
}

export function SettingsEditor({ settings, errors = {}, onChange, anchorPrefix, compact = false, only }) {
  const update = (field, value) => onChange(normaliseSettings({ ...settings, [field]: value }))
  const anchor = (field) => (anchorPrefix ? `${anchorPrefix}-${field}` : undefined)
  const shows = (field) => !only || only.includes(field)

  return (
    <div className={compact ? 'settings-editor settings-editor--compact' : 'settings-editor'}>
      {shows('voicemail') && (
        <ChoiceField
          label="Voicemail"
          columns="two"
          anchor={anchor('voicemail')}
          error={errors.voicemail}
          options={YES_NO}
          value={settings.voicemail}
          onChange={(value) => update('voicemail', value)}
        />
      )}

      {shows('voicemailToEmail') && settings.voicemail === 'yes' && (
        <ChoiceField
          label="Send voicemail to email"
          columns="two"
          anchor={anchor('voicemailToEmail')}
          error={errors.voicemailToEmail}
          options={YES_NO}
          value={settings.voicemailToEmail}
          onChange={(value) => update('voicemailToEmail', value)}
        >
          <HelpNote title="What does voicemail to email do?">{SETTING_HELP.voicemail}</HelpNote>
        </ChoiceField>
      )}

      {shows('callerId') && (
        <ChoiceField
          label="Number shown on outgoing calls"
          columns="three"
          anchor={anchor('callerId')}
          error={errors.callerId}
          options={CALLER_ID_OPTIONS}
          value={settings.callerId}
          onChange={(value) => update('callerId', value)}
        >
          {settings.callerId === 'Alternative number' && (
            <Field
              label="Which number should be shown?"
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
          <HelpNote title="Which number should people see?">{SETTING_HELP.callerId}</HelpNote>
        </ChoiceField>
      )}

      {shows('handset') && (
        <ChoiceField
          label="Desk phone"
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
          label="Mobile app"
          hint="Whichever most of your team carries"
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
          label="Desktop app"
          columns="two"
          anchor={anchor('desktopApp')}
          error={errors.desktopApp}
          options={YES_NO}
          value={settings.desktopApp}
          onChange={(value) => update('desktopApp', value)}
        >
          <HelpNote title="What do the apps do?">{SETTING_HELP.apps}</HelpNote>
        </ChoiceField>
      )}
    </div>
  )
}
