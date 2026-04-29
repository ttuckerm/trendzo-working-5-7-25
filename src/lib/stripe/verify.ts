import { getServiceSupabase } from './admin';

export type VerifyResult =
  | { valid: true }
  | { valid: false; reason: 'missing' | 'unknown' | 'pending' | 'already_used' | 'expired' | 'config' };

export async function verifySession(sessionId: string): Promise<VerifyResult> {
  const supabase = getServiceSupabase();
  if (!supabase) return { valid: false, reason: 'config' };

  const { data, error } = await supabase
    .from('stripe_purchases')
    .select('status')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('[stripe/verify] query failed', error);
    return { valid: false, reason: 'config' };
  }
  if (!data) return { valid: false, reason: 'unknown' };

  switch (data.status) {
    case 'paid':
      return { valid: true };
    case 'pending':
      return { valid: false, reason: 'pending' };
    case 'consumed':
      return { valid: false, reason: 'already_used' };
    case 'expired':
      return { valid: false, reason: 'expired' };
    default:
      return { valid: false, reason: 'unknown' };
  }
}
