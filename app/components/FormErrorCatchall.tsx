import type { Zorm } from 'react-zorm'
import type { z } from 'zod'

interface Props {
  schema: z.ZodObject<any>
  zorm: Zorm<any>
}

function FormErrorCatchall({ schema, zorm }: Props) {
  return (
    <ul className="space-y-1">
      {Object.keys(schema.shape).map((key) => {
        const error = zorm.errors[key as any]?.()
        return error ? (
          <li key={key} className="text-xs text-error">
            {error.message}
          </li>
        ) : null
      })}
    </ul>
  )
}
export default FormErrorCatchall
