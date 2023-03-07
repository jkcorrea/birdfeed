import type { HTMLProps } from 'react'

interface Props<S extends { intent: string }> extends HTMLProps<HTMLInputElement> {
  value: S['intent']
}

/**
 * A type-safe wrapper for hidden fields that specify an action "intent".
 *
 * We use these when there's multiple actions on a single page.
 */
const IntentField = <S extends { intent: string }>(props: Props<S>) => (
  <input {...props} type="hidden" name={props.name ?? 'intent'} />
)
export default IntentField
