import { putObject } from '@/lib/storage/s3'
import { decomposeVideo } from '@/lib/services/featureDecomposer'
import path from 'path'
import fs from 'fs'

export interface ExtractResult {
  asr_transcript?: any
  ocr_overlays?: any
  beat_timeline?: any
  audio?: { url?: string; bpm?: number; energy_mood?: string; speech_rate_wpm?: number }
}

export async function extractFeaturesFromLocalMp4(mp4Path: string, opts?: { id?: string }): Promise<ExtractResult> {
  const id = opts?.id || path.basename(mp4Path, path.extname(mp4Path))
  await decomposeVideo({ id, filepath: mp4Path, caption: '' })

  // Upload transcript/audio if available (best-effort)
  const audioPath = path.join(process.cwd(), 'data', 'audio', `${id}.wav`)
  let audioUrl: string | undefined
  if (fs.existsSync(audioPath)) {
    const buf = await fs.promises.readFile(audioPath)
    const put = await putObject(`quickwin/audio/${id}.wav`, buf, 'audio/wav')
    audioUrl = put.url
  }

  return {
    asr_transcript: null, // TODO(model): wire to decompose output
    ocr_overlays: null,   // TODO(model): wire to decompose output
    beat_timeline: [],    // TODO(heuristic)
    audio: { url: audioUrl }
  }
}


