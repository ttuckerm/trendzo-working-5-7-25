export default function WhatYouMissedPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-[fadeSlideUp_0.5s_ease-out_both]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0f0f16] border border-[#1e1e2e] flex items-center justify-center">
          <span className="text-2xl">🔥</span>
        </div>
        <h2 className="text-xl font-display font-bold text-[#e8e6e3]">What You Missed</h2>
        <p className="text-sm text-[#7a7889] max-w-md font-body">
          Catch up on trends and opportunities you may have overlooked.
        </p>
        <span className="inline-block px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.12em] rounded-full bg-[#e63946]/10 text-[#e63946] border border-[#e63946]/20">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
