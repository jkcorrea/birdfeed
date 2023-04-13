import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

import { tw } from '~/lib/utils'

export const CopyToClipboardButton = ({ content, className }: { content: string; className?: string }) => (
  <button
    type="button"
    className={tw('btn-ghost btn-sm btn-circle btn flex items-center justify-center', className)}
    onClick={() => {
      navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard!')
    }}
  >
    <ClipboardDocumentIcon className="h-5 w-5" />
  </button>
)
