// Money Models core types aligned with Acquisition.com taxonomy

export type OfferBucket = 'attraction' | 'upsell' | 'downsell' | 'continuity'

export type AttractionPattern =
  | 'Win Your Money Back'
  | 'Free Giveaways'
  | 'Decoy Offers'
  | 'Buy X Get Y'
  | 'Pay Less Now'
  | 'Free with Consumption'

export type UpsellPattern =
  | 'Classic Upsell'
  | 'Menu Upsell'
  | 'Anchor Upsell'
  | 'Rollover Upsell'

export type DownsellPattern =
  | 'Payment Plans'
  | 'Free Trials'
  | 'Feature Downsells'

export type ContinuityPattern =
  | 'Continuity Offer'
  | 'Continuity Bonus Offers'
  | 'Continuity Discounts'
  | 'Waived Fee'

export type OfferPattern =
  | AttractionPattern
  | UpsellPattern
  | DownsellPattern
  | ContinuityPattern

export interface OrderBump {
  id: string
  price: number
}

export interface OfferBase {
  id: string
  bucket: OfferBucket
  pattern: OfferPattern
  name: string
}

export interface AttractionOffer extends OfferBase {
  bucket: 'attraction'
  pattern: AttractionPattern
  price?: number
  credits?: number
  order_bumps?: OrderBump[]
}

export interface UpsellOffer extends OfferBase {
  bucket: 'upsell'
  pattern: UpsellPattern
  price?: number
  trial_credit_for?: string
}

export interface DownsellOffer extends OfferBase {
  bucket: 'downsell'
  pattern: DownsellPattern
  price?: number
  terms?: { months?: number; commit?: boolean }
}

export interface ContinuityOffer extends OfferBase {
  bucket: 'continuity'
  pattern: ContinuityPattern
  recurring?: { interval: 'month' | 'year'; price: number }
  bonuses?: string[]
}

export type MoneyModelOffer =
  | AttractionOffer
  | UpsellOffer
  | DownsellOffer
  | ContinuityOffer

export interface MoneyModelConfig {
  model_version: 'money-models-v1'
  objectives: { payback_days_target: number; day0_cac_coverage: boolean }
  offers: MoneyModelOffer[]
}

export type FrontendEventName =
  | 'lead.captured'
  | 'offer.viewed'
  | 'offer.accepted'
  | 'offer.declined'
  | 'order.bump.accepted'
  | 'subscription.started'
  | 'credits.spent'
  | 'refund.requested'
  | 'payback.updated'

export type OfferEvent =
  | { name: 'lead.captured'; source?: string; creative_id?: string; path?: string }
  | { name: 'offer.viewed'; offer_id: string; bucket: OfferBucket }
  | { name: 'offer.accepted'; offer_id: string; price?: number; payment_terms?: string; bucket: OfferBucket }
  | { name: 'offer.declined'; offer_id: string; reason_if_known?: string }
  | { name: 'order.bump.accepted'; bump_id: string; price: number }
  | { name: 'subscription.started'; plan_id: string; term: 'month' | 'year'; seat_count?: number }
  | { name: 'credits.spent'; feature: string; qty: number }
  | { name: 'refund.requested'; offer_id: string; reason?: string }
  | { name: 'payback.updated'; days_to_cac: number; gp_to_date: number }

export interface CohortOrderPoint {
  t: number // day offset from acquisition
  gp: number // gross profit amount for that day
}

export interface Cohort {
  cac: number
  orders: CohortOrderPoint[]
}

export function computePaybackDays(c: Cohort): number {
  let cumulative = 0
  for (let d = 0; d <= 90; d++) {
    for (const o of c.orders) {
      if (o.t === d) cumulative += o.gp
    }
    if (cumulative >= c.cac) return d
  }
  return Number.POSITIVE_INFINITY
}
















