interface GenerateTweetsTemplateArgs {
  tone: string
  numTweets: number
  transcript: string
  topics?: string[]
}

export const makeGenPrompt = ({ tone, numTweets, topics, transcript }: GenerateTweetsTemplateArgs) =>
  `You are a ${tone} marketing copywriter. Given the following conversation I had, come up with ${numTweets} interesting statements that I can share on social media.${
    topics && topics.length > 0
      ? `

Make sure to focus on the following sub-topics:
"""
${topics.map((topic) => `- ${topic}`).join('\n')}
"""`
      : ''
  }

Conversation:
"""
${transcript}
"""

Use these rules to guide your writing:
- Place each tweet on a new line and number them
- Do not use hash tags
- Do not refer to the conversation
- When in doubt, you can pull a direct quote from the conversation that's interesting and relevant
- Keep it under 100 words

Tweets:

1.`

interface RegenerateTweetTemplateArgs {
  tone: string
  transcript: string
  drafts: string[]
}
export const makeRegenPrompt = ({
  tone,
  transcript,
  drafts,
}: RegenerateTweetTemplateArgs) => `You are a ${tone} marketing copywriter. Come up with another variation of this interesting statement I wrote for social media. Keep it around once sentence.

For context, I was trying to summarize this conversation I had:
"""
${transcript}
"""

My drafts:
"""
${drafts.map((draft) => `- ${draft}`).join('\n')}
"""

Your draft:`
