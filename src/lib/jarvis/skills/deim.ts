// Import DEIM functions dynamically to avoid edge-case issues
let deimStore: any = null;

async function getDeimStore() {
  if (!deimStore) {
    try {
      deimStore = await import('@/lib/server/deimStore');
    } catch (error) {
      console.error('Failed to import DEIM store:', error);
      throw new Error('DEIM store unavailable');
    }
  }
  return deimStore;
}

export interface DeimIntent {
  type: 'logIdea' | 'researchToday' | 'getIdeaByDate' | 'listRecent';
  text?: string;
  date?: string;
  days?: number;
}

export function parseDeimIntent(text: string): DeimIntent | null {
  const lower = text.toLowerCase().trim();
  console.info('[DEIM Parser] Parsing text:', text)
  
  // Log idea patterns - more robust matching
  const logPatterns = [
    /^jarvis[, ]*(?:today|for today)['']s idea is (.+)$/i,
    /^jarvis[, ]*log (?:an )?idea[: ](.+)$/i,
    /^jarvis[, ]*(?:save|store) (?:today'?s )?idea[: ](.+)$/i,
    /^jarvis[, ]*my idea (?:for )?today is (.+)$/i,
    /^jarvis[, ]*(?:today'?s )?idea is (.+)$/i,
    /^jarvis[, ]*idea[: ](.+)$/i
  ];
  
  for (const pattern of logPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const ideaText = match[1]?.trim();
      if (ideaText) {
        console.info('[DEIM Parser] ✓ Matched logIdea pattern:', pattern.source)
        return { type: 'logIdea', text: ideaText };
      }
    }
  }
  
  // Research patterns - more robust matching
  const researchPatterns = [
    /^jarvis[, ]*research (?:today['']s )?idea$/i,
    /^jarvis[, ]*research (?:my )?(?:latest )?idea$/i,
    /^jarvis[, ]*analyze (?:today'?s )?idea$/i,
    /^jarvis[, ]*research today$/i
  ];
  
  for (const pattern of researchPatterns) {
    if (lower.match(pattern)) {
      console.info('[DEIM Parser] ✓ Matched researchToday pattern:', pattern.source)
      return { type: 'researchToday' };
    }
  }
  
  // Get idea by date patterns - more robust matching
  const datePatterns = [
    /^jarvis[, ]*what was my idea on (\d{4}-\d{2}-\d{2})\??$/i,
    /^jarvis[, ]*(?:show|get) (?:my )?idea (?:for|from) (\d{4}-\d{2}-\d{2})$/i,
    /^jarvis[, ]*recall (?:my )?idea (?:for|from) (\d{4}-\d{2}-\d{2})$/i,
    /^jarvis[, ]*idea (?:for|from|on) (\d{4}-\d{2}-\d{2})$/i
  ];
  
  for (const pattern of datePatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      console.info('[DEIM Parser] ✓ Matched getIdeaByDate pattern:', pattern.source)
      return { type: 'getIdeaByDate', date: match[1] };
    }
  }
  
  // List recent patterns - more robust matching
  const listPatterns = [
    /^jarvis[, ]*show (?:my )?idea log (?:for )?(?:this week|last 7 days)$/i,
    /^jarvis[, ]*(?:list|show) (?:my )?recent ideas$/i,
    /^jarvis[, ]*what ideas have i logged (?:recently|this week)\??$/i,
    /^jarvis[, ]*idea log$/i,
    /^jarvis[, ]*recent ideas$/i
  ];
  
  for (const pattern of listPatterns) {
    if (lower.match(pattern)) {
      console.info('[DEIM Parser] ✓ Matched listRecent pattern:', pattern.source)
      return { type: 'listRecent', days: 7 };
    }
  }
  
  console.info('[DEIM Parser] ✗ No DEIM patterns matched')
  return null;
}

function todayISO(): string {
  const dt = new Date();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${day}`;
}

export async function handleDeimIntent(intent: DeimIntent, context: { fetch: typeof fetch; env: NodeJS.ProcessEnv }): Promise<string> {
  console.info('[DEIM Handler] Processing intent:', intent)
  
  try {
    const store = await getDeimStore();
    
    switch (intent.type) {
      case 'logIdea': {
        console.info('[DEIM Handler] Logging idea...')
        if (!intent.text) {
          console.warn('[DEIM Handler] No idea text provided')
          return "I need the idea text to save it.";
        }
        
        const idea = await store.createIdea(intent.text, intent.date || todayISO());
        const truncatedText = intent.text.length > 80 ? intent.text.substring(0, 80) + '...' : intent.text;
        console.info('[DEIM Handler] ✓ Idea logged successfully')
        return `Noted. Logged today's idea: "${truncatedText}"`;
      }
      
      case 'researchToday': {
        console.info('[DEIM Handler] Researching today\'s idea...')
        const today = todayISO();
        const todayIdeas = await store.listIdeasByDate(today);
        
        if (todayIdeas.length === 0) {
          console.warn('[DEIM Handler] No ideas found for today')
          return "I don't see any ideas logged for today. Please log an idea first.";
        }
        
        const latestIdea = todayIdeas[0]; // Most recent first
        console.info('[DEIM Handler] Found latest idea:', latestIdea.text.slice(0, 50) + '...')
        
        // Check orchestrator flag
        if (context.env.FF_INTEL_ORCHESTRATOR !== "true") {
          console.warn('[DEIM Handler] Orchestrator disabled - FF_INTEL_ORCHESTRATOR not set to true')
          return "The orchestrator is disabled. Flip FF_INTEL_ORCHESTRATOR to true in .env.local and restart.";
        }
        
        // Call orchestrator
        const baseUrl = context.env.NEXT_PUBLIC_BASE_URL || '';
        const orchestratorUrl = baseUrl ? `${baseUrl}/api/intel/orchestrate` : '/api/intel/orchestrate';
        console.info('[DEIM Handler] Calling orchestrator at:', orchestratorUrl)
        
        const response = await context.fetch(orchestratorUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ 
            idea: latestIdea.text, 
            objective: 'propose_changeset' 
          })
        });
        
        if (!response.ok) {
          console.error('[DEIM Handler] Orchestrator call failed:', response.status, response.statusText)
          return `Orchestrator call failed with status ${response.status}. Please check the system.`;
        }
        
        const proposal = await response.json();
        console.info('[DEIM Handler] ✓ Orchestrator response received:', proposal.providers_hit)
        await store.updateIdeaWithProposal(latestIdea.id, proposal);
        
        // Generate summary
        const providers = proposal.providers_hit || [];
        const suggestion = proposal.proposals?.[0]?.payload?.suggestion || 'Analysis completed';
        const summary = suggestion.length > 150 ? suggestion.substring(0, 150) + '...' : suggestion;
        
        return `Research complete. ${summary} Providers: ${providers.join(', ')}.`;
      }
      
      case 'getIdeaByDate': {
        console.info('[DEIM Handler] Getting idea by date:', intent.date)
        if (!intent.date) {
          console.warn('[DEIM Handler] No date provided')
          return "I need a date to look up your idea.";
        }
        
        const ideas = await store.listIdeasByDate(intent.date);
        if (ideas.length === 0) {
          console.info('[DEIM Handler] No ideas found for date:', intent.date)
          return `I don't see any ideas logged for ${intent.date}.`;
        }
        
        const idea = ideas[0]; // Most recent for that date
        console.info('[DEIM Handler] ✓ Found idea for date:', intent.date)
        let response = `On ${intent.date}, your idea was: "${idea.text}"`;
        
        if (idea.status === 'researched' && idea.proposal_json) {
          const suggestion = idea.proposal_json.proposals?.[0]?.payload?.suggestion;
          if (suggestion) {
            const shortSummary = suggestion.length > 100 ? suggestion.substring(0, 100) + '...' : suggestion;
            response += ` Research showed: ${shortSummary}`;
          }
        } else {
          response += " (Not yet researched)";
        }
        
        return response;
      }
      
      case 'listRecent': {
        console.info('[DEIM Handler] Listing recent ideas for', (intent.days || 7), 'days')
        const days = intent.days || 7;
        const results = [];
        
        // Get ideas for the last N days
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().slice(0, 10);
          
          const ideas = await store.listIdeasByDate(dateStr);
          if (ideas.length > 0) {
            const idea = ideas[0]; // Most recent for that day
            const truncated = idea.text.length > 100 ? idea.text.substring(0, 100) + '...' : idea.text;
            const status = idea.status === 'researched' ? '[researched]' : '[logged]';
            results.push(`${dateStr}: ${truncated} ${status}`);
          }
        }
        
        if (results.length === 0) {
          console.info('[DEIM Handler] No recent ideas found')
          return `No ideas logged in the last ${days} days.`;
        }
        
        console.info('[DEIM Handler] ✓ Found', results.length, 'recent ideas')
        return `Recent ideas:\n${results.join('\n')}`;
      }
      
      default:
        return "I didn't understand that DEIM command.";
    }
  } catch (error) {
    console.error('DEIM skill error:', error);
    return `Error processing DEIM command: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
