import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic';

export default function OnboardingAliasPage(){
  redirect('/sandbox/workflow/onboarding')
}


