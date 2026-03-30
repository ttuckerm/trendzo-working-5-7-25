import FreedomOSTool from './FreedomOSTool'

export const metadata = {
  title: 'Freedom OS | Trendzo',
  description: 'Build your first online income stream with a personalized step-by-step launch plan. No login required.',
}

export default function FreedomOSPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050507' }}>
      {/* Print stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: #fff !important; color: #111 !important; -webkit-print-color-adjust: exact; }
          .print-hide { display: none !important; }
          .print-only { display: block !important; }
          .print-section {
            background: #fff !important;
            border: 1px solid #e5e7eb !important;
            color: #111 !important;
            page-break-inside: avoid;
          }
          .print-section * { color: #111 !important; }
          .print-section h3 { color: #666 !important; }
          @page { margin: 1.5cm; }
        }
      `}} />
      <main className="flex-1">
        <FreedomOSTool />
      </main>
    </div>
  )
}
