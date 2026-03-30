export interface ProductMetrics {
  id: string;
  name: string;
  conversion_rate: number;
  margin_rate: number;
  weekly_traffic: number;
  trend_velocity: number;
}

export interface RecipeInput {
  targetBuyer?: string;
  pricePoint?: string;
  creatorStyle?: string;
}

export interface LiveRecipe {
  hookOptions: string[];
  runOfShow: { minute: number; segment: string; notes: string }[];
  objections: { objection: string; reframe: string }[];
  offerStack: { tier: string; description: string; anchor: string }[];
  ctaMoments: { timestamp: string; trigger: string; script: string }[];
  pivotTriggers: { signal: string; action: string }[];
  meta: {
    generatedFor: string;
    targetBuyer: string;
    pricePoint: string;
    creatorStyle: string;
    metricsSnapshot: {
      conversion_rate: number;
      margin_rate: number;
      weekly_traffic: number;
      trend_velocity: number;
    };
  };
}

function tier(val: number, low: number, high: number): "low" | "mid" | "high" {
  if (val >= high) return "high";
  if (val >= low) return "mid";
  return "low";
}

export function generateLiveRecipe(
  product: ProductMetrics,
  input: RecipeInput,
): LiveRecipe {
  const buyer = input.targetBuyer || "impulse buyer, 18-34, scrolling at night";
  const price = input.pricePoint || "under $50";
  const style = input.creatorStyle || "authentic, direct-to-camera";

  const trendTier = tier(product.trend_velocity, 0.3, 0.6);
  const crTier = tier(product.conversion_rate, 0.02, 0.04);
  const marginTier = tier(product.margin_rate, 0.25, 0.4);
  const trafficTier = tier(product.weekly_traffic, 3000, 8000);

  const hookOptions = buildHooks(product, trendTier, buyer);
  const runOfShow = buildRunOfShow(product, style, trendTier);
  const objections = buildObjections(product, price, crTier, marginTier);
  const offerStack = buildOfferStack(product, price, marginTier);
  const ctaMoments = buildCtaMoments(trendTier, trafficTier);
  const pivotTriggers = buildPivotTriggers(trendTier, crTier);

  return {
    hookOptions,
    runOfShow,
    objections,
    offerStack,
    ctaMoments,
    pivotTriggers,
    meta: {
      generatedFor: product.name,
      targetBuyer: buyer,
      pricePoint: price,
      creatorStyle: style,
      metricsSnapshot: {
        conversion_rate: product.conversion_rate,
        margin_rate: product.margin_rate,
        weekly_traffic: product.weekly_traffic,
        trend_velocity: product.trend_velocity,
      },
    },
  };
}

function buildHooks(
  p: ProductMetrics,
  trendTier: string,
  buyer: string,
): string[] {
  const hooks: string[] = [];

  if (trendTier === "high") {
    hooks.push(
      `"Everyone's been asking about ${p.name} — here's why it's blowing up right now"`,
    );
    hooks.push(
      `"This ${p.name} went viral for a reason. Let me show you in 30 seconds."`,
    );
  } else {
    hooks.push(
      `"I found something that ${buyer.split(",")[0]} actually needs — ${p.name}"`,
    );
    hooks.push(
      `"Stop scrolling. This ${p.name} changes the game and nobody's talking about it."`,
    );
  }

  hooks.push(
    `"I tested ${p.name} for a week. Here's my honest take."`,
  );
  hooks.push(
    `"POV: you just discovered ${p.name} and your life gets 10x easier"`,
  );
  hooks.push(
    `"3 reasons ${p.name} is worth every penny (and one reason it's not)"`,
  );

  return hooks.slice(0, 5);
}

function buildRunOfShow(
  p: ProductMetrics,
  style: string,
  trendTier: string,
): LiveRecipe["runOfShow"] {
  const segments: LiveRecipe["runOfShow"] = [
    {
      minute: 0,
      segment: "Hook + Pattern Interrupt",
      notes: `Open with chosen hook. ${style} energy. Hold product or show it on screen within first 2 seconds.`,
    },
    {
      minute: 1,
      segment: "Problem Agitation",
      notes: `Paint the pain point ${p.name} solves. Use "you know that feeling when…" framing. ${trendTier === "high" ? "Lean into the trend — mention that others are already switching." : "Build relatability with the niche audience."}`,
    },
    {
      minute: 2,
      segment: "Product Reveal + Demo",
      notes: `Show ${p.name} in use. Highlight the top feature. Keep it visual — zoom in, show texture/quality. CR is ${(p.conversion_rate * 100).toFixed(1)}%, so ${p.conversion_rate >= 0.03 ? "the product sells itself on demo" : "over-invest in the demo to overcome hesitation"}.`,
    },
    {
      minute: 3,
      segment: "Social Proof + Objection Handling",
      notes: `Address the #1 objection (see objections list). Drop a stat or testimonial. Margin is ${(p.margin_rate * 100).toFixed(0)}% — ${p.margin_rate >= 0.35 ? "you have room to offer bonuses" : "keep the value prop tight, don't discount"}.`,
    },
    {
      minute: 4,
      segment: "Offer Stack + CTA",
      notes: `Stack the value: main product + bonuses. Create urgency. End with clear CTA — "link in bio" or "comment [keyword]". Traffic is ${p.weekly_traffic.toLocaleString()}/wk so ${p.weekly_traffic >= 8000 ? "capitalize on existing momentum" : "push hard for shares to amplify reach"}.`,
    },
  ];

  return segments;
}

function buildObjections(
  p: ProductMetrics,
  price: string,
  crTier: string,
  marginTier: string,
): LiveRecipe["objections"] {
  const list: LiveRecipe["objections"] = [
    {
      objection: `"Is it worth ${price}?"`,
      reframe: `Break it down to cost-per-use. At ${(p.margin_rate * 100).toFixed(0)}% margin, there's real value built in — not just markup.`,
    },
    {
      objection: `"I can find this cheaper elsewhere"`,
      reframe: crTier === "high"
        ? `${(p.conversion_rate * 100).toFixed(1)}% of visitors buy — that's rare. The quality difference is what drives that.`
        : `The conversion tells us people compare and STILL buy this one. Point to what makes it different.`,
    },
    {
      objection: `"Does it actually work?"`,
      reframe: `This is where the demo does the heavy lifting. Show, don't tell. Let the product prove itself on camera.`,
    },
    {
      objection: `"I don't need this right now"`,
      reframe: marginTier === "high"
        ? `Create urgency with a limited bonus (margin supports it). "Only for the next 48 hours…"`
        : `Anchor to a specific moment: "Next time you [pain point], you'll wish you had this."`,
    },
    {
      objection: `"I've never heard of this brand"`,
      reframe: `Lean into discovery: "That's exactly why I'm showing you — I find these before they blow up." Trend velocity is ${p.trend_velocity.toFixed(2)}, ${p.trend_velocity >= 0.5 ? "so the wave is building" : "so you're genuinely early"}.`,
    },
  ];

  return list;
}

function buildOfferStack(
  _p: ProductMetrics,
  price: string,
  marginTier: string,
): LiveRecipe["offerStack"] {
  const bonusCapacity = marginTier === "high" ? "generous" : marginTier === "mid" ? "moderate" : "lean";

  return [
    {
      tier: "Core",
      description: `Main product at ${price}`,
      anchor: `Full retail value — position as the anchor price`,
    },
    {
      tier: "Bonus",
      description: bonusCapacity === "generous"
        ? `Add a bonus item or bundle discount (margin supports it)`
        : `Add a digital bonus (guide, checklist) — keeps cost near zero`,
      anchor: `"$XX value, yours free today"`,
    },
    {
      tier: "Urgency Layer",
      description: bonusCapacity === "lean"
        ? `Time-limited availability ("only X left")`
        : `Time-limited bundle pricing ("this combo disappears Friday")`,
      anchor: `Scarcity + deadline creates action`,
    },
  ];
}

function buildCtaMoments(
  trendTier: string,
  trafficTier: string,
): LiveRecipe["ctaMoments"] {
  return [
    {
      timestamp: "0:45",
      trigger: "After hook lands and attention is locked",
      script: `Soft CTA: "Stay to the end — I'll show you how to get this ${trendTier === "high" ? "before it sells out" : "for the best price"}."`,
    },
    {
      timestamp: "2:30",
      trigger: "After demo, during peak interest",
      script: `Mid CTA: "If you're already sold, link's in bio. But wait — there's more."`,
    },
    {
      timestamp: "4:00",
      trigger: "After offer stack, final push",
      script: trafficTier === "high"
        ? `Hard CTA: "Link in bio. Comment 'WANT' and I'll send it to you directly."`
        : `Hard CTA: "Link in bio — and share this with someone who needs it. Seriously."`,
    },
  ];
}

function buildPivotTriggers(
  trendTier: string,
  crTier: string,
): LiveRecipe["pivotTriggers"] {
  return [
    {
      signal: "View-through drops below 40% at 0:15",
      action: "Swap hook. Try the controversy angle or start with the product demo instead of talking.",
    },
    {
      signal: "Comments are mostly negative or skeptical",
      action: crTier === "low"
        ? "Pivot to longer-form proof: unboxing, side-by-side comparison, or user testimonial compilation."
        : "Pin a positive comment, reply to skeptics with a follow-up video. Social proof loop.",
    },
    {
      signal: "High views but low link clicks",
      action: "CTA isn't clear enough. Add text overlay with arrow pointing to bio link. Repeat CTA verbally.",
    },
    {
      signal: "Strong engagement but low conversion",
      action: trendTier === "high"
        ? "Audience loves the content but isn't buying yet. Test a discount code exclusive to this video."
        : "Content-market fit exists but purchase intent is weak. Try a 'limited drop' or waitlist angle.",
    },
  ];
}
