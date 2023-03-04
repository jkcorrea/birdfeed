import { createId } from '@paralleldrive/cuid2'
import { OpenAIChat } from 'langchain/llms'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

import type { Tweet } from '@prisma/client'
import { Logger } from '~/lib/utils'
import type { IGenerateTweetsForm } from '~/routes/home/GenerateTweetsForm'

import { getPromptTemplate } from './prompts'

import FIXTURES from '../../../test/fixtures/sample_generated_tweets.json'

const MODEL_NAME = 'gpt-3.5-turbo'
const RESULT_REGEX = /(?:\d\W*)\s*"?(.*)"?$/gm
const HASHTAGS_REGEX = /#\w+(?:\s+|$)/g

export type GeneratedTweet = Pick<Tweet, 'id' | 'drafts'>

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)

export async function generateTweetsFromTranscript({
  content,
  __skip_openai,
  maxTweets,
  tone,
  topics,
}: IGenerateTweetsForm): Promise<GeneratedTweet[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    // Each chunk should be 4096 - max output
    chunkSize: 2500, // 15min * 150wpm => 2250
  })
  const chunks = await splitter.createDocuments([content])
  if (chunks.length > 1) Logger.info('Split transcript into chunks', chunks.length)

  let completions = FIXTURES['good']
  if (!__skip_openai) {
    const model = new OpenAIChat({
      modelName: MODEL_NAME,
      temperature: 0.8,
      topP: 1,
      frequencyPenalty: 0.3,
      presencePenalty: 0,
    })
    Logger.info('Using model', model)

    const prompts = await Promise.all(
      chunks.map((chunk) =>
        getPromptTemplate(topics).format({
          transcript: chunk.pageContent,
          // Try to get ~10 tweets, but don't go over 15
          numTweets: clamp(maxTweets / chunks.length, 1, 15),
          tone,
        })
      )
    )

    Logger.info('OpenAI prompt', prompts[0])
    const res = await model.generate(prompts)
    completions = res.generations
      .map((gen) =>
        gen[0].text
          .replace(HASHTAGS_REGEX, '')
          .trim()
          .replace(/(^"|"$)/g, '')
      )
      .join('\n')
    Logger.info('OpenAI raw response', completions)
  }

  const rawLines = completions.matchAll(RESULT_REGEX)

  // TODO save these tweets to db
  const tweets: GeneratedTweet[] = []
  for (const line of rawLines) {
    const tweet = line[1]
    if (!tweet || tweet.length < 1) {
      Logger.warn('Line blank or invalid', line)
      continue
    }
    tweets.push({ id: createId(), drafts: [tweet] })
  }

  return tweets
}
