// Magic Link Service for email authentication
import { supabaseClient } from '@/lib/supabase-client';
import { EmailCapture, User } from '@/lib/types/database';

// Generate a magic link token
export function generateMagicLinkToken(): string {
  return `ml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Save email capture with magic link
export async function saveEmailCapture(params: {
  email: string;
  captureSource: 'landing_exit' | 'editor_exit' | 'save_template';
  niche?: string;
  platform?: string;
  templateId?: string;
}): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const token = generateMagicLinkToken();
    
    const { data, error } = await supabaseClient
      .from('email_captures')
      .insert({
        email: params.email,
        capture_source: params.captureSource,
        niche: params.niche,
        platform: params.platform,
        template_id: params.templateId,
        magic_link_token: token
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving email capture:', error);
      return { success: false, error: error.message };
    }

    // Send magic link email (in production, use email service)
    console.log(`Magic link for ${params.email}: /auth/magic-link?token=${token}`);

    return { success: true, token };
  } catch (error) {
    console.error('Error in saveEmailCapture:', error);
    return { success: false, error: 'Failed to save email' };
  }
}

// Verify magic link token
export async function verifyMagicLink(token: string): Promise<{
  success: boolean;
  email?: string;
  data?: EmailCapture;
  error?: string;
}> {
  try {
    const { data, error } = await supabaseClient
      .from('email_captures')
      .select('*')
      .eq('magic_link_token', token)
      .eq('magic_link_used', false)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Mark token as used
    await supabaseClient
      .from('email_captures')
      .update({ 
        magic_link_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', data.id);

    return { success: true, email: data.email, data };
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return { success: false, error: 'Failed to verify token' };
  }
}

// Create or update user from magic link
export async function createUserFromMagicLink(emailCapture: EmailCapture): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    // Check if user exists
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', emailCapture.email)
      .single();

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error } = await supabaseClient
        .from('users')
        .update({
          last_active: new Date().toISOString(),
          conversion_source: emailCapture.capture_source
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, user: updatedUser };
    }

    // Create new user via Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: emailCapture.email,
      password: generateTempPassword(), // Temporary password, user will set their own
    });

    if (authError) throw authError;

    // Create user profile
    const { data: newUser, error: profileError } = await supabaseClient
      .from('users')
      .insert({
        id: authData.user!.id,
        email: emailCapture.email,
        conversion_source: emailCapture.capture_source,
        entry_niche: emailCapture.niche,
        entry_platform: emailCapture.platform
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error creating user from magic link:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

// Generate temporary password for magic link users
function generateTempPassword(): string {
  return `temp_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
}

// Send magic link email (placeholder - integrate with email service)
export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  // In production, integrate with SendGrid, Resend, or similar
  const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/magic-link?token=${token}`;
  
  console.log(`
    TO: ${email}
    SUBJECT: Your TRENDZO Video is Ready! 🚀
    
    Click here to access your viral video template:
    ${magicLinkUrl}
    
    This link expires in 24 hours.
  `);
}