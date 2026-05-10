import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic';

export default function SandboxRoot(){
  redirect('/sandbox/workflow/onboarding')
}


