export default function MoatPage(){
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Defensible Moat</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded border p-3">
          <div className="font-medium">Uniqueness Score</div>
          <div className="text-emerald-600 text-xl font-bold">87</div>
        </div>
        <div className="rounded border p-3">
          <div className="font-medium">Benchmark vs Manual</div>
          <div className="text-sm text-gray-600">+23% over manual baselines</div>
        </div>
        <div className="rounded border p-3">
          <div className="font-medium">Patent Candidates</div>
          <button className="rounded border px-3 py-1.5 mt-2">Track</button>
        </div>
      </div>
    </div>
  )
}


