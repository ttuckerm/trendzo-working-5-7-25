"use client";

import { useRouter } from 'next/navigation';
import CanvasOverlay from '@/components/canvas/CanvasOverlay';
import { PerfHUD } from '@/components/templateMiniUI/PerfHUD';
import CanvasPortal from '@/components/canvas/CanvasPortal';

export default function CanvasOSPage() {
  const router = useRouter();
  // Gate: only mount Canvas Mode when sandbox flag is enabled
  const enabled = (process.env.NEXT_PUBLIC_SANDBOX_CANVAS || 'false') === 'true';
  if (!enabled) return null;
  return (
    <CanvasPortal>
      <>
        <CanvasOverlay templateId={'sandbox-template'} onExit={() => router.push('/dashboard-view/template-library')} />
        <PerfHUD />
      </>
    </CanvasPortal>
  );
}


