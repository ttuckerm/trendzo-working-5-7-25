// ═══════════════════════════════════════════════════════════════
// Freedom Agent — Progress state tracking
// ═══════════════════════════════════════════════════════════════

export interface ProgressState {
  // What they've told us they've done
  hasChosenNiche?: boolean;
  hasStartedCreating?: boolean;
  hasPostedContent?: boolean;
  hasGottenFirstFollowers?: boolean;
  hasEarnedFirstRevenue?: boolean;
  hasMentionedStruggles?: boolean;
  hasMentionedSuccess?: boolean;

  // Engagement signals
  totalMessages?: number;
  sessionsWithMessages?: number; // how many different days they've chatted
  lastTopics?: string[]; // last 3 topics discussed (for continuity)

  // Sentiment
  currentMorale?: 'high' | 'medium' | 'low'; // based on recent messages
}

export function updateProgress(
  currentState: ProgressState,
  userMessage: string,
  _assistantMessage: string
): ProgressState {
  const msg = userMessage.toLowerCase();
  const updated = { ...currentState };

  // Increment message count
  updated.totalMessages = (updated.totalMessages || 0) + 1;

  // Detect milestones from user messages
  if (matchesAny(msg, ['picked a niche', 'decided on', 'going with', 'chose', 'my niche is', 'focusing on', 'decided to focus'])) {
    updated.hasChosenNiche = true;
  }
  if (matchesAny(msg, ['started creating', 'made my first', 'recorded', 'filmed', 'wrote my first', 'designed'])) {
    updated.hasStartedCreating = true;
  }
  if (matchesAny(msg, ['posted', 'published', 'went live', 'uploaded', 'shared it'])) {
    updated.hasPostedContent = true;
  }
  if (matchesAny(msg, ['got followers', 'gained followers', 'people followed', 'subscriber'])) {
    updated.hasGottenFirstFollowers = true;
  }
  if (matchesAny(msg, ['first sale', 'got paid', 'made money', 'earned', 'revenue', 'first client', 'first customer'])) {
    updated.hasEarnedFirstRevenue = true;
  }
  if (matchesAny(msg, ['struggling', 'stuck', 'frustrated', 'not working', 'no results', 'giving up', 'discouraged', 'lost'])) {
    updated.hasMentionedStruggles = true;
    updated.currentMorale = 'low';
  }
  if (matchesAny(msg, ['working', 'excited', 'progress', 'growing', 'went viral', 'amazing', 'breakthrough'])) {
    updated.hasMentionedSuccess = true;
    updated.currentMorale = 'high';
  }

  // Track last 3 topics (simple: use first 50 chars of user message)
  const topic = userMessage.slice(0, 50).trim();
  updated.lastTopics = [...(updated.lastTopics || []).slice(-2), topic];

  return updated;
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

export function buildProgressContext(progress: ProgressState): string {
  if (!progress || !progress.totalMessages) {
    return '\n## User progress\nThis is a new user. Start by understanding their situation and goals.\n';
  }

  const milestones: string[] = [];
  if (progress.hasChosenNiche) milestones.push('chosen their niche');
  if (progress.hasStartedCreating) milestones.push('started creating content');
  if (progress.hasPostedContent) milestones.push('posted content publicly');
  if (progress.hasGottenFirstFollowers) milestones.push('gained their first followers');
  if (progress.hasEarnedFirstRevenue) milestones.push('earned first revenue');

  let context = '\n## User progress\n';
  context += `They have sent ${progress.totalMessages} messages so far.\n`;

  if (milestones.length > 0) {
    context += `Milestones reached: ${milestones.join(', ')}.\n`;
    context += 'Acknowledge their progress naturally. Build on what they\'ve accomplished.\n';
  } else {
    context += 'They haven\'t reported any concrete milestones yet. Focus on getting them to take their first action.\n';
  }

  if (progress.currentMorale === 'low') {
    context += 'They seem discouraged recently. Be extra encouraging, validate that the struggle is normal, and suggest one small concrete next step.\n';
  } else if (progress.currentMorale === 'high') {
    context += 'They seem energized. Channel that momentum into the next milestone.\n';
  }

  if (progress.lastTopics && progress.lastTopics.length > 0) {
    context += `Recent topics they brought up: ${progress.lastTopics.join(' | ')}\n`;
    context += 'Reference these naturally if relevant — it shows you remember.\n';
  }

  return context;
}
