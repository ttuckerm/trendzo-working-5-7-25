'use client';

import { useEffect } from 'react';
import { trackCompleteRegistration, once } from '@/lib/analytics/meta-pixel';

interface Props {
  assessmentId: string;
}

export default function MetaPixelAssessmentEvent({ assessmentId }: Props) {
  useEffect(() => {
    if (!assessmentId) return;
    if (once(`meta_pixel:completereg:${assessmentId}`)) {
      trackCompleteRegistration();
    }
  }, [assessmentId]);
  return null;
}
