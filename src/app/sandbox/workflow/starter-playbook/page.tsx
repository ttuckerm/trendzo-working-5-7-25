export default function StarterPlaybookPage(){
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Scale From Zero</h1>
      <div className="rounded border p-3 mb-4">
        <div className="font-medium">Daily Tasks</div>
        <ul className="list-disc pl-5 text-sm">
          <li>Post 1 template remix</li>
          <li>Engage 10 comments</li>
        </ul>
      </div>
      <div className="rounded border p-3 mb-4">
        <div className="font-medium">Progress</div>
        <div className="text-sm text-gray-600">Control vs treatment chart (mock)</div>
      </div>
      <button className="rounded border px-3 py-1.5">Export 30-day plan</button>
    </div>
  )
}


