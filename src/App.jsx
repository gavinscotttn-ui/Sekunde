import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileDown,
  FolderOpen,
  LockKeyhole,
  Phone,
  RotateCcw,
  Save,
} from 'lucide-react'

import { BLANK_FORM_PATH, CONTACT, createForm } from './lib/model.js'
import { listProblems, stepIsComplete, validateStep } from './lib/validation.js'
import { DRAFT_EXTENSION, MAX_DRAFT_BYTES, parseDraft, serialiseDraft } from './lib/draft.js'
import { safeFilename, saveBlob, todayParts } from './lib/exportWorkbook.js'
import { registerAssistantTools } from './lib/webmcp.js'
import { AboutStep } from './components/steps/AboutStep.jsx'
import { PeopleStep } from './components/steps/PeopleStep.jsx'
import { CallsStep } from './components/steps/CallsStep.jsx'
import { ReviewStep } from './components/steps/ReviewStep.jsx'
import { classNames } from './components/ui.jsx'

const STEPS = [
  { short: 'About', title: 'About you' },
  { short: 'Team', title: 'Your team' },
  { short: 'Calls', title: 'Call handling' },
  { short: 'Send', title: 'Check and send' },
]

const LAST_STEP = STEPS.length - 1

function focusAnchor(key) {
  const container = document.querySelector(`[data-anchor="${CSS.escape(key)}"]`)
  if (!container) return
  container.scrollIntoView({ block: 'center', behavior: 'smooth' })
  const focusable = container.matches('input, textarea, select, button')
    ? container
    : container.querySelector('input, textarea, select, button')
  if (focusable) focusable.focus({ preventScroll: true })
}

export default function App() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(createForm)
  const [checkedSteps, setCheckedSteps] = useState(() => new Set())
  const [notice, setNotice] = useState(null)
  const mainRef = useRef(null)
  const fileInputRef = useRef(null)

  const problems = useMemo(() => listProblems(data), [data])
  const completed = useMemo(
    () => [0, 1, 2].map((index) => stepIsComplete(data, index)),
    [data],
  )
  const percentComplete = Math.round(
    ((completed.filter(Boolean).length) / completed.length) * 100,
  )
  const errors = checkedSteps.has(step) ? validateStep(data, step) : {}

  const started =
    Boolean(data.companyName || data.completedBy || data.contactEmail) ||
    data.staff.some((person) => person.name || person.email)

  const goTo = useCallback((next) => {
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => mainRef.current?.focus(), 200)
  }, [])

  const handleContinue = () => {
    const stepErrors = validateStep(data, step)
    if (Object.keys(stepErrors).length) {
      setCheckedSteps((current) => new Set(current).add(step))
      const first = listProblems(data).find((problem) => problem.step === step)
      if (first) window.setTimeout(() => focusAnchor(first.key), 0)
      return
    }
    goTo(step + 1)
  }

  const goToProblem = (problem) => {
    setCheckedSteps((current) => new Set(current).add(problem.step))
    if (problem.step === step) {
      focusAnchor(problem.key)
      return
    }
    goTo(problem.step)
    window.setTimeout(() => focusAnchor(problem.key), 350)
  }

  const handleReset = () => {
    if (started && !window.confirm('Clear every answer and start again? This cannot be undone.')) return
    setData(createForm())
    setCheckedSteps(new Set())
    setNotice(null)
    goTo(0)
  }

  const handleSaveDraft = () => {
    const blob = new Blob([serialiseDraft(data)], { type: 'application/json' })
    const name = `${safeFilename(data.companyName)} - CRF progress - ${todayParts().filename}${DRAFT_EXTENSION}`
    saveBlob(blob, name)
    setNotice({ tone: 'success', text: `Saved ${name} to your device. Nothing was uploaded.` })
  }

  const handleOpenDraft = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_DRAFT_BYTES) {
      setNotice({ tone: 'error', text: 'That file is too large to be a saved form.' })
      return
    }
    try {
      const restored = parseDraft(await file.text())
      setData(restored)
      setCheckedSteps(new Set())
      setNotice({ tone: 'success', text: `Loaded your saved answers from ${file.name}.` })
      goTo(0)
    } catch (error) {
      setNotice({ tone: 'error', text: error.message })
    }
  }

  useEffect(() => {
    if (!started) return undefined
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [started])

  useEffect(() => registerAssistantTools(setData, setStep), [])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to the form</a>

      <header className="topbar">
        <a
          className="topbar__brand"
          href={CONTACT.website}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Telecom Networks website"
        >
          <img src="/telecom-networks-logo.svg" alt="Telecom Networks" width="220" height="56" />
        </a>
        <div className="topbar__actions">
          <a className="topbar__phone" href={CONTACT.phoneHref}>
            <Phone size={16} aria-hidden="true" />
            <span>Need a hand? <strong>{CONTACT.phone}</strong></span>
          </a>
          <button type="button" className="ghost-button ghost-button--wide" onClick={handleSaveDraft}>
            <Save size={16} aria-hidden="true" /> Save progress
          </button>
          <button
            type="button"
            className="ghost-button ghost-button--wide"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={16} aria-hidden="true" /> Resume
          </button>
          <button type="button" className="ghost-button ghost-button--wide" onClick={handleReset}>
            <RotateCcw size={16} aria-hidden="true" /> Start again
          </button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={handleOpenDraft}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </header>

      {notice && (
        <p className={classNames('notice', `notice--${notice.tone}`)} role="status">
          {notice.text}
          <button type="button" className="link-button" onClick={() => setNotice(null)}>Dismiss</button>
        </p>
      )}

      <div className="workspace">
        <aside className="rail rail--progress" aria-label="Your progress">
          <div className="rail__progress">
            <label htmlFor="progress-bar">Progress</label>
            <progress id="progress-bar" max="100" value={percentComplete} />
            <span>{percentComplete}% ready</span>
          </div>

          <ol className="stepper">
            {STEPS.map((item, index) => {
              const isComplete = index < LAST_STEP && completed[index]
              const canVisit = index <= step || isComplete || (index === LAST_STEP && completed.every(Boolean))
              return (
                <li
                  key={item.short}
                  className={classNames(index === step && 'is-active', isComplete && 'is-complete')}
                >
                  <button
                    type="button"
                    onClick={() => canVisit && goTo(index)}
                    disabled={!canVisit}
                    aria-current={index === step ? 'step' : undefined}
                  >
                    <span className="stepper__dot" aria-hidden="true">
                      {isComplete ? <Check size={14} strokeWidth={3} /> : index + 1}
                    </span>
                    <span className="stepper__text">
                      <small>{item.short}</small>
                      {item.title}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          <p className="rail__stamp">
            <LockKeyhole size={16} aria-hidden="true" />
            <span>
              <strong>Local only</strong>
              Nothing is uploaded or stored
            </span>
          </p>
        </aside>

        <main className="main" id="main" ref={mainRef} tabIndex={-1}>
          {step === 0 && <AboutStep data={data} setData={setData} errors={errors} />}
          {step === 1 && <PeopleStep data={data} setData={setData} errors={errors} />}
          {step === 2 && <CallsStep data={data} setData={setData} errors={errors} />}
          {step === 3 && <ReviewStep data={data} problems={problems} goToProblem={goToProblem} />}

          <nav className="step-nav" aria-label="Form navigation">
            {step > 0 ? (
              <button type="button" className="ghost-button ghost-button--wide" onClick={() => goTo(step - 1)}>
                <ArrowLeft size={18} aria-hidden="true" /> Back
              </button>
            ) : (
              <span />
            )}
            {step < LAST_STEP && (
              <button type="button" className="primary-button" onClick={handleContinue}>
                Continue <ArrowRight size={18} aria-hidden="true" />
              </button>
            )}
          </nav>
        </main>

        <aside className="rail rail--help" aria-label="Help and alternatives">
          <section className="help-card help-card--manual">
            <h2>Rather fill it out manually?</h2>
            <p>Download the plain CRF spreadsheet, fill it in however you like, and email it back to us.</p>
            <a className="secondary-button" href={BLANK_FORM_PATH} download>
              <FileDown size={18} aria-hidden="true" /> Download the form
            </a>
            <p className="help-card__meta">Excel workbook, 49 KB</p>
          </section>

          <section className="help-card">
            <h2>What you will need</h2>
            <ul>
              <li>Your staff names and email addresses</li>
              <li>The numbers moving to the new system</li>
              <li>Your opening hours</li>
              <li>A mobile number for emergency diverts</li>
            </ul>
          </section>

          <section className="help-card">
            <h2>Recording your own greeting</h2>
            <p>BroadSoft Recorder makes a clean phone recording you can email to us.</p>
            <a href="https://apps.apple.com/gb/app/broadsoft-recorder/id635802005" target="_blank" rel="noreferrer noopener">
              <Download size={14} aria-hidden="true" /> iPhone
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.yydigital.broadsoft.recorder&hl=en_GB"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Download size={14} aria-hidden="true" /> Android
            </a>
          </section>

          <section className="help-card help-card--contact">
            <h2>Prefer to talk it through?</h2>
            <p>Ask for the representative who sent you this form and we will complete it with you.</p>
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </section>
        </aside>
      </div>

      <footer className="footer">
        <span>Telecom Networks · {CONTACT.address}</span>
        <span>No cookies · No tracking · No saved form data</span>
      </footer>
    </div>
  )
}
