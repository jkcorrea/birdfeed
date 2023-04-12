import type { ActionArgs } from '@remix-run/server-runtime'
import { z } from 'zod'

const PayloadSchema = z.object({
  videoId: z.string(),
})
export type FetchYoutubeTranscriptPayload = z.infer<typeof PayloadSchema>

// Action to fetch a youtube transcript from the official api
export function action({ request }: ActionArgs) {
  const { videoId } = PayloadSchema.parse(request.body)
  return fetch(`https://video.google.com/timedtext?lang=en&v=${videoId}`)
    .then((res) => res.text())
    .then((text) => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')
      const transcript = Array.from(doc.querySelectorAll('text')).map((el) => ({
        text: el.textContent,
        start: Number(el.getAttribute('start')),
        dur: Number(el.getAttribute('dur')),
      }))
      return { json: transcript }
    })
}
