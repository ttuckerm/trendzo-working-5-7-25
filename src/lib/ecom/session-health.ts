export interface LiveEvent {
  ts: string;
  viewers: number;
  comments_per_min: number;
  shares_per_min: number;
  clicks_per_min: number;
  carts_per_min: number;
  purchases_per_min: number;
  revenue_per_min: number;
  avg_watch_seconds: number;
}

export type HealthStatus = "green" | "yellow" | "red";

export interface RecommendedAction {
  title: string;
  why: string;
  scriptLines: string[];
}

export interface HealthReport {
  health: HealthStatus;
  reasons: string[];
  recommendedActions: RecommendedAction[];
}

const BASELINE_WINDOW = 3;
const RED_THRESHOLD = 0.25;
const YELLOW_THRESHOLD = 0.10;
const CONSECUTIVE_REQUIRED = 2;

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pctDrop(baseline: number, current: number): number {
  if (baseline <= 0) return 0;
  return (baseline - current) / baseline;
}

export function computeHealth(events: LiveEvent[]): HealthReport {
  if (events.length === 0) {
    return {
      health: "green",
      reasons: ["No events yet — waiting for data."],
      recommendedActions: [],
    };
  }

  if (events.length < BASELINE_WINDOW) {
    return {
      health: "green",
      reasons: [
        `Collecting baseline (${events.length}/${BASELINE_WINDOW} events).`,
      ],
      recommendedActions: [],
    };
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
  );

  const baselineSlice = sorted.slice(0, BASELINE_WINDOW);
  const baselineViewers = avg(baselineSlice.map((e) => e.viewers));
  const baselinePurchases = avg(
    baselineSlice.map((e) => e.purchases_per_min),
  );
  const baselineComments = avg(
    baselineSlice.map((e) => e.comments_per_min),
  );

  const recent = sorted.slice(-CONSECUTIVE_REQUIRED);

  const reasons: string[] = [];
  let worst: HealthStatus = "green";

  const viewerDrops = recent.map((e) => pctDrop(baselineViewers, e.viewers));
  const purchaseDrops = recent.map((e) =>
    pctDrop(baselinePurchases, e.purchases_per_min),
  );
  const commentDrops = recent.map((e) =>
    pctDrop(baselineComments, e.comments_per_min),
  );

  function check(
    label: string,
    drops: number[],
    baseline: number,
  ) {
    if (baseline <= 0) return;

    const allRed = drops.every((d) => d >= RED_THRESHOLD);
    const allYellow = drops.every((d) => d >= YELLOW_THRESHOLD);

    if (allRed) {
      worst = "red";
      const drop = Math.round(avg(drops) * 100);
      reasons.push(
        `${label} dropped ~${drop}% vs baseline for ${CONSECUTIVE_REQUIRED} consecutive events.`,
      );
    } else if (allYellow) {
      if (worst === "green") worst = "yellow";
      const drop = Math.round(avg(drops) * 100);
      reasons.push(
        `${label} trending down ~${drop}% vs baseline.`,
      );
    }
  }

  check("Viewers", viewerDrops, baselineViewers);
  check("Purchases/min", purchaseDrops, baselinePurchases);
  check("Comments/min", commentDrops, baselineComments);

  if (reasons.length === 0) {
    reasons.push("All metrics holding steady vs baseline.");
  }

  const recommendedActions = buildActions(
    worst,
    reasons,
    viewerDrops,
    purchaseDrops,
  );

  return { health: worst, reasons, recommendedActions };
}

function buildActions(
  health: HealthStatus,
  reasons: string[],
  viewerDrops: number[],
  purchaseDrops: number[],
): RecommendedAction[] {
  if (health === "green") return [];

  const actions: RecommendedAction[] = [];
  const hasViewerDrop = viewerDrops.some((d) => d >= YELLOW_THRESHOLD);
  const hasPurchaseDrop = purchaseDrops.some((d) => d >= YELLOW_THRESHOLD);

  if (hasViewerDrop) {
    actions.push({
      title: "Re-hook the audience",
      why: "Viewer count is dropping — attention is fading.",
      scriptLines: [
        '"Wait wait wait — before you scroll, I saved the best part for right now."',
        '"Comment \'ME\' if you want me to reveal the price."',
        '"I\'m about to do something I\'ve never done on live before…"',
      ],
    });

    if (health === "red") {
      actions.push({
        title: "Pattern interrupt",
        why: "Steep viewer drop needs an immediate pattern break.",
        scriptLines: [
          '"STOP. I need to show you something nobody else has seen."',
          '"Okay, I wasn\'t going to do this, but let\'s do a flash giveaway right now."',
          '"Drop a 🔥 if you\'re still here — I\'m counting."',
        ],
      });
    }
  }

  if (hasPurchaseDrop) {
    actions.push({
      title: "Urgency push",
      why: "People are watching but not buying — add scarcity.",
      scriptLines: [
        '"We only have [X] left at this price — once they\'re gone, they\'re gone."',
        '"Everyone who buys in the next 2 minutes gets [bonus]. Clock starts now."',
        '"I just checked — the warehouse says we\'re almost out of this color."',
      ],
    });
  }

  if (health === "red" && !hasViewerDrop && !hasPurchaseDrop) {
    actions.push({
      title: "Engagement rescue",
      why: reasons.join(" "),
      scriptLines: [
        '"Let\'s do something fun — first person to comment [keyword] gets a shoutout."',
        '"Share this live with one friend and I\'ll unlock a secret deal."',
        '"Who wants me to show the [product] comparison side by side? Comment YES."',
      ],
    });
  }

  return actions;
}
