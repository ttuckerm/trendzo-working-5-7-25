'use client';

import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#08080d' }}>
      <div className="w-full max-w-md p-8 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <svg
          className="w-14 h-14 mx-auto mb-4 text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v4m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <h1 className="mb-3 text-2xl font-bold text-center text-white" style={{ fontFamily: 'var(--font-display), serif' }}>
          Access Denied
        </h1>

        <p className="mb-6 text-center text-zinc-400 text-sm">
          You don&apos;t have permission to access this page.
        </p>

        <div className="flex flex-col space-y-3">
          <Link
            href="/login"
            className="inline-flex justify-center px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:brightness-110"
            style={{ backgroundColor: '#dc143c' }}
          >
            Sign in with a different account
          </Link>

          <Link
            href="/"
            className="inline-flex justify-center px-4 py-2.5 text-sm text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
