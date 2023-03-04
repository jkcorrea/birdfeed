import React, { useId } from 'react'

import { tw } from '~/lib/utils'

export interface BaseFieldProps {
  label?: string
  error?: string
  wrapperClassName?: string
  labelClassName?: string
  errorClassName?: string
  /** Label at the top right */
  altLabel1?: React.ReactElement
  /** Label at the bottom right */
  altLabel2?: React.ReactElement
}

export interface FieldProps<E extends HTMLElement> extends BaseFieldProps, React.HTMLProps<E> {
  error?: string
}

type FieldPropsWithoutBase<E extends HTMLElement, P extends FieldProps<E>> = Omit<P, keyof BaseFieldProps> & {
  error?: string
}

export const makeBaseField = <E extends HTMLElement = HTMLInputElement, P extends FieldProps<E> = FieldProps<E>>(
  name: string,
  Comp: React.FunctionComponent<FieldPropsWithoutBase<E, P>>
) => {
  const Field = React.forwardRef((props: P, forwardedRef) => {
    const _id = useId()
    const id = props.id || _id
    const { label, error, wrapperClassName, labelClassName, errorClassName, altLabel1, altLabel2, ...inputProps } =
      props

    return (
      <div className={tw('form-control w-full', wrapperClassName)}>
        {label ||
          (altLabel1 && (
            <label htmlFor={id} className="label">
              {label && (
                <span className={tw('label-text uppercase', error && 'text-error', labelClassName)}>{label}</span>
              )}
              {altLabel1 && <span className={tw('label-text-alt ml-auto')}>{altLabel1}</span>}
            </label>
          ))}

        <Comp {...inputProps} id={id} ref={forwardedRef} />

        {error ||
          (altLabel2 && (
            <label htmlFor={id} className="label pt-1.5">
              {error && <span className={tw('label-text-alt text-error', errorClassName)}>{error}</span>}
              {altLabel2 && <span className={tw('label-text-alt ml-auto')}>{altLabel2}</span>}
            </label>
          ))}
      </div>
    )
  })

  Field.displayName = name

  return Field
}
