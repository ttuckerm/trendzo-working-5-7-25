import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic';

export default function SandboxWorkflowRoot(){
  redirect('/sandbox/workflow/onboarding')
}


