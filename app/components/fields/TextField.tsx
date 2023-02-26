import React, { forwardRef, useId } from 'react'

import { tw } from '~/lib/utils'

export interface TextFieldProps extends React.HTMLProps<HTMLInputElement> {
  label?: string
  error?: string | null
  wrapperClassName?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
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
        <input
          {...inputProps}
          id={id}
          ref={ref}
          type="text"
          className={tw('input-bordered input w-full', error && 'input-error', inputProps?.className)}
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

TextField.displayName = 'TextField'

export default TextField
