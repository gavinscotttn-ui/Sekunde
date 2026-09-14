import { ShieldCheck } from 'lucide-react'

import { CONTACT, LIMITS } from '../../lib/model.js'
import { Callout, Field, TextInput } from '../ui.jsx'

export function AboutStep({ data, setData, errors }) {
  const set = (field) => (value) => setData((current) => ({ ...current, [field]: value }))

  return (
    <section className="step-panel" aria-labelledby="step-heading">
      <p className="step-kicker">Step 1 of 4</p>
      <h1 id="step-heading">Let’s set up your phones</h1>
      <p className="step-lead">
        Four short steps, about five minutes. We turn your answers into the spreadsheet our engineers need.
      </p>

      <div className="form-grid form-grid--two">
        <Field label="Company name" anchor="companyName" error={errors.companyName}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              autoComplete="organization"
              maxLength={LIMITS.name}
              placeholder="e.g. Northshore Engineering Ltd"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              value={data.companyName}
              onChange={set('companyName')}
            />
          )}
        </Field>

        <Field label="Your full name" anchor="completedBy" error={errors.completedBy}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              autoComplete="name"
              maxLength={LIMITS.name}
              placeholder="First and last name"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              value={data.completedBy}
              onChange={set('completedBy')}
            />
          )}
        </Field>
      </div>

      <Field
        label="Your email address"
        optional
        hint="So we know who to reply to"
        anchor="contactEmail"
        error={errors.contactEmail}
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="email"
            autoComplete="email"
            maxLength={LIMITS.email}
            placeholder="you@company.co.uk"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            value={data.contactEmail}
            onChange={set('contactEmail')}
          />
        )}
      </Field>

      <Callout tone="privacy" icon={ShieldCheck} title="Your answers stay on this device">
        <p>
          No account, no database, no cookies, no analytics. Everything happens in this browser tab and disappears when
          you close it.
        </p>
      </Callout>

      <section className="ahead">
        <h2>Handy to have nearby</h2>
        <ul>
          <li>Staff names, and email addresses for anyone using an app</li>
          <li>The phone numbers moving to the new system</li>
          <li>Your opening hours</li>
          <li>A mobile number for emergency diverts</li>
        </ul>
        <p className="ahead__note">
          Missing something? Save your progress at any point, or call <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> and
          we will fill it in with you.
        </p>
      </section>
    </section>
  )
}
