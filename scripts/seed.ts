/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'

import { rand, randBoolean, randNumber, randPhrase, randSoonDate } from '@ngneat/falso'
import { capitalCase, snakeCase } from 'change-case'
import fg from 'fast-glob'

import { db } from '~/database'
import { supabaseAdmin } from '~/services/supabase'
import { createUserAccount } from '~/services/user'

const env = process.env.NODE_ENV ?? 'development'

const DEFAULT_USER = 'admin@birdfeed.ai'
const DEFAULT_PASSWORD = 'password'

const transcripts = fg.sync('notebooks/data/transcripts/*.txt').reduce((acc, file) => {
  const name = path.basename(file, '.txt')
  const content = fs.readFileSync(file, 'utf8')
  return [...acc, { name, content }]
}, [] as { name: string; content: string }[])

// Grab all the resource keys
const resources = ['users', 'tweets', 'transcripts'] as const

export const resetDB = async () => {
  // Reset supabase auth users
  await supabaseAdmin().from('auth.users').delete()

  // Reset the tables we generate fake data for
  for (const res of resources) {
    console.log(`Resetting ${capitalCase(res)} table..`)
    const tableName = snakeCase(res)
    await db.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`)
  }

  // Create a default user
  const user = await createUserAccount({ email: DEFAULT_USER, password: DEFAULT_PASSWORD })
  console.log(`Created default user: ${user.email} with password: ${DEFAULT_PASSWORD}`)
  return user
}

async function main() {
  const { userId } = await resetDB()

  console.log()
  console.log('Creating Transcripts...')
  const { count: trsCount } = await db.transcript.createMany({
    data: Array.from(Array(10).keys()).map(() => {
      const { name, content } = transcripts[Math.floor(Math.random() * transcripts.length)]
      return {
        name,
        content,
        userId,
      }
    }),
  })
  console.log(`Created ${trsCount} Transcripts!`)
  const trs = await db.transcript.findMany()

  console.log()
  console.log('Creating Tweets...')
  const { count: tweetsCount } = await db.tweet.createMany({
    data: Array.from(Array(100).keys()).map(() => {
      const tr = rand(trs)
      return {
        transcriptId: tr.id,
        sendAt: randSoonDate(),
        drafts: Array.from(Array(randNumber({ min: 1, max: 5 })).keys()).map(() => randPhrase()),
        archived: randBoolean(),
        rating: rand([null, 1, 2, 3, 4]),
        document: tr.content,
      }
    }),
  })
  console.log(`Created ${tweetsCount} Tweets!`)
}

// This script is destructive, so we only want to run it in development
if (env === 'development')
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await db.$disconnect()
    })
