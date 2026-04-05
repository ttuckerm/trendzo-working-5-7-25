import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  // Verify cron secret (simple auth for cron jobs)
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find sessions due for check-in:
    // - Haven't chatted in 5-9 days
    // - Arc still active (week <= 8)
    // - Has actually chatted before
    // - Not unsubscribed
    const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const { data: sessions, error } = await supabase
      .from('freedom_agent_sessions')
      .select('id, email, current_week, progress_state, freedom_os_plan, last_message_at, created_at')
      .lt('last_message_at', fiveDaysAgo)
      .gt('last_message_at', nineDaysAgo)
      .lte('current_week', 8)
      .eq('email_unsubscribed', false)
      .order('last_message_at', { ascending: true });

    if (error) {
      console.error('[CHECK-IN] Query error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    // Also catch sessions that signed up but never sent a message
    const { data: dormantSessions } = await supabase
      .from('freedom_agent_sessions')
      .select('id, email, current_week, progress_state, freedom_os_plan, created_at')
      .is('last_message_at', null)
      .lt('created_at', fiveDaysAgo)
      .gt('created_at', nineDaysAgo)
      .eq('email_unsubscribed', false);

    const allSessions = [...(sessions || []), ...(dormantSessions || [])];

    if (allSessions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No sessions due for check-in' });
    }

    const results = [];

    for (const session of allSessions) {
      const email = generateCheckInEmail(session);
      const sent = await sendEmail(session.email, email.subject, email.html);
      results.push({
        email: session.email,
        week: session.current_week,
        sent
      });
    }

    const sentCount = results.filter(r => r.sent).length;
    return NextResponse.json({
      sent: sentCount,
      total: allSessions.length,
      results
    });

  } catch (err) {
    console.error('Weekly check-in error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateCheckInEmail(session: {
  id: string;
  email: string;
  current_week: number;
  progress_state: any;
  freedom_os_plan: any;
  created_at: string;
}): { subject: string; html: string } {
  const week = session.current_week;
  const progress = session.progress_state || {};
  const plan = session.freedom_os_plan || {};
  const agentUrl = `${BASE_URL}/free/freedom-agent/${session.id}`;
  const name = session.email.split('@')[0];

  // Week-specific subject lines
  const subjects: Record<number, string> = {
    1: "Quick check-in on your business plan",
    2: "How's week 2 going?",
    3: "You're almost a month in",
    4: "Halfway point — let's talk strategy",
    5: "Week 5: the consistency test",
    6: "Something I want to share with you",
    7: "One week left in your sprint",
    8: "Your 8-week journey — let's wrap up strong",
  };

  // Week-specific body content
  const bodies: Record<number, string> = {
    1: `You started building your plan${plan.nicheInterest ? ` around ${plan.nicheInterest}` : ''} — how's it going? Your AI advisor has some ideas for your next step.`,
    2: `Week 2 is where most people either build momentum or stall. Your advisor remembers exactly where you left off and has specific next steps ready.`,
    3: `Three weeks in. ${progress.hasPostedContent ? "You've already posted content — let's talk about what's working." : "Ready to take the next step? Your advisor has a plan."}`,
    4: `You're at the halfway mark. ${progress.hasChosenNiche ? "Your niche is locked in" : "Let's nail down your direction"}. Your advisor has been thinking about your progress.`,
    5: `This is the week that separates people who talk about building a business from people who actually do it. Your advisor is ready when you are.`,
    6: `Your advisor has something to share with you — something that might change how you think about content strategy. Worth 5 minutes of your time.`,
    7: `One week left. ${progress.hasEarnedFirstRevenue ? "You've already hit your first revenue — let's talk about scaling." : "Let's make this final push count."}`,
    8: `Eight weeks ago you started with an idea. Let's look at how far you've come and talk about what's next.`,
  };

  const subject = subjects[week] || subjects[1];
  const body = bodies[week] || bodies[1];

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #08080d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; padding: 32px 20px;">
    <tr>
      <td>
        <p style="color: #a0a0a0; font-size: 13px; margin: 0 0 24px 0;">FREEDOM AGENT &middot; WEEK ${week} OF 8</p>
        <p style="color: #ffffff; font-size: 18px; line-height: 1.5; margin: 0 0 16px 0;">Hey${name ? ` ${name}` : ''},</p>
        <p style="color: #d0d0d0; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">${body}</p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color: #e63946; border-radius: 8px; padding: 14px 28px;">
              <a href="${agentUrl}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">Continue with your advisor</a>
            </td>
          </tr>
        </table>
        <p style="color: #666666; font-size: 12px; margin: 32px 0 0 0; line-height: 1.5;">
          You're receiving this because you started a Freedom Agent session.
          <a href="${BASE_URL}/api/freedom-agent/unsubscribe?email=${encodeURIComponent(session.email)}" style="color: #666666;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[CHECK-IN] Would send to ${to}: "${subject}" (RESEND_API_KEY not set — skipping)`);
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Freedom Agent <agent@updates.trendzo.io>',
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[CHECK-IN] Failed to send to ${to}:`, err);
      return false;
    }

    console.log(`[CHECK-IN] Sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error(`[CHECK-IN] Error sending to ${to}:`, err);
    return false;
  }
}
