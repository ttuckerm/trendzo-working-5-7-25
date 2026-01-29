import { notFound } from 'next/navigation'
import { publicV1Spec, publicV2Spec } from '@/lib/api/openapi'

export default function ApiDocsPage({ params }: { params: { version: string } }) {
  const v = params.version
  const spec = v === 'v1' ? publicV1Spec : v === 'v2' ? publicV2Spec : null
  if (!spec) return notFound()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">API {v}</h1>
      <pre className="bg-gray-50 p-4 rounded border overflow-x-auto text-xs">{JSON.stringify(spec, null, 2)}</pre>
    </div>
  )
}












