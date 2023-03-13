import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/solid'

import { tw } from '~/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: React.ReactNode
  initialFocus?: React.RefObject<HTMLElement>
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  panelClassName?: string
}

const FullscreenModal = ({
  isOpen,
  onClose,
  title,
  children,
  initialFocus,
  panelClassName,
  leftAction,
  rightAction,
}: Props) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" initialFocus={initialFocus} className="reltaive z-10" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/50" />
      </Transition.Child>
      <div className="fixed inset-x-0 inset-y-[5%] items-center overflow-y-auto">
        <div className="flex justify-center text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={tw(
                'w-full max-w-xl overflow-y-auto rounded-lg bg-base-100 p-4 overflow-x-hidden',
                panelClassName
              )}
            >
              {/* Topbar */}
              <div className="navbar mb-4 min-h-0">
                <div className="navbar-start gap-10">
                  {leftAction || (
                    <button className="btn-ghost btn-xs btn-circle btn border-none" onClick={onClose}>
                      <XMarkIcon className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </button>
                  )}
                  {title && (
                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                      {title}
                    </Dialog.Title>
                  )}
                </div>

                {/* Title */}
                <div className="navbar-center"></div>

                {/* Action Bar */}
                <div className="navbar-end">{rightAction}</div>
              </div>

              {/* Body */}
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
)
export default FullscreenModal
