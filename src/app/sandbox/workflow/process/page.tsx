export default function ProcessPage(){
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Process Intelligence</h1>
      <div className="rounded border p-3 mb-4">
        <div className="font-medium">Journey Map</div>
        <div className="text-sm text-gray-600">Mock journey with drop-offs; top bottlenecks highlighted.</div>
      </div>
      <div className="rounded border p-3 mb-4">
        <div className="font-medium">Top Bottlenecks</div>
        <ul className="list-disc pl-5 text-sm">
          <li>Onboarding goal confusion</li>
          <li>Script editing time too long</li>
        </ul>
      </div>
      <div className="rounded border p-3">
        <div className="font-medium">ROI-ranked Fixes</div>
        <ul className="list-disc pl-5 text-sm">
          <li>Pre-fill niche-specific CTAs</li>
          <li>One-click hook generator</li>
        </ul>
      </div>
    </div>
  )
}


