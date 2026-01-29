'use client';

export default function MarketingStudioTestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Marketing Studio Test</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>This is a test page outside the admin folder.</p>
        <p className="mt-2">If this loads but /admin/marketing-studio doesn't, the issue is with the admin layout or auth wrapper.</p>
      </div>
    </div>
  );
}