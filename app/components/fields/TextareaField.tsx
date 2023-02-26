import React, { forwardRef, useId } from 'react'

import { tw } from '~/lib/utils'

export interface TextAreaFieldProps extends React.HTMLProps<HTMLTextAreaElement> {
  label?: string
  error?: string | null
  wrapperClassName?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, wrapperClassName, ...inputProps }, ref) => {
    const _id = useId()
    const id = inputProps.id || _id

    return (
      <div className={tw('form-control w-full', wrapperClassName)}>
        {label && (
          <label htmlFor={id} className="label">
            <span className={tw('label-text text-xs uppercase', error && 'text-error')}>{label}</span>
            {inputProps.required && <span className="label-text-alt">*</span>}
          </label>
        )}
        <textarea
          {...inputProps}
          id={id}
          ref={ref}
          className={tw('textarea-bordered textarea w-full', error && 'input-error', inputProps?.className)}
        />
        {error && (
          <label htmlFor={id} className="label py-1">
            <span className="label-text-alt text-xs text-error">{error}</span>
          </label>
        )}
      </div>
    )
  }
)

TextareaField.displayName = 'TextareaField'

export default TextareaField
