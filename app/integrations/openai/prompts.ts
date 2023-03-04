import { PromptTemplate } from 'langchain/prompts'

const makeTemplate = (topics?: string[]) =>
  `You are a {tone} marketing copy writer. Pull the following conversation I had, come up with {numTweets} interesting statements that I can share on social media.${
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
{transcript}
"""

Use these rules to guide your writing:
- Place each tweet on a new line and number them
- Do not use hash tags
- Do not refer to the conversation
- When in doubt, you can pull a direct quote from the conversation that's interesting and relevant

Tweets:

1.`.trim()

export const getPromptTemplate = (topics?: string[]) =>
  new PromptTemplate({
    template: makeTemplate(topics),
    inputVariables: ['numTweets', 'transcript', 'tone'],
  })
