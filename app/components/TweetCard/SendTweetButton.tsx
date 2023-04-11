import { ChevronUpIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import posthog from 'posthog-js'
import { toast } from 'react-hot-toast'

import { TweetOutlet } from '~/lib/constants'
import { useUiStore } from '~/lib/ui-store'
import { buildSendHypefuryUrl, buildSendTweetUrl, tw } from '~/lib/utils'

const HypefuryIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="500"
    height="500"
    viewBox="0 0 500 500"
    version="1.1"
  >
    <path
      d="M 64.500 86.734 C 65.050 87.299, 75.625 95.519, 88 104.999 C 100.375 114.479, 112.525 123.806, 115 125.726 C 117.475 127.646, 127.506 135.288, 137.291 142.707 C 147.077 150.126, 155.761 157.233, 156.591 158.499 C 157.421 159.765, 158.933 162.983, 159.950 165.651 C 160.968 168.318, 167.644 184.900, 174.786 202.500 C 189.957 239.887, 219.792 313.544, 221.013 316.625 L 221.856 318.751 192.678 324.447 C 176.630 327.580, 153.938 332.010, 142.250 334.293 C 130.563 336.575, 121 338.698, 121 339.010 C 121 339.321, 125.162 340.326, 130.250 341.243 C 166.929 347.850, 189.416 352.082, 189.782 352.449 C 189.955 352.622, 185.153 361.920, 179.111 373.111 C 173.069 384.302, 168.242 393.576, 168.386 393.719 C 168.529 393.862, 193.977 383.824, 224.936 371.411 L 281.225 348.841 284.323 351.671 C 286.027 353.227, 289.914 356.789, 292.960 359.588 C 296.007 362.386, 306.825 372.269, 317 381.552 C 327.175 390.834, 337.727 400.543, 340.448 403.128 L 345.396 407.828 352.948 408.896 C 357.102 409.484, 363.533 410.259, 367.241 410.619 L 373.982 411.274 374.985 414.887 C 375.537 416.874, 375.998 419.175, 376.010 420 C 376.021 420.825, 376.409 422.098, 376.873 422.828 L 377.714 424.156 387.546 420.830 L 397.378 417.504 390.439 416.502 L 383.500 415.500 383.189 412.286 L 382.879 409.072 388.038 410.604 C 390.876 411.447, 393.432 411.902, 393.718 411.615 C 394.005 411.328, 392.391 409.160, 390.131 406.797 C 385.464 401.917, 385.338 401.420, 387.909 398.075 L 389.773 395.649 395.739 397.825 C 399.021 399.021, 402.098 400, 402.578 400 C 403.057 400, 400.098 396.625, 396.001 392.501 L 388.552 385.002 382.439 391.061 L 376.325 397.120 373.757 396.475 L 371.189 395.831 366.778 390.165 C 364.352 387.049, 356.925 377.691, 350.275 369.370 L 338.183 354.239 352.341 343.318 C 360.129 337.312, 370.325 329.495, 375 325.949 C 379.675 322.402, 383.650 319.162, 383.833 318.750 C 384.017 318.337, 384.782 318, 385.534 318 C 387.406 318, 427.211 334.946, 428.669 336.364 C 429.312 336.989, 431.275 343.125, 433.031 350 C 434.788 356.875, 436.546 362.849, 436.938 363.275 C 437.456 363.839, 446.358 336.231, 447.382 330.884 C 447.447 330.545, 440.648 320.824, 432.274 309.280 L 417.048 288.292 392.774 277.748 C 379.423 271.949, 356.260 261.905, 341.299 255.428 L 314.098 243.651 313.142 241.076 C 312.617 239.659, 305.840 222.516, 298.082 202.981 L 283.978 167.462 278.739 165.613 C 273.122 163.631, 245.096 153.269, 209.500 140.013 C 168.986 124.926, 153.568 119.206, 143.500 115.525 C 138 113.515, 130.575 110.725, 127 109.327 C 123.425 107.929, 115.775 105.066, 110 102.965 C 101.314 99.806, 73.007 89.309, 65.500 86.464 L 63.500 85.706 64.500 86.734 M 306 183.030 C 306 183.597, 307.058 186.634, 308.350 189.780 C 309.643 192.926, 313.979 203.908, 317.985 214.183 L 325.270 232.867 347.295 242.472 L 369.321 252.077 372.802 248.288 C 374.717 246.205, 381.957 238.649, 388.892 231.498 C 413.594 206.023, 431.536 187.382, 433.924 184.711 L 436.349 182 371.174 182 L 306 182 306 183.030"
      stroke="none"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

type TweetOutletMeta = { icon: JSX.Element; label: string; action: (content: string, isAuthed?: boolean) => any }
const outletMeta: Record<TweetOutlet, TweetOutletMeta> = {
  [TweetOutlet.TWITTER]: {
    icon: <PaperAirplaneIcon className="-mt-1 h-4 w-4 -rotate-45" />,
    label: 'Send to Twitter',
    action: (content, isAuthed) => window.open(buildSendTweetUrl(content, isAuthed), '_blank', 'noopener,noreferrer'),
  },
  [TweetOutlet.CLIPBOARD]: {
    icon: <ClipboardDocumentIcon className="h-4 w-4" />,
    label: 'Copy to clipboard',
    action: (content) => {
      navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard!')
    },
  },
  [TweetOutlet.HYPEFURY]: {
    icon: <HypefuryIcon className="h-5 w-5" />,
    label: 'Open in Hypefury',
    action: (content) => window.open(buildSendHypefuryUrl(content), '_blank', 'noopener,noreferrer'),
  },
}

interface Props {
  body: string
  tweetId: string
  isAuthed?: boolean
}

// TODO delete tweet after sending off
// TODO track in db with a 5-star rating

export const SendTweetButton = ({ body, tweetId, isAuthed }: Props) => {
  const { lastUsedOutlet, setLastUsedOutlet } = useUiStore()
  const outlet = outletMeta[lastUsedOutlet]

  return (
    <div className="btn-group flex items-center rounded-full bg-info">
      <button
        type="button"
        className={tw(
          'btn-info btn-sm btn flex items-center gap-2 lowercase text-white',
          !isAuthed && 'cursor-not-allowed'
        )}
        onClick={(e) => {
          if (!isAuthed) return
          e.preventDefault()
          posthog.capture('tweet_send', { tweetId: tweetId, outlet: lastUsedOutlet })
          outlet.action(body, isAuthed)
        }}
      >
        {lastUsedOutlet}
        {outlet.icon}
      </button>

      <div className="h-[75%] w-[2px] rounded-full bg-white/60" />

      {/* eslint-disable-next-line prettier/prettier */}
      <div className="dropdown-top dropdown-end dropdown rounded-full bg-transparent">
        <label
          tabIndex={0}
          className="group btn-info btn-sm btn flex items-center justify-center border-none !bg-transparent px-2"
        >
          <ChevronUpIcon className="h-5 w-5 text-white/70 group-hover:text-white/100" />
          <span className="sr-only">Open menu</span>
        </label>
        <ul tabIndex={0} className="dropdown-content menu rounded-box mb-2 w-52 bg-base-100 p-2 text-sm shadow">
          {Object.entries(outletMeta).map(([key, { icon, label }]) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  const ae = document.activeElement as any
                  ae.blur()
                  setLastUsedOutlet(key as TweetOutlet)
                }}
              >
                {icon}
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
