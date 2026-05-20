'use client';

import { useEffect } from 'react';
import { trackLead, trackPurchase, once } from '@/lib/analytics/meta-pixel';

interface Props {
  isPaid: boolean;
  isCode: boolean;
  sessionId: string | null;
}

const PURCHASE_VALUE = 97.0;
const PURCHASE_CURRENCY = 'USD';

export default function MetaPixelWelcomeEvents({ isPaid, isCode, sessionId }: Props) {
  useEffect(() => {
    if (isPaid && sessionId) {
      if (once(`meta_pixel:purchase:${sessionId}`)) {
        trackPurchase(PURCHASE_VALUE, PURCHASE_CURRENCY);
      }
      return;
    }
    if (isCode) {
      if (once('meta_pixel:lead:code')) {
        trackLead({ content_name: 'code_redeemed' });
      }
    }
  }, [isPaid, isCode, sessionId]);

  return null;
}
