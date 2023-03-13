import { tw } from '~/lib/utils'

import { makeBaseField } from './base'

export const TextField = makeBaseField('TextField', ({ forwardedRef, ...props }) => (
  <input
    {...props}
    ref={forwardedRef}
    className={tw('input-bordered input', props.error && 'input-error', props.className)}
  />
))

export const TextAreaField = makeBaseField<HTMLTextAreaElement>('TextAreaField', ({ forwardedRef, ...props }) => (
  <textarea
    {...props}
    ref={forwardedRef}
    className={tw('textarea-bordered textarea', props.error && 'textarea-error', props.className)}
  />
))

export const NativeSelectField = makeBaseField<HTMLSelectElement>('NativeSelectField', ({ forwardedRef, ...props }) => (
  <select
    {...props}
    ref={forwardedRef}
    className={tw('select-bordered select', props.error && 'input-error', props.className)}
  />
))

export const NumberField = makeBaseField('NumberField', ({ forwardedRef, ...props }) => (
  <input
    {...props}
    ref={forwardedRef}
    type="number"
    className={tw('input-bordered input', props.error && 'input-error', props.className)}
  />
))

export const CheckboxField = makeBaseField('CheckboxField', ({ forwardedRef, ...props }) => (
  <input
    {...props}
    ref={forwardedRef}
    type="checkbox"
    className={tw('checkbox', props.error && 'checkbox-error', props.className)}
  />
))

export * from './IntentField'
