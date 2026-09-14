import { FileSpreadsheet, ShieldCheck } from 'lucide-react'

import { CONTACT, LIMITS } from '../../lib/model.js'
import { Callout, Field, TextInput } from '../ui.jsx'

export function AboutStep({ data, setData, errors }) {
  const set = (field) => (value) => setData((current) => ({ ...current, [field]: value }))

  return (
    <section className="step-panel" aria-labelledby="step-heading">
      <p className="step-kicker">Step 1 of 4</p>
      <h1 id="step-heading">Your customer requirements form</h1>
      <p className="step-lead">
        Answer a few questions about how your team makes and receives calls. We turn them into the completed
        spreadsheet our engineers need — about five minutes for a small team.
      </p>

      <Callout tone="privacy" icon={ShieldCheck} title="Everything stays on this device">
        <p>
          There is no account, no database, no cookies and no analytics here. Your answers live in this browser tab
          only, are used to build the spreadsheet on your own computer, and vanish when you close the page.
        </p>
      </Callout>

      <div className="form-grid form-grid--two">
        <Field label="Company name" required anchor="companyName" error={errors.companyName}>
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

        <Field
          label="Your full name"
          hint="The person filling this in"
          required
          anchor="completedBy"
          error={errors.completedBy}
        >
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
        hint="Optional — only so we know who to reply to about this form"
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

      <ol className="expectations">
        <li>
          <span aria-hidden="true">1</span>
          <strong>Set your team up once</strong>
          <p>Choose the phone, app and voicemail options everyone shares, then only change the exceptions.</p>
        </li>
        <li>
          <span aria-hidden="true">2</span>
          <strong>Tell us how calls should flow</strong>
          <p>Numbers, opening hours, menus and groups — with plain-English explanations beside each question.</p>
        </li>
        <li>
          <span aria-hidden="true">3</span>
          <strong>Download and email</strong>
          <p>Your browser builds the spreadsheet. You attach it to an email in your own email app.</p>
        </li>
      </ol>

      <div className="inline-note">
        <FileSpreadsheet size={18} aria-hidden="true" />
        <p>
          Stuck at any point? Call us on <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> and we will fill it in with
          you over the phone.
        </p>
      </div>
    </section>
  )
}
