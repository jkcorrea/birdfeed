import { createId } from '@paralleldrive/cuid2'
import { OpenAIChat } from 'langchain/llms'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

import type { Tweet } from '@prisma/client'
import { Logger } from '~/lib/utils'

import type { PromptSettings } from './prompt-settings'
import { defaultSettings } from './prompt-settings'
import { makeGenPrompt, makeRegenPrompt } from './prompts'

import FIXTURES from '../../../test/fixtures/sample_generated_tweets.json'

const MODEL_NAME = 'gpt-3.5-turbo'
const RESULT_REGEX = /(?:\d+\W*)\s*(.*)$/gm

const HASHTAGS_REGEX = /#\w+(?:\s+|$)/g

const CHUNK_SIZE = 8000 // 10min * 150wpm * 5char/word

const cleanup = (str: string) => str.replaceAll('"', '').replaceAll(HASHTAGS_REGEX, '').trim()

export type GeneratedTweet = Pick<Tweet, 'id' | 'drafts' | 'document'> & Partial<Pick<Tweet, 'transcriptId'>>

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)

const model = new OpenAIChat({
  modelName: MODEL_NAME,
  temperature: 0.8,
  topP: 1,
  frequencyPenalty: 0.3,
  presencePenalty: 0,
  concurrency: 10,
})

export async function generateTweetsFromContent(content: string, settings?: PromptSettings): Promise<GeneratedTweet[]> {
  const { maxTweets = 5, tone = '', topics = [], __skip_openai = false } = { ...defaultSettings, ...settings }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
  })

  const chunks = await splitter.createDocuments([content])
  if (chunks.length > 1) Logger.info('Split transcript into chunks', chunks.length)
  Logger.info('OpenAI prompt', chunks[0].pageContent.length)

  let completions = FIXTURES['good']
  if (!__skip_openai) {
    const prompts = chunks
      //  if it's too short, we'll get an error from openai
      .filter((chunk) => chunk.pageContent.length > 400)
      .map((chunk) =>
        makeGenPrompt({
          transcript: chunk.pageContent,
          // Try to get ~10 tweets, but don't go over 15
          numTweets: Math.round(clamp(maxTweets / chunks.length, 1, 15)),
          tone,
          topics,
        })
      )

    if (prompts.length < 1)
      throw new Error('No prompts generated.  Either transcript is too short or some other issue generating prompts.')

    Logger.info('OpenAI prompt', prompts[0])
    // Langchain calls to openai with 1 request w/ mutliple messages (aka prompts)
    // This structure makes multiple called to openai with 1 message each
    const responsesPromises = prompts.map((prompt) => model.generate([prompt]))
    const responses = await Promise.all(responsesPromises)
    completions = (responses || []).reduce(
      (acc, res) => [...acc, ...res.generations.map((gen) => gen[0].text)],
      [] as string[]
    )
    Logger.info('OpenAI raw response', completions.join('\n'))
  }

  const tweets: GeneratedTweet[] = completions
    .map((completion, index) => {
      const ts: GeneratedTweet[] = []
      for (const line of completion.matchAll(RESULT_REGEX)) {
        ts.push({
          id: createId(),
          drafts: [cleanup(line[1])],
          document: chunks[index].pageContent,
        })
      }

      return ts
    })
    .flat()

  return tweets
}

export async function regenerateTweetFromSelf(tweet: Tweet): Promise<string> {
  const prompt = makeRegenPrompt({
    drafts: tweet.drafts.slice(0, 5),
    tone: 'neutral',
    transcript: tweet.document.slice(0, CHUNK_SIZE),
  })

  Logger.info('OpenAI prompt', prompt)
  const res = await model.generate([prompt])
  const completion = res.generations[0][0].text
  Logger.info('OpenAI raw response', completion)

  return cleanup(completion)
}
