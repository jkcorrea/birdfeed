import { tw } from '~/lib/utils'

import { makeBaseField } from './base'

export const TextField = makeBaseField('TextField', (props) => (
  <input {...props} className={tw('input-bordered input', props.error && 'input-error', props.className)} />
))

export const TextAreaField = makeBaseField<HTMLTextAreaElement>('TextAreaField', (props) => (
  <textarea {...props} className={tw('textarea-bordered textarea', props.error && 'textarea-error', props.className)} />
))

export const NativeSelectField = makeBaseField<HTMLSelectElement>('NativeSelectField', (props) => (
  <select {...props} className={tw('select-bordered select', props.error && 'input-error', props.className)} />
))

export const NumberField = makeBaseField('NumberField', (props) => (
  <input
    {...props}
    type="number"
    className={tw('input-bordered input', props.error && 'input-error', props.className)}
  />
))

export const CheckboxField = makeBaseField('CheckboxField', (props) => (
  <input {...props} type="checkbox" className={tw('checkbox', props.error && 'checkbox-error', props.className)} />
))

export * from './IntentField'
