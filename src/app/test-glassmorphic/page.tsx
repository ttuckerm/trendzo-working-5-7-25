'use client';

export default function TestGlassmorphic() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
          Glassmorphic Test Page
        </h1>
        
        <div 
          className="p-8 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
          }}
        >
          <h2 className="text-2xl font-semibold mb-4">Premium Design System</h2>
          <p className="text-gray-300 mb-6">
            This page demonstrates the glassmorphic design system with purple gradient accents.
          </p>
          
          <button
            className="px-6 py-3 rounded-xl font-semibold"
            style={{
              background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)'
            }}
          >
            Test Button
          </button>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold mb-2">Feature {i}</h3>
              <p className="text-sm text-gray-400">
                Example glassmorphic card with blur effect
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}