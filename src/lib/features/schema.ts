import crypto from 'crypto'

export type FeatureSchema = {
  version: string
  dim: number
  fields: string[]
}

export const FEATURE_SCHEMA_V1: FeatureSchema = {
  version: 'v1',
  dim: 6,
  fields: [
    'viewCount',
    'likeCount',
    'commentCount',
    'shareCount',
    'followerCount',
    'hoursSinceUpload'
  ]
}

export function computeSchemaHash(schema: FeatureSchema = FEATURE_SCHEMA_V1): string {
  const norm = JSON.stringify({ v: schema.version, dim: schema.dim, fields: schema.fields })
  return crypto.createHash('sha256').update(norm).digest('hex')
}












