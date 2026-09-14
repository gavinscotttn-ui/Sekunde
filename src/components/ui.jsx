// Shared form furniture. Everything here is plain HTML with real labels,
// fieldsets and radio inputs so the keyboard and screen-reader behaviour comes
// from the browser rather than from hand-rolled ARIA.
//
// No component sets a style attribute: the Content-Security-Policy forbids
// inline styles, so all appearance lives in styles.css.

import { useId } from 'react'
import { ArrowRight, Check, ChevronDown, CircleHelp, Info } from 'lucide-react'

export function classNames(...values) {
  return values.filter(Boolean).join(' ')
}

/** Wraps a single control with its label, hint and error message. */
export function Field({ label, hint, error, optional = false, anchor, children, className }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = classNames(hint && hintId, error && errorId) || undefined

  return (
    <div
      className={classNames('field', error && 'field--error', className)}
      data-anchor={anchor}
    >
      <label className="field__label" htmlFor={id}>
        {label}
        {optional && <span className="field__optional">Optional</span>}
      </label>
      {hint && <p className="field__hint" id={hintId}>{hint}</p>}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error && <p className="field__error" id={errorId} role="alert">{error}</p>}
    </div>
  )
}

/** A group of mutually exclusive options, rendered as real radio buttons. */
export function ChoiceField({
  label,
  hint,
  error,
  optional = false,
  anchor,
  options,
  value,
  onChange,
  columns,
  children,
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = classNames(hint && hintId, error && errorId) || undefined

  return (
    <fieldset
      className={classNames('field', 'field--choice', error && 'field--error')}
      data-anchor={anchor}
      aria-describedby={describedBy}
    >
      <legend className="field__label">
        {label}
        {optional && <span className="field__optional">Optional</span>}
      </legend>
      {hint && <p className="field__hint" id={hintId}>{hint}</p>}
      <div className={classNames('choices', columns && `choices--${columns}`)}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`
          return (
            <div className="choice" key={option.value}>
              <input
                type="radio"
                id={optionId}
                name={id}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <label htmlFor={optionId}>
                <span className="choice__mark" aria-hidden="true" />
                <span className="choice__text">
                  {option.label}
                  {option.description && <small>{option.description}</small>}
                </span>
              </label>
            </div>
          )
        })}
      </div>
      {error && <p className="field__error" id={errorId} role="alert">{error}</p>}
      {children}
    </fieldset>
  )
}

export function TextInput({ value, onChange, ...props }) {
  return <input className="text-input" value={value} onChange={(event) => onChange(event.target.value)} {...props} />
}

export function TextArea({ value, onChange, className, ...props }) {
  return (
    <textarea
      className={classNames('text-input', 'text-area', className)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  )
}

export function CheckRow({ checked, onChange, children }) {
  const id = useId()
  return (
    <div className="check-row">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <label htmlFor={id}>{children}</label>
    </div>
  )
}

/** Collapsed explanation, closed by default so the page stays calm. */
export function HelpNote({ title = 'What does this mean?', children }) {
  return (
    <details className="help-note">
      <summary>
        <CircleHelp size={16} aria-hidden="true" />
        <span>{title}</span>
        <ChevronDown size={16} className="help-note__chevron" aria-hidden="true" />
      </summary>
      <div className="help-note__body">{children}</div>
    </details>
  )
}

export function Callout({ tone = 'info', icon, title, children }) {
  const Icon = icon || Info
  return (
    <div className={`callout callout--${tone}`}>
      <Icon size={20} aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  )
}

/** A collapsible section: one topic open at a time, the rest a single tick line. */
export function Section({ id, title, summary, complete, open, onToggle, onNext, nextLabel, children }) {
  return (
    <section className={classNames('section', open && 'section--open', complete && 'section--complete')}>
      <h2>
        <button
          type="button"
          className="section__header"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => onToggle(id)}
        >
          <span className="section__tick" aria-hidden="true">
            {complete ? <Check size={14} strokeWidth={3} /> : <span className="section__dot" />}
          </span>
          <span className="section__title">
            {title}
            {!open && summary && <small>{summary}</small>}
          </span>
          <ChevronDown size={18} className="section__chevron" aria-hidden="true" />
        </button>
      </h2>
      <div className="section__body" id={`${id}-body`} hidden={!open}>
        {children}
        {onNext && (
          <div className="section__footer">
            <button type="button" className="secondary-button" onClick={onNext}>
              {nextLabel} <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
