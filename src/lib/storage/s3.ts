import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'

const region = process.env.AWS_REGION || 'us-east-1'
const bucket = process.env.S3_BUCKET || ''
const localRoot = path.join(process.cwd(), 'storage')

let s3: S3Client | null = null
if (bucket) {
  s3 = new S3Client({ region })
}

export async function putObject(key: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<{ ok: boolean; url?: string }>{
  if (s3 && bucket) {
    try {
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body as any, ContentType: contentType }))
      const url = `s3://${bucket}/${key}`
      return { ok: true, url }
    } catch (e) {
      // fall through to local
    }
  }
  const filePath = path.join(localRoot, key)
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, Buffer.isBuffer(body) ? body : Buffer.from(String(body)))
  return { ok: true, url: filePath }
}

export async function headObject(key: string): Promise<boolean> {
  if (s3 && bucket) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
      return true
    } catch {
      return false
    }
  }
  try {
    const filePath = path.join(localRoot, key)
    await fs.promises.access(filePath)
    return true
  } catch {
    return false
  }
}


