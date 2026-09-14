import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Download,
  ExternalLink,
  FileSpreadsheet,
  LockKeyhole,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import { downloadWorkbook, emailDetails } from './exportWorkbook.js'

const steps = [
  { short: 'About', title: 'About this form' },
  { short: 'People', title: 'Staff and devices' },
  { short: 'Calls', title: 'Call handling' },
  { short: 'Finish', title: 'Review and download' },
]

const emptyPerson = () => ({
  id: crypto.randomUUID(),
  name: '',
  voicemail: '',
  voicemailToEmail: '',
  email: '',
  callerId: '',
  handset: '',
  mobileApp: '',
  desktopApp: '',
})

const initialData = () => ({
  companyName: '',
  completedBy: '',
  staff: [emptyPerson()],
  additional: {
    emergencyDivert: '',
    portNumbers: '',
    noNumbersToPort: false,
    autoAttendant: '',
    autoGroups: '',
    autoRecording: '',
    autoRecordingNotes: '',
    callPattern: '',
    companyVoicemail: '',
    voicemailPlan: '',
    scheduledClosures: '',
    closureDetails: '',
    openingHours: '',
    onHold: '',
    onHoldPlan: '',
    portalUser: '',
    pickupGroups: '',
    pickupDetails: '',
    presentMain: '',
    extraNotes: '',
  },
})

const explanations = {
  callerId: 'Choose the number customers see when this person calls out. A direct dial is their own work number; an alternative number is another geographic number on your account.',
  apps: 'Mobile and desktop apps let staff make, receive and transfer work calls using an internet connection. They are useful for remote work, hot-desking and out-of-hours cover.',
  porting: 'List every number moving to the new system, including advertised main numbers and direct dials. Add a short label beside each number so we know who or what it belongs to.',
  autoAttendant: 'An auto attendant is the menu callers hear, such as “Press 1 for Sales”. Tell us which people should receive calls for each option.',
  recordings: 'You can supply an existing recording, record your own, or ask Telecom Networks to arrange a professional recording. Professional recording is chargeable.',
  callPattern: 'Simultaneous rings everyone at once. Sequential rings people one by one in the order you provide.',
  pickup: 'People in the same call pick-up group can answer each other’s ringing phones.',
}

function classNames(...values) {
  return values.filter(Boolean).join(' ')
}

function Field({ label, hint, error, required = false, children, fieldKey }) {
  return (
    <div className={classNames('field', error && 'field--error')} data-error-key={error ? fieldKey : undefined}>
      <div className="field__heading">
        <label>{label}{required && <span className="required" aria-label="required">Required</span>}</label>
        {hint && <span className="field__hint">{hint}</span>}
      </div>
      {children}
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  )
}

function ChoiceGroup({ value, onChange, options, label }) {
  return (
    <div className="choice-grid" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          className={classNames('choice', value === option.value && 'choice--selected')}
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <span className="choice__mark">{value === option.value && <Check size={14} strokeWidth={3} />}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function HelpNote({ children }) {
  return (
    <details className="help-note">
      <summary><CircleHelp size={16} /> Why we ask <ChevronDown size={15} className="chevron" /></summary>
      <p>{children}</p>
    </details>
  )
}

function TextInput({ value, onChange, ...props }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} {...props} />
}

function TextArea({ value, onChange, ...props }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} {...props} />
}

function AboutStep({ data, setData, errors }) {
  return (
    <section className="step-panel" aria-labelledby="about-heading">
      <div className="section-kicker">Step 1 of 4</div>
      <h1 id="about-heading">Customer requirements form</h1>
      <p className="lead">Tell us how your team should make and receive calls. We’ll turn your answers into a completed Excel file for you to email to us.</p>

      <div className="privacy-banner">
        <ShieldCheck size={24} />
        <div>
          <strong>Your information stays on this device.</strong>
          <p>This page has no account, database, cookies or analytics. Your answers are kept only in this browser tab, used to create the Excel file, and disappear when you close or refresh the page.</p>
        </div>
      </div>

      <div className="form-grid form-grid--two">
        <Field label="Company name" required error={errors.companyName} fieldKey="companyName">
          <TextInput
            autoComplete="organization"
            maxLength={120}
            placeholder="e.g. Northshore Engineering Ltd"
            value={data.companyName}
            onChange={(companyName) => setData((current) => ({ ...current, companyName }))}
          />
        </Field>
        <Field label="Your full name" hint="The person completing this form" required error={errors.completedBy} fieldKey="completedBy">
          <TextInput
            autoComplete="name"
            maxLength={120}
            placeholder="First and last name"
            value={data.completedBy}
            onChange={(completedBy) => setData((current) => ({ ...current, completedBy }))}
          />
        </Field>
      </div>

      <div className="expectation-grid">
        <div><span>01</span><strong>Add your staff</strong><p>Choose voicemail, apps and phones for each person.</p></div>
        <div><span>02</span><strong>Set up call handling</strong><p>Give us your numbers, schedules, menus and groups.</p></div>
        <div><span>03</span><strong>Download and email</strong><p>We create the XLSX here. You attach it in your own email app.</p></div>
      </div>
    </section>
  )
}

function StaffCard({ person, index, update, remove, canRemove, errors }) {
  const needsEmail = person.voicemailToEmail === 'yes' || person.mobileApp !== 'None' && person.mobileApp !== '' || person.desktopApp === 'yes'
  return (
    <article className="person-card">
      <header className="person-card__header">
        <div className="person-number"><UserRound size={18} /> Person {index + 1}</div>
        {canRemove && (
          <button className="icon-button" type="button" onClick={remove} aria-label={`Remove person ${index + 1}`}>
            <Trash2 size={17} />
          </button>
        )}
      </header>
      <div className="person-card__body">
        <Field label="Full name" required error={errors.name} fieldKey={`staff-${index}-name`}>
          <TextInput autoComplete="off" maxLength={120} placeholder="First and last name" value={person.name} onChange={(value) => update('name', value)} />
        </Field>
        <div className="form-grid form-grid--two">
          <Field label="Voicemail" required error={errors.voicemail} fieldKey={`staff-${index}-voicemail`}>
            <ChoiceGroup label="Voicemail" value={person.voicemail} onChange={(value) => update('voicemail', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </Field>
          <Field label="Voicemail to email" required={person.voicemail === 'yes'} error={errors.voicemailToEmail} fieldKey={`staff-${index}-voicemailToEmail`}>
            <ChoiceGroup label="Voicemail to email" value={person.voicemail === 'no' ? 'no' : person.voicemailToEmail} onChange={(value) => update('voicemailToEmail', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </Field>
        </div>
        <Field label="Email address" required={needsEmail} hint={needsEmail ? 'Needed for selected app or voicemail delivery' : 'Optional'} error={errors.email} fieldKey={`staff-${index}-email`}>
          <TextInput type="email" autoComplete="off" maxLength={180} placeholder="name@company.co.uk" value={person.email} onChange={(value) => update('email', value)} />
        </Field>
        <Field label="Number shown on outgoing calls" required error={errors.callerId} fieldKey={`staff-${index}-callerId`}>
          <ChoiceGroup label="Number shown on outgoing calls" value={person.callerId} onChange={(value) => update('callerId', value)} options={[
            { value: 'Main office number', label: 'Main office' },
            { value: 'Direct dial', label: 'Direct dial' },
            { value: 'Alternative number', label: 'Alternative' },
          ]} />
          <HelpNote>{explanations.callerId}</HelpNote>
        </Field>
        <div className="form-grid form-grid--three">
          <Field label="Desk phone" required error={errors.handset} fieldKey={`staff-${index}-handset`}>
            <ChoiceGroup label="Desk phone" value={person.handset} onChange={(value) => update('handset', value)} options={[
              { value: 'Corded', label: 'Corded' },
              { value: 'Cordless', label: 'Cordless' },
              { value: 'None', label: 'None' },
            ]} />
          </Field>
          <Field label="Mobile app" required error={errors.mobileApp} fieldKey={`staff-${index}-mobileApp`}>
            <ChoiceGroup label="Mobile app" value={person.mobileApp} onChange={(value) => update('mobileApp', value)} options={[
              { value: 'iOS', label: 'iOS' },
              { value: 'Android', label: 'Android' },
              { value: 'None', label: 'None' },
            ]} />
          </Field>
          <Field label="Desktop app" required error={errors.desktopApp} fieldKey={`staff-${index}-desktopApp`}>
            <ChoiceGroup label="Desktop app" value={person.desktopApp} onChange={(value) => update('desktopApp', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </Field>
        </div>
        <HelpNote>{explanations.apps}</HelpNote>
      </div>
    </article>
  )
}

function PeopleStep({ data, setData, errors }) {
  const updatePerson = (id, field, value) => {
    setData((current) => ({
      ...current,
      staff: current.staff.map((person) => {
        if (person.id !== id) return person
        const next = { ...person, [field]: value }
        if (field === 'voicemail' && value === 'no') next.voicemailToEmail = 'no'
        return next
      }),
    }))
  }

  return (
    <section className="step-panel" aria-labelledby="people-heading">
      <div className="section-kicker">Step 2 of 4</div>
      <h1 id="people-heading">Staff and devices</h1>
      <p className="lead">Add one entry for every person who needs a phone, app or voicemail. All choices are required so there are no gaps when we build the system.</p>
      <div className="staff-list">
        {data.staff.map((person, index) => (
          <StaffCard
            key={person.id}
            person={person}
            index={index}
            errors={errors.staff?.[index] || {}}
            canRemove={data.staff.length > 1}
            update={(field, value) => updatePerson(person.id, field, value)}
            remove={() => setData((current) => ({ ...current, staff: current.staff.filter((item) => item.id !== person.id) }))}
          />
        ))}
      </div>
      <button className="add-button" type="button" onClick={() => setData((current) => ({ ...current, staff: [...current.staff, emptyPerson()] }))}>
        <Plus size={18} /> Add another person
      </button>
    </section>
  )
}

function CallsStep({ data, setData, errors }) {
  const a = data.additional
  const setAdditional = (field, value) => setData((current) => ({
    ...current,
    additional: { ...current.additional, [field]: value },
  }))

  return (
    <section className="step-panel" aria-labelledby="calls-heading">
      <div className="section-kicker">Step 3 of 4</div>
      <h1 id="calls-heading">Call handling</h1>
      <p className="lead">These answers tell us how calls should reach your business during normal hours, closures and outages.</p>

      <div className="question-section question-section--urgent">
        <div className="question-section__number">A</div>
        <div className="question-section__content">
          <h2>Numbers and continuity</h2>
          <Field label="Emergency divert mobile number" hint="Used only if the network is unavailable" required error={errors.emergencyDivert} fieldKey="emergencyDivert">
            <TextInput type="tel" inputMode="tel" autoComplete="tel" maxLength={30} placeholder="e.g. 07700 900 123" value={a.emergencyDivert} onChange={(value) => setAdditional('emergencyDivert', value)} />
          </Field>
          <Field label="Numbers moving to the new system" required error={errors.portNumbers} fieldKey="portNumbers">
            <TextArea disabled={a.noNumbersToPort} rows={5} maxLength={4000} placeholder={'0141 111 1111 — Main number\n0141 222 2222 — Jane Smith direct dial'} value={a.portNumbers} onChange={(value) => setAdditional('portNumbers', value)} />
            <label className="check-row">
              <input type="checkbox" checked={a.noNumbersToPort} onChange={(event) => setAdditional('noNumbersToPort', event.target.checked)} />
              <span>No existing numbers need to be ported</span>
            </label>
            <HelpNote>{explanations.porting}</HelpNote>
          </Field>
        </div>
      </div>

      <div className="question-section">
        <div className="question-section__number">B</div>
        <div className="question-section__content">
          <h2>Call menus and voicemail</h2>
          <Field label="Do you need an auto attendant?" hint="A recorded menu such as Press 1 for Sales" required error={errors.autoAttendant} fieldKey="autoAttendant">
            <ChoiceGroup label="Auto attendant" value={a.autoAttendant} onChange={(value) => setAdditional('autoAttendant', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
            <HelpNote>{explanations.autoAttendant}</HelpNote>
          </Field>
          {a.autoAttendant === 'yes' && (
            <div className="conditional-block">
              <Field label="Menu options and people in each group" required error={errors.autoGroups} fieldKey="autoGroups">
                <TextArea rows={5} maxLength={4000} placeholder={'Press 1 — Sales: Aisha, Ross\nPress 2 — Accounts: Priya, Michael'} value={a.autoGroups} onChange={(value) => setAdditional('autoGroups', value)} />
              </Field>
              <Field label="How will the auto attendant recording be supplied?" required error={errors.autoRecording} fieldKey="autoRecording">
                <ChoiceGroup label="Auto attendant recording" value={a.autoRecording} onChange={(value) => setAdditional('autoRecording', value)} options={[
                  { value: 'Existing audio file', label: 'Existing file' },
                  { value: 'We will record it', label: 'We will record' },
                  { value: 'Professional recording', label: 'Professional' },
                ]} />
                <TextArea className="compact-textarea" rows={3} maxLength={2000} placeholder="Optional notes or script" value={a.autoRecordingNotes} onChange={(value) => setAdditional('autoRecordingNotes', value)} />
                <HelpNote>{explanations.recordings}</HelpNote>
              </Field>
              <Field label="How should calls ring?" required error={errors.callPattern} fieldKey="callPattern">
                <ChoiceGroup label="Call pattern" value={a.callPattern} onChange={(value) => setAdditional('callPattern', value)} options={[
                  { value: 'Simultaneous', label: 'All at once' },
                  { value: 'Sequential', label: 'One by one' },
                ]} />
                <HelpNote>{explanations.callPattern}</HelpNote>
              </Field>
            </div>
          )}

          <Field label="Do you need a company voicemail?" required error={errors.companyVoicemail} fieldKey="companyVoicemail">
            <ChoiceGroup label="Company voicemail" value={a.companyVoicemail} onChange={(value) => setAdditional('companyVoicemail', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </Field>
          {a.companyVoicemail === 'yes' && (
            <div className="conditional-block">
              <Field label="Voicemail message and mailbox plan" hint="Include the mailbox email address if known" required error={errors.voicemailPlan} fieldKey="voicemailPlan">
                <TextArea rows={4} maxLength={3000} placeholder="Tell us whether you will supply a recording and where messages should go" value={a.voicemailPlan} onChange={(value) => setAdditional('voicemailPlan', value)} />
              </Field>
            </div>
          )}
        </div>
      </div>

      <div className="question-section">
        <div className="question-section__number">C</div>
        <div className="question-section__content">
          <h2>Schedules and on-hold audio</h2>
          <Field label="Do your lines close at lunch or at other scheduled times?" required error={errors.scheduledClosures} fieldKey="scheduledClosures">
            <ChoiceGroup label="Scheduled closures" value={a.scheduledClosures} onChange={(value) => setAdditional('scheduledClosures', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </Field>
          {a.scheduledClosures === 'yes' && (
            <div className="conditional-block">
              <Field label="Times and people affected" required error={errors.closureDetails} fieldKey="closureDetails">
                <TextArea rows={4} maxLength={3000} placeholder="e.g. Sales team lunch: 12:00–13:00, Monday to Friday" value={a.closureDetails} onChange={(value) => setAdditional('closureDetails', value)} />
              </Field>
            </div>
          )}
          <Field label="Opening and closing times" hint="Include each day and any team exceptions" required error={errors.openingHours} fieldKey="openingHours">
            <TextArea rows={5} maxLength={3000} placeholder={'Monday–Thursday: 09:00–17:00\nFriday: 09:00–16:00\nSaturday–Sunday: Closed'} value={a.openingHours} onChange={(value) => setAdditional('openingHours', value)} />
          </Field>
          <Field label="Do you need music or messaging while callers are on hold?" required error={errors.onHold} fieldKey="onHold">
            <ChoiceGroup label="On-hold service" value={a.onHold} onChange={(value) => setAdditional('onHold', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </Field>
          {a.onHold === 'yes' && (
            <div className="conditional-block">
              <Field label="Audio or message plan" required error={errors.onHoldPlan} fieldKey="onHoldPlan">
                <TextArea rows={4} maxLength={3000} placeholder="Tell us whether you have an audio file, will record one, or want a professional recording" value={a.onHoldPlan} onChange={(value) => setAdditional('onHoldPlan', value)} />
                <p className="legal-note"><LockKeyhole size={15} /> Please only supply music you are licensed to use or that is royalty-free.</p>
              </Field>
            </div>
          )}
        </div>
      </div>

      <div className="question-section">
        <div className="question-section__number">D</div>
        <div className="question-section__content">
          <h2>Administration and groups</h2>
          <Field label="Nominated portal user" hint="This person will receive training and manage holiday messages" required error={errors.portalUser} fieldKey="portalUser">
            <TextInput maxLength={120} placeholder="Full name" value={a.portalUser} onChange={(value) => setAdditional('portalUser', value)} />
          </Field>
          <Field label="Do you need call pick-up groups?" required error={errors.pickupGroups} fieldKey="pickupGroups">
            <ChoiceGroup label="Call pick-up groups" value={a.pickupGroups} onChange={(value) => setAdditional('pickupGroups', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
            <HelpNote>{explanations.pickup}</HelpNote>
          </Field>
          {a.pickupGroups === 'yes' && (
            <div className="conditional-block">
              <Field label="People in each pick-up group" required error={errors.pickupDetails} fieldKey="pickupDetails">
                <TextArea rows={4} maxLength={3000} placeholder={'Group 1: Aisha, Ross, Megan\nGroup 2: Priya, Michael'} value={a.pickupDetails} onChange={(value) => setAdditional('pickupDetails', value)} />
              </Field>
            </div>
          )}
          <Field label="Should all users show the main number when calling out?" required error={errors.presentMain} fieldKey="presentMain">
            <ChoiceGroup label="Present main number" value={a.presentMain} onChange={(value) => setAdditional('presentMain', value)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No, use the staff choices above' }]} />
          </Field>
          <Field label="Anything else we should know?" hint="Optional">
            <TextArea rows={5} maxLength={5000} placeholder="Add any special routing, dates or requirements" value={a.extraNotes} onChange={(value) => setAdditional('extraNotes', value)} />
          </Field>
        </div>
      </div>
    </section>
  )
}

function ReviewStep({ data, allErrors, goToStep }) {
  const [status, setStatus] = useState('idle')
  const [fileName, setFileName] = useState('')
  const email = emailDetails(data)
  const errorCount = allErrors.length

  const handleDownload = async () => {
    if (errorCount) return
    try {
      setStatus('working')
      const name = await downloadWorkbook(data)
      setFileName(name)
      setStatus('ready')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  const handleEmail = async () => {
    if (status !== 'ready') await handleDownload()
    window.setTimeout(() => { window.location.href = email.href }, 150)
  }

  return (
    <section className="step-panel" aria-labelledby="review-heading">
      <div className="section-kicker">Step 4 of 4</div>
      <h1 id="review-heading">Review and download</h1>
      <p className="lead">Check the details below. Your completed workbook is made in this browser and downloaded directly to your device.</p>

      {errorCount > 0 ? (
        <div className="validation-summary" role="alert">
          <div><CircleHelp size={22} /><strong>{errorCount} required {errorCount === 1 ? 'answer is' : 'answers are'} still missing</strong></div>
          <p>Return to the highlighted sections and complete them before downloading.</p>
          <div className="validation-actions">
            {[0, 1, 2].map((step) => {
              const count = allErrors.filter((item) => item.step === step).length
              return count ? <button type="button" key={step} onClick={() => goToStep(step)}>{steps[step].title} <span>{count}</span></button> : null
            })}
          </div>
        </div>
      ) : (
        <div className="ready-banner"><CheckCircle2 size={24} /><div><strong>Everything required is complete.</strong><p>Your workbook is ready to create.</p></div></div>
      )}

      <div className="review-grid">
        <article className="review-card">
          <span className="review-card__eyebrow">Submission</span>
          <h2>{data.companyName || 'Company name'}</h2>
          <dl>
            <div><dt>Completed by</dt><dd>{data.completedBy || '—'}</dd></div>
            <div><dt>Staff entries</dt><dd>{data.staff.length}</dd></div>
            <div><dt>Portal user</dt><dd>{data.additional.portalUser || '—'}</dd></div>
            <div><dt>Emergency divert</dt><dd>{data.additional.emergencyDivert || '—'}</dd></div>
          </dl>
        </article>
        <article className="review-card review-card--privacy">
          <ShieldCheck size={28} />
          <h2>Private by design</h2>
          <p>No form data is sent to this website, Telecom Networks, or any third party. Nothing is saved between visits. The downloaded file remains on your device until you choose to attach it to an email.</p>
        </article>
      </div>

      <div className="delivery-panel">
        <div className="delivery-panel__number">1</div>
        <div className="delivery-panel__content">
          <h2>Download your completed XLSX</h2>
          <p>The workbook contains a submission summary, your staff settings and every call-handling answer. The old sample company directory is not included.</p>
          <button className="primary-button" type="button" disabled={Boolean(errorCount) || status === 'working'} onClick={handleDownload}>
            <Download size={19} /> {status === 'working' ? 'Creating workbook…' : 'Download completed CRF'}
          </button>
          {status === 'ready' && <p className="success-text"><CheckCircle2 size={16} /> Downloaded: {fileName}</p>}
          {status === 'error' && <p className="error-text">The workbook could not be created. Please try the download again.</p>}
        </div>
      </div>

      <div className="delivery-panel">
        <div className="delivery-panel__number">2</div>
        <div className="delivery-panel__content">
          <h2>Open your email</h2>
          <p>We’ll open your usual email app with the address, subject and message filled in. For security, browsers cannot attach files automatically, so attach the XLSX you just downloaded before sending.</p>
          <div className="email-preview">
            <div><span>To</span><strong>info@telecomnetworks.co.uk</strong></div>
            <div><span>Subject</span><strong>{email.subject}</strong></div>
          </div>
          <button className="secondary-button" type="button" disabled={Boolean(errorCount)} onClick={handleEmail}>
            <Mail size={19} /> Download and prepare email
          </button>
        </div>
      </div>
    </section>
  )
}

function validateStep(data, step) {
  const errors = {}
  if (step === 0) {
    if (data.companyName.trim().length < 2) errors.companyName = 'Enter the company name.'
    if (data.completedBy.trim().length < 2) errors.completedBy = 'Enter the full name of the person completing the form.'
  }
  if (step === 1) {
    errors.staff = data.staff.map((person) => {
      const item = {}
      if (person.name.trim().length < 2) item.name = 'Enter this person’s full name.'
      if (!person.voicemail) item.voicemail = 'Choose yes or no.'
      if (person.voicemail === 'yes' && !person.voicemailToEmail) item.voicemailToEmail = 'Choose yes or no.'
      const needsEmail = person.voicemailToEmail === 'yes' || (person.mobileApp && person.mobileApp !== 'None') || person.desktopApp === 'yes'
      if (needsEmail && !/^\S+@\S+\.\S+$/.test(person.email.trim())) item.email = 'Enter a valid email address for the selected service.'
      if (person.email.trim() && !/^\S+@\S+\.\S+$/.test(person.email.trim())) item.email = 'Enter a valid email address.'
      if (!person.callerId) item.callerId = 'Choose the outgoing number.'
      if (!person.handset) item.handset = 'Choose a phone option.'
      if (!person.mobileApp) item.mobileApp = 'Choose a mobile app option.'
      if (!person.desktopApp) item.desktopApp = 'Choose yes or no.'
      return item
    })
  }
  if (step === 2) {
    const a = data.additional
    if (a.emergencyDivert.trim().replace(/\D/g, '').length < 10) errors.emergencyDivert = 'Enter a valid emergency divert number.'
    if (!a.noNumbersToPort && a.portNumbers.trim().length < 5) errors.portNumbers = 'List the numbers to port, or confirm there are none.'
    if (!a.autoAttendant) errors.autoAttendant = 'Choose yes or no.'
    if (a.autoAttendant === 'yes') {
      if (a.autoGroups.trim().length < 5) errors.autoGroups = 'List the menu options and the people in each group.'
      if (!a.autoRecording) errors.autoRecording = 'Choose how the recording will be supplied.'
      if (!a.callPattern) errors.callPattern = 'Choose how the calls should ring.'
    }
    if (!a.companyVoicemail) errors.companyVoicemail = 'Choose yes or no.'
    if (a.companyVoicemail === 'yes' && a.voicemailPlan.trim().length < 5) errors.voicemailPlan = 'Describe the voicemail message and mailbox plan.'
    if (!a.scheduledClosures) errors.scheduledClosures = 'Choose yes or no.'
    if (a.scheduledClosures === 'yes' && a.closureDetails.trim().length < 5) errors.closureDetails = 'Add the times and people affected.'
    if (a.openingHours.trim().length < 10) errors.openingHours = 'Enter the opening and closing times.'
    if (!a.onHold) errors.onHold = 'Choose yes or no.'
    if (a.onHold === 'yes' && a.onHoldPlan.trim().length < 5) errors.onHoldPlan = 'Describe the audio or message plan.'
    if (a.portalUser.trim().length < 2) errors.portalUser = 'Enter the nominated portal user’s full name.'
    if (!a.pickupGroups) errors.pickupGroups = 'Choose yes or no.'
    if (a.pickupGroups === 'yes' && a.pickupDetails.trim().length < 5) errors.pickupDetails = 'List the people in each pick-up group.'
    if (!a.presentMain) errors.presentMain = 'Choose yes or no.'
  }
  return errors
}

function countErrors(value) {
  if (!value || typeof value !== 'object') return 0
  return Object.values(value).reduce((total, item) => total + (typeof item === 'string' ? 1 : countErrors(item)), 0)
}

function flattenErrors(data) {
  return [0, 1, 2].flatMap((step) => {
    const errors = validateStep(data, step)
    return Array.from({ length: countErrors(errors) }, () => ({ step }))
  })
}

function App() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const mainRef = useRef(null)
  const allErrors = useMemo(() => flattenErrors(data), [data])
  const completedSteps = useMemo(() => [0, 1, 2].map((item) => countErrors(validateStep(data, item)) === 0), [data])

  const goTo = (nextStep) => {
    setStep(nextStep)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => mainRef.current?.focus(), 250)
  }

  const next = () => {
    const currentErrors = validateStep(data, step)
    setErrors(currentErrors)
    if (countErrors(currentErrors)) {
      window.setTimeout(() => document.querySelector('[data-error-key] input, [data-error-key] textarea, [data-error-key] button')?.focus(), 0)
      return
    }
    goTo(step + 1)
  }

  useEffect(() => {
    const warnBeforeLeave = (event) => {
      const hasStarted = data.companyName || data.completedBy || data.staff.some((person) => person.name)
      if (!hasStarted) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeave)
    return () => window.removeEventListener('beforeunload', warnBeforeLeave)
  }, [data])

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return undefined
    const lifecycle = new AbortController()
    const reportError = (error) => console.warn('WebMCP registration failed', error)
    try {
      Promise.resolve(context.registerTool({
        name: 'set_crf_identity',
        title: 'Set CRF company and form filler',
        description: 'Set the company name and the full name of the person completing the visible Telecom Networks CRF.',
        inputSchema: {
          type: 'object',
          properties: {
            companyName: { type: 'string', minLength: 2, maxLength: 120 },
            completedBy: { type: 'string', minLength: 2, maxLength: 120 },
          },
          required: ['companyName', 'completedBy'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input.companyName !== 'string' || typeof input.completedBy !== 'string' || input.companyName.trim().length < 2 || input.completedBy.trim().length < 2) {
            throw new Error('Both companyName and completedBy must contain at least two characters.')
          }
          setData((current) => ({ ...current, companyName: input.companyName.slice(0, 120), completedBy: input.completedBy.slice(0, 120) }))
          setStep(0)
          return { updated: true, step: 'About this form' }
        },
      }, { signal: lifecycle.signal })).catch(reportError)
    } catch (error) {
      reportError(error)
    }
    return () => lifecycle.abort()
  }, [])

  const reset = () => {
    if (!window.confirm('Clear every answer and start again? This cannot be undone.')) return
    setData(initialData())
    setErrors({})
    setStep(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="https://telecomnetworks.co.uk/" target="_blank" rel="noreferrer noopener" aria-label="Telecom Networks website">
          <img src="/telecom-networks-logo.svg" alt="Telecom Networks" />
        </a>
        <div className="topbar__actions">
          <a href="tel:01414045441">Need help? <strong>0141 404 5441</strong></a>
          <button type="button" onClick={reset}>Start again</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="progress-rail" aria-label="Form progress">
          <div className="progress-rail__intro">
            <span>CRF</span>
            <strong>{Math.round((completedSteps.filter(Boolean).length / 3) * 100)}% complete</strong>
          </div>
          <ol>
            {steps.map((item, index) => {
              const canVisit = index <= step || (index < 3 && completedSteps[index]) || index === 3 && completedSteps.every(Boolean)
              return (
                <li key={item.short} className={classNames(index === step && 'is-active', completedSteps[index] && index < 3 && 'is-complete')}>
                  <button type="button" onClick={() => canVisit && goTo(index)} disabled={!canVisit} aria-current={index === step ? 'step' : undefined}>
                    <span className="step-dot">{completedSteps[index] && index < 3 ? <Check size={14} strokeWidth={3} /> : index + 1}</span>
                    <span><small>{item.short}</small>{item.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="security-stamp"><LockKeyhole size={18} /><span><strong>Local only</strong>No data storage</span></div>
        </aside>

        <main className="main-content" ref={mainRef} tabIndex="-1">
          {step === 0 && <AboutStep data={data} setData={setData} errors={errors} />}
          {step === 1 && <PeopleStep data={data} setData={setData} errors={errors} />}
          {step === 2 && <CallsStep data={data} setData={setData} errors={errors} />}
          {step === 3 && <ReviewStep data={data} allErrors={allErrors} goToStep={goTo} />}

          <nav className="step-nav" aria-label="Form navigation">
            {step > 0 ? <button className="back-button" type="button" onClick={() => goTo(step - 1)}><ArrowLeft size={18} /> Back</button> : <span />}
            {step < 3 && <button className="next-button" type="button" onClick={next}>Continue <ArrowRight size={18} /></button>}
          </nav>
        </main>

        <aside className="resource-rail">
          <div className="resource-card">
            <span className="resource-card__icon"><FileSpreadsheet size={20} /></span>
            <h2>What you’ll need</h2>
            <ul>
              <li>Staff names and email addresses</li>
              <li>Numbers moving to the new system</li>
              <li>Opening hours and call routes</li>
            </ul>
          </div>
          <div className="resource-card">
            <span className="resource-card__icon"><ExternalLink size={20} /></span>
            <h2>Recording resources</h2>
            <p>Use BroadSoft Recorder if you want to make your own phone greeting.</p>
            <a href="https://apps.apple.com/gb/app/broadsoft-recorder/id635802005" target="_blank" rel="noreferrer noopener">Download for iPhone <ExternalLink size={14} /></a>
            <a href="https://play.google.com/store/apps/details?id=com.yydigital.broadsoft.recorder&hl=en_GB" target="_blank" rel="noreferrer noopener">Download for Android <ExternalLink size={14} /></a>
          </div>
          <div className="resource-card resource-card--contact">
            <h2>Prefer to talk it through?</h2>
            <p>Ask for the service representative who sent you this form. We can complete it with you.</p>
            <a href="tel:01414045441">0141 404 5441</a>
            <a href="mailto:info@telecomnetworks.co.uk">info@telecomnetworks.co.uk</a>
          </div>
        </aside>
      </div>

      <footer>
        <span>Telecom Networks · 7 East Kilbride Road, Rutherglen G73 5EA</span>
        <span>No cookies · No tracking · No saved form data</span>
      </footer>
    </div>
  )
}

export default App
