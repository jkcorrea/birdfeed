import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'

import { UPLOAD_LIMIT_FREE_DURATION, UPLOAD_LIMIT_PRO_DURATION } from './constants'
import { NODE_ENV } from './env'

export async function convertToMp3(inputFile: File, isAuthed: boolean, onProgress?: (progress: number) => void) {
  // Create an FFmpeg instance
  const ffmpeg = createFFmpeg({ log: true })

  // Load the FFmpeg core
  await ffmpeg.load()
  ffmpeg.setLogging(NODE_ENV === 'development')
  if (onProgress) ffmpeg.setProgress(({ ratio }) => onProgress(ratio))

  // Get the file name without extension
  const fileName = inputFile.name.replace(/\.[^/.]+$/, '')

  // Set the maximum duration (in seconds)

  // Read the input file
  ffmpeg.FS('writeFile', inputFile.name, await fetchFile(inputFile))

  // Run the FFmpeg command to convert the input file to MP3 and limit the duration
  await ffmpeg.run(
    '-i',
    inputFile.name,
    '-t',
    (isAuthed ? UPLOAD_LIMIT_PRO_DURATION : UPLOAD_LIMIT_FREE_DURATION).toString(),
    '-codec:a',
    'libmp3lame',
    '-qscale:a',
    '2',
    `${fileName}.mp3`
  )

  // Read the output file
  const data = ffmpeg.FS('readFile', `${fileName}.mp3`)

  // Create a File from the output file data
  const outputFile = new File([data.buffer], `${fileName}.mp3`, { type: 'audio/mp3' })
  return outputFile
}
