import { Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import type { Toast } from 'react-hot-toast'
import { toast as RHToast, ToastIcon } from 'react-hot-toast'

interface Props {
  toast: Toast
  title?: string
  children?: React.ReactNode
}

export const NotificationToast = ({ toast: t, title, children }: Props) => (
  <Transition
    appear
    as="div"
    className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5"
    show={t.visible}
    enter="transform ease-out duration-300 transition"
    enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
    enterTo="translate-y-0 opacity-100 sm:translate-x-0"
    leave="transition ease-in duration-100"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    <div className="p-4">
      <div className="flex items-start">
        {/* Icon */}
        <ToastIcon toast={t} />

        {/* Body */}
        <div className="ml-3 w-0 flex-1">
          {title && <p className="text-sm font-medium text-gray-900">{title}</p>}
          {children}
        </div>

        {/* Close */}
        <div className="ml-4 flex shrink-0">
          <button
            type="button"
            className="btn-ghost btn-xs btn-circle btn ml-auto"
            onClick={() => RHToast.dismiss(t.id)}
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
)
