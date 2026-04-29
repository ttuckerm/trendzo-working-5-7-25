'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const MESSAGES: Record<string, string> = {
  cancelled: 'Checkout cancelled. No charge was made.',
  invalid: 'That checkout session could not be verified. If you just paid, try refreshing in a moment.',
  already_used: 'That checkout has already been used to generate an assessment.',
};

export function CheckoutBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = searchParams?.get('checkout');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status && MESSAGES[status]) setVisible(true);
  }, [status]);

  if (!visible || !status || !MESSAGES[status]) return null;

  function dismiss() {
    setVisible(false);
    // Strip the query param so a refresh doesn't resurface the banner.
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('checkout');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname || '/');
  }

  return (
    <div
      role="status"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] rounded-lg border border-instrument-divider bg-instrument-surface/95 backdrop-blur-sm px-4 py-3 shadow-lg"
      style={{ borderColor: 'rgba(240, 74, 77, 0.35)' }}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 font-mono text-xs sm:text-sm text-instrument-secondary leading-relaxed">
          {MESSAGES[status]}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="font-mono text-xs text-instrument-tertiary hover:text-instrument-primary transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}
