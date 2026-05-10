export const dynamic = 'force-dynamic';
export default function WhatYouMissedPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-[fadeSlideUp_0.5s_ease-out_both]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1c1c24] border border-[#2a2a35] flex items-center justify-center">
          <span className="text-2xl">🔥</span>
        </div>
        <h2 className="text-xl font-display font-bold text-[#e8e8f0]">What You Missed</h2>
        <p className="text-sm text-[#8888a0] max-w-md font-body">
          Catch up on trends and opportunities you may have overlooked.
        </p>
        <span className="inline-block px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.12em] rounded-full bg-[#f04a4d]/10 text-[#f04a4d] border border-[#f04a4d]/20">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
