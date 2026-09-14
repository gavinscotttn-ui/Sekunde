import { useState } from 'react'
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Mail,
  Printer,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'

import { CONTACT, describeSettings, effectiveSettings } from '../../lib/model.js'
import { summariseHours } from '../../lib/hours.js'
import {
  additionalQuestionRows,
  downloadWorkbook,
  emailDetails,
  staffRows,
  workbookFileName,
} from '../../lib/exportWorkbook.js'
import { Callout } from '../ui.jsx'

export function ReviewStep({ data, problems, goToProblem }) {
  const [status, setStatus] = useState('idle')
  const [fileName, setFileName] = useState('')
  const email = emailDetails(data)
  const blocked = problems.length > 0
  const rows = staffRows(data)

  const handleDownload = async () => {
    if (blocked) return false
    setStatus('working')
    try {
      const name = await downloadWorkbook(data)
      setFileName(name)
      setStatus('ready')
      return true
    } catch (error) {
      console.error('Could not build the workbook', error)
      setStatus('error')
      return false
    }
  }

  const handleEmail = async () => {
    if (blocked) return
    if (status !== 'ready') {
      const ok = await handleDownload()
      if (!ok) return
    }
    window.location.href = email.href
  }

  return (
    <section className="step-panel" aria-labelledby="step-heading">
      <p className="step-kicker">Step 4 of 4</p>
      <h1 id="step-heading">Check and send</h1>
      <p className="step-lead">
        Here is everything that goes into the spreadsheet. Have a read, then download it and send it over.
      </p>

      {blocked ? (
        <div className="validation-summary" role="alert">
          <div className="validation-summary__head">
            <TriangleAlert size={22} aria-hidden="true" />
            <strong>
              {problems.length} {problems.length === 1 ? 'answer is' : 'answers are'} still needed
            </strong>
          </div>
          <p>Select one to jump straight to it.</p>
          <ul>
            {problems.map((problem) => (
              <li key={`${problem.step}-${problem.key}`}>
                <button type="button" onClick={() => goToProblem(problem)}>
                  <span className="validation-summary__section">{problem.section}</span>
                  {problem.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Callout tone="success" icon={CheckCircle2} title="Everything we need is here">
          <p>Your spreadsheet is ready to build.</p>
        </Callout>
      )}

      <div className="summary-grid">
        <article className="summary-card">
          <h2>Submission</h2>
          <dl>
            <div><dt>Company</dt><dd>{data.companyName || '—'}</dd></div>
            <div><dt>Completed by</dt><dd>{data.completedBy || '—'}</dd></div>
            <div><dt>Reply to</dt><dd>{data.contactEmail || 'Not supplied'}</dd></div>
            <div><dt>People included</dt><dd>{data.staff.length}</dd></div>
            <div><dt>File name</dt><dd className="summary-card__mono">{workbookFileName(data)}</dd></div>
          </dl>
        </article>

        <article className="summary-card">
          <h2>Options for everyone</h2>
          <p className="summary-card__lead">{describeSettings(data.defaults) || 'Not chosen yet'}</p>
          <h3>Opening hours</h3>
          <ul className="summary-card__hours">
            {summariseHours(data.hours).map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <span>{row.text}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <section className="summary-table" aria-labelledby="people-summary">
        <h2 id="people-summary">Your people</h2>
        <div className="table-scroll">
          <table>
            <caption className="visually-hidden">Each person and the options chosen for them</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Options</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {data.staff.map((person, index) => {
                const row = rows[index]
                return (
                  <tr key={person.id}>
                    <td>{person.name || <span className="muted">Not entered</span>}</td>
                    <td>{person.email || <span className="muted">Not required</span>}</td>
                    <td>{describeSettings(effectiveSettings(person, data.defaults))}</td>
                    <td>{row[8]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="summary-table" aria-labelledby="answers-summary">
        <h2 id="answers-summary">Call handling answers</h2>
        <div className="table-scroll">
          <table>
            <caption className="visually-hidden">Every additional question and your answer</caption>
            <thead>
              <tr>
                <th scope="col">Question</th>
                <th scope="col">Answer</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {additionalQuestionRows(data).map(([question, answer, detail]) => (
                <tr key={question}>
                  <td>{question}</td>
                  <td>{answer || <span className="muted">—</span>}</td>
                  <td className="summary-table__detail">{detail || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="delivery">
        <div className="delivery__step">
          <span className="delivery__number" aria-hidden="true">1</span>
          <div>
            <h2>Download your completed form</h2>
            <p>
              The spreadsheet is built here in your browser and saved straight to your downloads folder. It never
              passes through a server.
            </p>
            <div className="delivery__actions">
              <button
                type="button"
                className="primary-button"
                disabled={blocked || status === 'working'}
                onClick={handleDownload}
              >
                <Download size={19} aria-hidden="true" />
                {status === 'working' ? 'Building your spreadsheet…' : 'Download completed CRF'}
              </button>
              <button type="button" className="ghost-button ghost-button--wide" onClick={() => window.print()}>
                <Printer size={17} aria-hidden="true" /> Print this summary
              </button>
            </div>
            {status === 'ready' && (
              <p className="success-text">
                <CheckCircle2 size={16} aria-hidden="true" /> Downloaded {fileName}
              </p>
            )}
            {status === 'error' && (
              <p className="field__error" role="alert">
                The spreadsheet could not be built. Please try again, or call us on {CONTACT.phone}.
              </p>
            )}
          </div>
        </div>

        <div className="delivery__step">
          <span className="delivery__number" aria-hidden="true">2</span>
          <div>
            <h2>Email it to us</h2>
            <p>
              We will open your usual email app with the address and subject filled in. Browsers are not allowed to
              attach files for you, so please attach the spreadsheet you just downloaded before sending.
            </p>
            <div className="email-preview">
              <div><span>To</span><strong>{email.to}</strong></div>
              <div><span>Subject</span><strong>{email.subject}</strong></div>
              <div><span>Attach</span><strong>{fileName || workbookFileName(data)}</strong></div>
            </div>
            <button type="button" className="secondary-button" disabled={blocked} onClick={handleEmail}>
              <Mail size={19} aria-hidden="true" /> Download and open my email
            </button>
          </div>
        </div>
      </div>

      <Callout tone="privacy" icon={ShieldCheck} title="Private by design">
        <p>
          Nothing you typed was sent to this website, to Telecom Networks, or to anyone else. Nothing is saved between
          visits. The file is yours until you choose to attach it to an email.
        </p>
      </Callout>

      <p className="inline-note">
        <FileSpreadsheet size={18} aria-hidden="true" />
        <span>
          Prefer a person? Call <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> or email{' '}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </span>
      </p>
    </section>
  )
}
