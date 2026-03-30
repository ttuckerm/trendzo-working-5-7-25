// Export OpenAPI specs for v1 and v2
// v2 is currently an alias of v1
// Keep JSON files in /openapi
import v1 from '../../../openapi/public_v1.json'
import v2 from '../../../openapi/public_v2.json'

export const publicV1Spec = v1 as any
export const publicV2Spec = v2 as any












