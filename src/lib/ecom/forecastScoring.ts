import { z } from "zod";

export const ecomForecastInputSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  conversionRate: z.number().min(0).max(1),
  marginRate: z.number().min(0).max(1),
  weeklyTraffic: z.number().min(0),
  trendVelocity: z.number().min(-1).max(1),
});

export const ecomForecastReasonSchema = z.object({
  key: z.enum(["conversion", "margin", "traffic", "trend"]),
  points: z.number(),
  message: z.string().min(1),
});

export const ecomForecastResultSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  score: z.number().min(0).max(100),
  reasons: z.array(ecomForecastReasonSchema).min(1),
});

export type EcomForecastInput = z.infer<typeof ecomForecastInputSchema>;
export type EcomForecastResult = z.infer<typeof ecomForecastResultSchema>;

function clampTo100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateEcomForecastScore(
  input: EcomForecastInput,
): EcomForecastResult {
  const parsed = ecomForecastInputSchema.parse(input);

  const conversionPoints = parsed.conversionRate * 40;
  const marginPoints = parsed.marginRate * 25;
  const trafficPoints = Math.min(20, (parsed.weeklyTraffic / 10000) * 20);
  const trendPoints = ((parsed.trendVelocity + 1) / 2) * 15;

  const score = Math.round(
    clampTo100(conversionPoints + marginPoints + trafficPoints + trendPoints),
  );

  const reasons = [
    {
      key: "conversion" as const,
      points: round2(conversionPoints),
      message: `Conversion rate ${(parsed.conversionRate * 100).toFixed(1)}% contributed ${round2(conversionPoints)} points.`,
    },
    {
      key: "margin" as const,
      points: round2(marginPoints),
      message: `Margin rate ${(parsed.marginRate * 100).toFixed(1)}% contributed ${round2(marginPoints)} points.`,
    },
    {
      key: "traffic" as const,
      points: round2(trafficPoints),
      message: `Weekly traffic ${parsed.weeklyTraffic.toLocaleString()} contributed ${round2(trafficPoints)} points (capped at 20).`,
    },
    {
      key: "trend" as const,
      points: round2(trendPoints),
      message: `Trend velocity ${parsed.trendVelocity.toFixed(2)} contributed ${round2(trendPoints)} points.`,
    },
  ];

  return ecomForecastResultSchema.parse({
    productId: parsed.productId,
    productName: parsed.productName,
    score,
    reasons,
  });
}
