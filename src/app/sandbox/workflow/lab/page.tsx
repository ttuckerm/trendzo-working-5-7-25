export default function LabPage(){
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">AI-Powered R&D (MCP)</h1>
      <div className="space-y-3">
        <div className="rounded border p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">Discovery: Pattern Shift Detector</div>
            <div className="text-sm text-gray-600">Time-to-adoption: 3 days</div>
          </div>
          <button className="rounded border px-3 py-1.5">Add to Stack</button>
        </div>
        <div className="rounded border p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">Discovery: CTA Compression</div>
            <div className="text-sm text-gray-600">Time-to-adoption: 2 days</div>
          </div>
          <button className="rounded border px-3 py-1.5">Add to Stack</button>
        </div>
      </div>
    </div>
  )
}


