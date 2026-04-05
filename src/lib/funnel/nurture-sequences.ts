// ═══════════════════════════════════════════════════════════════
// Nurture Email Sequences — Single source of truth
// Copy content into Beehiiv automation builder.
// See docs/beehiiv-nurture-setup.md for setup instructions.
// ═══════════════════════════════════════════════════════════════

export interface NurtureEmail {
  segment: string;
  emailNumber: number;
  delayDays: number;
  subject: string;
  previewText: string;
  body: string;
}

// ═══════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════

const WRAPPER_OPEN = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#08080d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 20px;">
<tr><td>`;

const WRAPPER_CLOSE = `</td></tr></table></body></html>`;

function p(text: string): string {
  return `<p style="color:#d0d0d0;font-size:16px;line-height:1.7;margin:0 0 18px 0;">${text}</p>`;
}

function heading(text: string): string {
  return `<p style="color:#ffffff;font-size:20px;font-weight:600;line-height:1.4;margin:0 0 20px 0;">${text}</p>`;
}

function cta(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
<tr><td style="background-color:#e63946;border-radius:8px;padding:14px 28px;">
<a href="${url}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:500;">${label}</a>
</td></tr></table>`;
}

function sig(): string {
  return `<p style="color:#888;font-size:14px;margin:24px 0 0 0;">— The Trendzo team</p>`;
}

function footer(email: string): string {
  return `<p style="color:#555;font-size:11px;margin:32px 0 0 0;line-height:1.5;">
You're receiving this because you signed up at Trendzo.
<a href="{{unsubscribe_url}}" style="color:#555;">Unsubscribe</a></p>`;
}

function email(parts: string[]): string {
  return WRAPPER_OPEN + parts.join('') + WRAPPER_CLOSE;
}

// ═══════════════════════════════════════════════════════════════
// SEGMENT A — Agency Operator
// ═══════════════════════════════════════════════════════════════

const SEGMENT_A: NurtureEmail[] = [
  {
    segment: 'agency-operator',
    emailNumber: 1,
    delayDays: 1,
    subject: "The agency model nobody's talking about",
    previewText: "Most TikTok agencies are doing it backwards",
    body: email([
      heading("Most agencies are selling the wrong thing."),
      p("They sell content creation. Editing, posting, scheduling. It's a race to the bottom — every freelancer on Fiverr can do it cheaper."),
      p("The agencies winning right now aren't the ones with the best editors. They're the ones who know <strong style='color:#fff'>what to post before they make it.</strong>"),
      p("Think about it: what if you could score 10 content ideas and only produce the top 3? Same team. 3x the output quality. Clients see better results. You charge more."),
      p("That's the shift — from content production to <strong style='color:#fff'>content intelligence.</strong>"),
      p("Predicting virality used to be gut instinct. It's not anymore."),
      p("Tomorrow I'll show you what the top 1% of agencies are doing differently."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'agency-operator',
    emailNumber: 2,
    delayDays: 3,
    subject: "How one agency went from guessing to knowing",
    previewText: "They stopped asking 'what should we post?'",
    body: email([
      heading("An agency managing 12 creators had a problem."),
      p("Their team was spending 40 hours a week on content planning. Brainstorming ideas, debating what to post, producing content that flopped. Every missed video was money and time burned."),
      p("Then they changed one thing: they started <strong style='color:#fff'>scoring content ideas before production.</strong>"),
      p("Each idea got rated on 8 signals — hook strength, emotional arc, niche timing, cultural relevance, format fit, creator-audience alignment, competitive gap, and trend velocity."),
      p("The result? Their hit rate went from 1 in 8 to 3 in 8. Same team. Same budget. The only difference was they stopped guessing which ideas to produce."),
      p("The key insight: <strong style='color:#fff'>prediction before production.</strong> Score first, shoot second."),
      p("On Thursday I'll break down the scoring system behind those 8 signals."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'agency-operator',
    emailNumber: 3,
    delayDays: 5,
    subject: "The scoring system behind viral predictions",
    previewText: "8 signals. One score. Before you press record.",
    body: email([
      heading("What if you could see the future of a TikTok — before you made it?"),
      p("Not perfectly. But directionally. Enough to stop wasting time on content that was never going to work."),
      p("The system is called a <strong style='color:#fff'>Viral Potential Score (VPS).</strong> Here's the concept:"),
      p("Eight signals that correlate with TikTok virality, analyzed <em>before</em> content is created:"),
      p("&bull; <strong style='color:#fff'>Hook strength</strong> — Does the first 2 seconds command attention?<br>"
        + "&bull; <strong style='color:#fff'>Emotional arc</strong> — Does it build tension and resolve?<br>"
        + "&bull; <strong style='color:#fff'>Niche timing</strong> — Is this topic trending in this niche right now?<br>"
        + "&bull; <strong style='color:#fff'>Cultural alignment</strong> — Does it tap into what audiences care about today?<br>"
        + "&bull; <strong style='color:#fff'>Creator-audience fit</strong> — Is this the right creator for this content?<br>"
        + "&bull; <strong style='color:#fff'>Format fit</strong> — Does the format match what the algorithm rewards?<br>"
        + "&bull; <strong style='color:#fff'>Competitive gap</strong> — Is anyone else doing this well already?<br>"
        + "&bull; <strong style='color:#fff'>Trend velocity</strong> — Is this wave rising or falling?"),
      p("This isn't guesswork. It's pattern recognition across thousands of videos, distilled into one score."),
      p("Imagine knowing which of your 5 content ideas has the highest chance of breaking through. <strong style='color:#fff'>That's what your competitors will have access to soon.</strong>"),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'agency-operator',
    emailNumber: 4,
    delayDays: 8,
    subject: "Your agency dashboard is waiting",
    previewText: "We built something for operators like you",
    body: email([
      heading("Everything I've been describing? We built it."),
      p("It's called <strong style='color:#fff'>Trendzo</strong> — an AI-powered agency operating system."),
      p("&bull; <strong style='color:#fff'>Viral Prediction Scoring</strong> — Score content ideas before production using the VPS system<br>"
        + "&bull; <strong style='color:#fff'>AI Content Briefs</strong> — Generate detailed briefs your editors can execute immediately<br>"
        + "&bull; <strong style='color:#fff'>Creator Portfolio Management</strong> — Track performance across all your creators in one dashboard<br>"
        + "&bull; <strong style='color:#fff'>AI Business Advisor</strong> — An agent that knows your clients, your niche, and your numbers"),
      p("This isn't another analytics tool. It's a <strong style='color:#fff'>competitive moat.</strong> The agencies that adopt AI content intelligence first will compound their advantage every month."),
      p("Agency operators on our early access list will lock in founding pricing — before we open to the public."),
      cta('{{value_hub_url}}', 'Get founding access'),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'agency-operator',
    emailNumber: 5,
    delayDays: 12,
    subject: "Last call for founding access",
    previewText: "Doors close Friday",
    body: email([
      heading("Quick recap of the last 12 days:"),
      p("&bull; You learned why the smartest agencies sell content intelligence, not content production<br>"
        + "&bull; You saw how prediction-before-production changes hit rates from 1/8 to 3/8<br>"
        + "&bull; You understand the 8-signal VPS scoring system<br>"
        + "&bull; You know Trendzo exists and what it does"),
      p("Here's what matters now: <strong style='color:#fff'>the agencies that move first will have 6 months of compounding data advantage</strong> over everyone else. Every prediction improves the system. Every content brief gets smarter. First movers win."),
      p("Founding access locks in early pricing and puts you ahead of the curve."),
      cta('{{value_hub_url}}', 'Lock in founding access'),
      p("If now isn't the right time, no pressure. Your AI advisor is always here whenever you're ready:"),
      p("<a href='{{freedom_agent_url}}' style='color:#7c3aed;'>Continue with your AI advisor →</a>"),
      sig(),
      footer(''),
    ]),
  },
];

// ═══════════════════════════════════════════════════════════════
// SEGMENT B — Business Builder
// ═══════════════════════════════════════════════════════════════

const SEGMENT_B: NurtureEmail[] = [
  {
    segment: 'business-builder',
    emailNumber: 1,
    delayDays: 1,
    subject: "The fastest path to your first $1,000 online",
    previewText: "It's simpler than you think",
    body: email([
      heading("Everyone overcomplicates the first $1,000."),
      p("They build a course before they have students. They design a logo before they have customers. They spend weeks on a website that nobody visits."),
      p("Here's what actually works: <strong style='color:#fff'>pick one offer, one audience, one channel.</strong>"),
      p("Service-based businesses hit revenue fastest. Coaching, consulting, freelancing — you trade time for money at first, but you learn what people actually pay for."),
      p("Your Freedom OS plan already has the ingredients. The business model, the niche, the hours you have. Now it's about execution."),
      p("The people who hit $1,000 fastest all do the same thing: they start before they feel ready, and they talk to potential customers in the first week."),
      p("Tomorrow: why most businesses die in month 2, and how to make sure yours doesn't."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'business-builder',
    emailNumber: 2,
    delayDays: 3,
    subject: "Why most online businesses fail in month 2",
    previewText: "The consistency gap is real",
    body: email([
      heading("Month 1 is easy. You're excited. Everything is new."),
      p("Month 2 is where it gets real."),
      p("You've posted content that got 47 views. You pitched 5 clients and heard nothing. Your friends don't understand what you're building. The excitement fades and the self-doubt moves in."),
      p("This is the <strong style='color:#fff'>consistency gap</strong> — and it kills more businesses than bad ideas ever will."),
      p("The winners aren't more talented. They have better systems:"),
      p("&bull; A content calendar they follow regardless of results<br>"
        + "&bull; A weekly outreach routine that runs on autopilot<br>"
        + "&bull; A way to measure progress that isn't just revenue<br>"
        + "&bull; An accountability system that keeps them honest"),
      p("AI is becoming part of that system. Tools that tell you what to post, when to post it, and how likely it is to work — so you stop guessing and start compounding."),
      p("More on that Thursday. For now: build the system. The results follow the consistency."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'business-builder',
    emailNumber: 3,
    delayDays: 5,
    subject: "The content strategy that doesn't require going viral",
    previewText: "You don't need millions of views",
    body: email([
      heading("Forget going viral."),
      p("You don't need millions of views. You need the <strong style='color:#fff'>right 500 people</strong> seeing your content."),
      p("A fitness coach doesn't need 1M followers. They need 500 people who want to get in shape and are willing to pay for help. A consultant doesn't need viral clips. They need 200 decision-makers to see their expertise."),
      p("Targeted content beats viral content for businesses. Every time."),
      p("The question is: how do you know which content reaches your target audience?"),
      p("Pattern recognition. Looking at what works in your specific niche, not what works in general. Analyzing hooks, topics, and formats that attract buyers — not just viewers."),
      p("There are tools now that can do this analysis for you — predict which of your content ideas is most likely to reach the right people before you even create it."),
      p("Next week I'll introduce you to one of them. For now: create content for the 500, not the 1 million."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'business-builder',
    emailNumber: 4,
    delayDays: 8,
    subject: "Meet your AI business advisor",
    previewText: "The system behind the advice",
    body: email([
      heading("Remember the AI advisor from Freedom OS?"),
      p("That's not just a chatbot. It's part of something bigger."),
      p("It's powered by <strong style='color:#fff'>Trendzo</strong> — a platform that helps businesses use AI for content strategy, viral prediction, and growth."),
      p("Here's what Trendzo gives you:"),
      p("&bull; <strong style='color:#fff'>Content scoring</strong> — Know which ideas will perform before you create them<br>"
        + "&bull; <strong style='color:#fff'>AI content briefs</strong> — Get detailed execution plans for your best content ideas<br>"
        + "&bull; <strong style='color:#fff'>Niche intelligence</strong> — See what's actually working in your specific market<br>"
        + "&bull; <strong style='color:#fff'>Your AI advisor</strong> — Ongoing personalized guidance based on your plan and progress"),
      p("Your Freedom OS plan was the starting point. Trendzo is the execution engine."),
      cta('{{value_hub_url}}', 'Explore the Value Hub'),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'business-builder',
    emailNumber: 5,
    delayDays: 12,
    subject: "Your 90-day plan just got an upgrade",
    previewText: "From plan to execution engine",
    body: email([
      heading("You started with a plan. Now it's time for a system."),
      p("Your Freedom OS plan gave you the blueprint — the business model, the niche, the numbers. That was step one."),
      p("Step two is having the tools to execute consistently, even when motivation dips."),
      p("<strong style='color:#fff'>Trendzo</strong> turns your plan into a system: AI-scored content ideas, niche-specific intelligence, and an advisor that remembers your goals and holds you accountable."),
      p("Founding members lock in early pricing before we open to the public."),
      cta('{{value_hub_url}}', 'Get founding access'),
      p("Not ready yet? No pressure. Your AI advisor is always here:"),
      p("<a href='{{freedom_agent_url}}' style='color:#7c3aed;'>Continue with your advisor →</a>"),
      sig(),
      footer(''),
    ]),
  },
];

// ═══════════════════════════════════════════════════════════════
// SEGMENT C — Side Hustle Seeker
// ═══════════════════════════════════════════════════════════════

const SEGMENT_C: NurtureEmail[] = [
  {
    segment: 'side-hustle-seeker',
    emailNumber: 1,
    delayDays: 1,
    subject: "You don't need to quit your job to start",
    previewText: "10 hours a week is plenty",
    body: email([
      heading("10 hours a week is enough to change your life."),
      p("Not overnight. Not next month. But within 90 days, 10 focused hours per week can build something real."),
      p("The key is <strong style='color:#fff'>leverage</strong> — content that works while you sleep. One good post can generate leads for weeks. One viral video can bring in more clients than a month of cold outreach."),
      p("You don't need to quit your job. You don't need a big investment. You need a plan and the discipline to execute it 10 hours at a time."),
      p("Your Freedom OS plan is that starting point. Follow it. The first milestone isn't $10,000 — it's $1. Then $100. Then $1,000. Each one proves the model works."),
      p("I'll be back in a few days with the 3 side hustles that are actually working in 2026."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'side-hustle-seeker',
    emailNumber: 2,
    delayDays: 4,
    subject: "The 3 side hustles that actually work in 2026",
    previewText: "Forget the hype. Here's what's real.",
    body: email([
      heading("Three paths. All proven. Pick the one that fits."),
      p("<strong style='color:#fff'>1. Service-based (fastest to revenue)</strong><br>"
        + "Freelancing, coaching, consulting. You trade skill for money. Time-to-first-dollar: 2-4 weeks. Best if you have a specific skill and limited hours."),
      p("<strong style='color:#fff'>2. Content-based (biggest long-term asset)</strong><br>"
        + "Build an audience, monetize through sponsors, affiliates, or products. Time-to-first-dollar: 2-3 months. Best if you enjoy creating and can be consistent."),
      p("<strong style='color:#fff'>3. Product-based (highest ceiling)</strong><br>"
        + "Digital products, templates, courses. Time-to-first-dollar: 1-3 months. Best if you have expertise people will pay to learn."),
      p("Most people should start with #1 (services) while building toward #2 (content). Services fund the content habit."),
      p("Your Freedom OS plan already pointed you toward the best fit. Trust the math — it's based on your actual hours and goals."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'side-hustle-seeker',
    emailNumber: 3,
    delayDays: 7,
    subject: "How to know what content to post (without guessing)",
    previewText: "What if you could test ideas before creating them?",
    body: email([
      heading("The hardest part of content isn't creating it. It's knowing what to create."),
      p("You have limited hours. Every piece of content you make that flops is time you can't get back."),
      p("So what if you could <strong style='color:#fff'>test your content ideas before spending time making them?</strong>"),
      p("That's not a hypothetical anymore. AI tools can now analyze your content concept — the hook, the topic, the format, the timing — and predict how likely it is to perform well in your specific niche."),
      p("It's like having a focus group of 10,000 people, but instant and free."),
      p("For someone with 10 hours a week, this is the difference between spending 5 hours on a video that gets 50 views and spending 5 hours on a video that gets 5,000."),
      p("More on this soon. For now: don't create content randomly. Have a reason for every post."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'side-hustle-seeker',
    emailNumber: 4,
    delayDays: 11,
    subject: "A free tool that plans your business for you",
    previewText: "AI-powered and completely free",
    body: email([
      heading("Have you tried your AI business advisor yet?"),
      p("When you created your Freedom OS plan, you unlocked access to something most people don't know about: a personal AI business advisor called the <strong style='color:#fff'>Freedom Agent.</strong>"),
      p("It remembers your plan, your niche, and your goals. It gives you specific next steps — not generic advice. And it's completely free."),
      p("The Freedom Agent is powered by <strong style='color:#fff'>Trendzo</strong>, an AI platform we're building for creators and entrepreneurs. The advisor is just one piece — there's also content scoring, niche intelligence, and more coming soon."),
      p("But right now, the advisor is the most useful thing for where you are. Give it 5 minutes."),
      cta('{{freedom_agent_url}}', 'Chat with your advisor'),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'side-hustle-seeker',
    emailNumber: 5,
    delayDays: 15,
    subject: "Ready for the next step?",
    previewText: "No pressure — just options",
    body: email([
      heading("You've been thinking about this for two weeks now."),
      p("Maybe you've taken action. Maybe you're still planning. Either way, you're further than most people who just scroll past and forget."),
      p("Here's what's available to you — all free:"),
      p("&bull; <strong style='color:#fff'>Freedom OS</strong> — Your personalized business plan (revisit anytime)<br>"
        + "&bull; <strong style='color:#fff'>Freedom Agent</strong> — Your AI business advisor (5 messages/day, ongoing)<br>"
        + "&bull; <strong style='color:#fff'>Value Hub</strong> — Free tools for content scoring and niche research"),
      p("When you're ready to get serious about scaling, <strong style='color:#fff'>Trendzo</strong> is here. AI-powered content intelligence, prediction scoring, and a system that helps you work smarter with the hours you have."),
      p("No rush. The door's always open."),
      cta('{{freedom_agent_url}}', 'Continue with your advisor'),
      sig(),
      footer(''),
    ]),
  },
];

// ═══════════════════════════════════════════════════════════════
// SEGMENT D — Curious Browser
// ═══════════════════════════════════════════════════════════════

const SEGMENT_D: NurtureEmail[] = [
  {
    segment: 'curious-browser',
    emailNumber: 1,
    delayDays: 2,
    subject: "Welcome — here's what we're about",
    previewText: "AI-powered content intelligence for everyone",
    body: email([
      heading("Thanks for checking us out."),
      p("We're building <strong style='color:#fff'>AI-powered content intelligence tools</strong> — things that help creators and businesses make better content decisions."),
      p("Our belief is simple: the tools that top agencies pay thousands for should be accessible to everyone. Understanding what makes content perform well shouldn't require a data science degree or a big budget."),
      p("Over the next few weeks, we'll share some of what we've learned — insights from analyzing thousands of videos, patterns that predict performance, and free tools you can use right now."),
      p("No spam. Just useful stuff. If it's not for you, unsubscribe anytime."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'curious-browser',
    emailNumber: 2,
    delayDays: 6,
    subject: "3 things we learned analyzing 10,000 TikTok videos",
    previewText: "Data-backed insights, not opinions",
    body: email([
      heading("We analyzed 10,000 TikTok videos. Here's what surprised us."),
      p("<strong style='color:#fff'>1. The first frame matters more than the first second.</strong><br>"
        + "Before anyone hears your hook, they see the thumbnail in their feed. Visually cluttered or generic first frames get scrolled past before the audio even loads."),
      p("<strong style='color:#fff'>2. Save rate predicts virality better than likes.</strong><br>"
        + "Likes are impulse. Saves are intent. A video with a 3% save rate will almost always outperform one with 5x the likes but a low save rate."),
      p("<strong style='color:#fff'>3. Niche timing trumps content quality.</strong><br>"
        + "A mediocre video on a rising topic outperforms a polished video on a declining one. The algorithm rewards relevance more than production value."),
      p("These patterns are consistent across niches. They're not opinions — they're signals."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'curious-browser',
    emailNumber: 3,
    delayDays: 11,
    subject: "The creator economy is changing — here's how",
    previewText: "AI is reshaping how content gets made",
    body: email([
      heading("The biggest shift in content creation since the algorithm."),
      p("For 10 years, creators made content and hoped it worked. The feedback loop was slow — post, wait, check analytics, adjust, repeat."),
      p("That loop is collapsing. AI is making it possible to <strong style='color:#fff'>predict performance before you create</strong> — not perfectly, but directionally enough to change the game."),
      p("Agencies are already using AI scoring to decide what to produce. Brands are using it to evaluate creator partnerships. Individual creators are using it to stop wasting time on content that won't land."),
      p("This isn't coming. It's here. And the creators who adopt it early will have a compounding advantage over those who don't."),
      p("We're building tools for exactly this shift. More soon."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'curious-browser',
    emailNumber: 4,
    delayDays: 18,
    subject: "Your free AI business advisor",
    previewText: "No signup needed. Just your email.",
    body: email([
      heading("We made something you might find useful."),
      p("It's called the <strong style='color:#fff'>Freedom Agent</strong> — a personal AI business advisor that helps you figure out your next step, whether you're starting a side hustle, building a business, or just exploring your options."),
      p("It's powered by <strong style='color:#fff'>Trendzo</strong>, the AI platform we're building. But the advisor is completely free — no signup, no credit card, no catch."),
      p("Tell it what you're interested in, and it'll give you specific, actionable guidance. It remembers your conversation and builds on it over time."),
      p("Worth 5 minutes if you're curious."),
      cta('{{freedom_agent_entry_url}}', 'Try the Freedom Agent'),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'curious-browser',
    emailNumber: 5,
    delayDays: 25,
    subject: "Still curious?",
    previewText: "Here's everything that's free",
    body: email([
      heading("Quick update from us."),
      p("If you're still exploring, here's everything available to you right now — all free:"),
      p("&bull; <strong style='color:#fff'>Freedom OS</strong> — A personalized business plan generator. Answer a few questions, get a full launch plan.<br>"
        + "&bull; <strong style='color:#fff'>Freedom Agent</strong> — An AI business advisor that gives specific guidance based on your goals.<br>"
        + "&bull; <strong style='color:#fff'>Value Hub</strong> — Free tools for content scoring and niche research."),
      p("And coming soon: <strong style='color:#fff'>Trendzo</strong> — the full AI platform for content prediction, creator management, and business growth. Early access is open."),
      p("No pressure. We're here when you're ready."),
      cta('{{value_hub_url}}', 'Explore free tools'),
      sig(),
      footer(''),
    ]),
  },
];

// ═══════════════════════════════════════════════════════════════
// WAITLIST — High Intent
// ═══════════════════════════════════════════════════════════════

const WAITLIST: NurtureEmail[] = [
  {
    segment: 'waitlist',
    emailNumber: 1,
    delayDays: 0,
    subject: "You're on the list — here's your position",
    previewText: "Welcome to Trendzo early access",
    body: email([
      heading("You're in. Welcome to Trendzo early access."),
      p("You just secured your spot on the founding access list. Here's what you'll get when we launch:"),
      p("&bull; <strong style='color:#fff'>Viral Potential Scoring (VPS)</strong> — Score content ideas before you create them<br>"
        + "&bull; <strong style='color:#fff'>AI Content Briefs</strong> — Detailed execution plans generated from your top-scoring ideas<br>"
        + "&bull; <strong style='color:#fff'>Agency Dashboard</strong> — Manage multiple creators, track performance, run predictions<br>"
        + "&bull; <strong style='color:#fff'>AI Business Advisor</strong> — Personalized guidance that knows your niche, your numbers, and your goals<br>"
        + "&bull; <strong style='color:#fff'>Founding pricing</strong> — Locked in before public launch"),
      p("We're in the final build phase. Expect updates over the next few weeks."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'waitlist',
    emailNumber: 2,
    delayDays: 3,
    subject: "What Trendzo actually does",
    previewText: "No fluff. Just what it does.",
    body: email([
      heading("Here's exactly what Trendzo does."),
      p("<strong style='color:#fff'>1. Predicts viral potential before you create</strong><br>"
        + "Enter a content concept. Trendzo analyzes 8 signals (hook, emotion, timing, niche fit, format, competition, trend, and audience alignment) and returns a Viral Potential Score. Higher score = higher chance of performing well."),
      p("<strong style='color:#fff'>2. Generates AI content briefs</strong><br>"
        + "Your highest-scoring ideas get turned into detailed briefs: suggested hooks, talking points, visual direction, and posting timing. Hand it to an editor or use it yourself."),
      p("<strong style='color:#fff'>3. Agency-grade creator management</strong><br>"
        + "Track multiple creators in one dashboard. See who's performing, what's working, and where to focus your energy."),
      p("<strong style='color:#fff'>4. AI business advisor</strong><br>"
        + "A personalized agent that knows your business, your niche, and your goals. It evolves with you over time."),
      p("That's it. No fluff. We'll keep you updated as we ship."),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'waitlist',
    emailNumber: 3,
    delayDays: 7,
    subject: "While you wait — your free AI advisor",
    previewText: "Start getting value right now",
    body: email([
      heading("You don't have to wait to start getting value."),
      p("While we finish building the full platform, you have access to two free tools right now:"),
      p("<strong style='color:#fff'>Freedom OS</strong> — A personalized business plan generator. Answer a few questions about your goals, and it builds a step-by-step launch plan."),
      p("<strong style='color:#fff'>Freedom Agent</strong> — Your AI business advisor. It uses the same AI that powers Trendzo to give you personalized guidance, 5 messages per day, completely free."),
      p("Both are live and ready. The advisor in particular is worth trying — it remembers your goals and builds on your progress over time."),
      cta('{{freedom_agent_entry_url}}', 'Try the Freedom Agent'),
      p("Or generate your plan: <a href='{{freedom_os_url}}' style='color:#7c3aed;'>Start Freedom OS →</a>"),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'waitlist',
    emailNumber: 4,
    delayDays: 14,
    subject: "Launch update",
    previewText: "Here's where we are",
    body: email([
      heading("Quick build update."),
      p("Transparency builds trust, so here's where we actually are:"),
      p("&bull; <strong style='color:#2dd4a8'>✓ Live</strong> — Freedom OS (business plan generator)<br>"
        + "&bull; <strong style='color:#2dd4a8'>✓ Live</strong> — Freedom Agent (AI business advisor)<br>"
        + "&bull; <strong style='color:#2dd4a8'>✓ Live</strong> — Value Hub (free tools)<br>"
        + "&bull; <strong style='color:#f59e0b'>◐ Building</strong> — VPS scoring engine<br>"
        + "&bull; <strong style='color:#f59e0b'>◐ Building</strong> — AI content brief generator<br>"
        + "&bull; <strong style='color:#a0a0a0'>○ Planned</strong> — Agency dashboard<br>"
        + "&bull; <strong style='color:#a0a0a0'>○ Planned</strong> — Creator portfolio management"),
      p("We're shipping fast. You'll be among the first to get access."),
      p("In the meantime, your AI advisor is learning more about your niche every day. Give it a question:"),
      cta('{{freedom_agent_url}}', 'Ask your advisor'),
      sig(),
      footer(''),
    ]),
  },
  {
    segment: 'waitlist',
    emailNumber: 5,
    delayDays: 21,
    subject: "Your founding access is almost ready",
    previewText: "Early adopters get first access + founding pricing",
    body: email([
      heading("We're almost ready. Here's what founding members get."),
      p("<strong style='color:#fff'>Founding access includes:</strong>"),
      p("&bull; First access to VPS scoring and AI content briefs<br>"
        + "&bull; Founding pricing locked in for life (before public pricing)<br>"
        + "&bull; Direct access to the founding community<br>"
        + "&bull; Input on the product roadmap — we'll build what you need<br>"
        + "&bull; All free tools remain free forever"),
      p("You signed up because you see where this is going. AI content intelligence is the next competitive edge — and you'll have it before most people even hear about it."),
      p("We'll send your access link as soon as the doors open. Keep an eye on your inbox."),
      p("Questions? Reply to this email or ask your AI advisor:"),
      cta('{{freedom_agent_url}}', 'Chat with your advisor'),
      sig(),
      footer(''),
    ]),
  },
];

// ═══════════════════════════════════════════════════════════════
// COMBINED EXPORT
// ═══════════════════════════════════════════════════════════════

export const NURTURE_SEQUENCES: NurtureEmail[] = [
  ...SEGMENT_A,
  ...SEGMENT_B,
  ...SEGMENT_C,
  ...SEGMENT_D,
  ...WAITLIST,
];
