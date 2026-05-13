import { Calendar, Compass, Map, Star, Target, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Chassis } from '@/components/assessment/Chassis';

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  quote: string;
  resultLabel: string;
  resultIcon: LucideIcon;
  statusLabel: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Emily R.',
    role: 'Marketing Consultant',
    initials: 'ER',
    quote:
      'I finally understood my Freedom Number and what I actually needed to build. The clarity alone was worth it.',
    resultLabel: 'Freedom Number Identified',
    resultIcon: TrendingUp,
    statusLabel: 'SYS://CASE_01',
  },
  {
    name: 'Jake T.',
    role: 'SaaS Founder',
    initials: 'JT',
    quote:
      'The 14-day sprint gave me focus. I stopped overthinking and started executing.',
    resultLabel: '14-Day Plan Completed',
    resultIcon: Calendar,
    statusLabel: 'SYS://CASE_02',
  },
  {
    name: 'Brianna S.',
    role: 'Freelance Designer',
    initials: 'BS',
    quote:
      'I went from feeling stuck and burned out to having a clear plan to leave my job on my terms.',
    resultLabel: 'Clear Next Move Identified',
    resultIcon: Compass,
    statusLabel: 'SYS://CASE_03',
  },
  {
    name: 'Daniel M.',
    role: 'Agency Operator',
    initials: 'DM',
    quote:
      'For the first time, I know what number I need to escape — and how to get there.',
    resultLabel: '90-Day Roadmap Built',
    resultIcon: Map,
    statusLabel: 'SYS://CASE_04',
  },
];

interface ProofPoint {
  value: string;
  label: string;
}

const PROOF_POINTS: ProofPoint[] = [
  { value: '1,000+', label: 'Freedom Numbers Calculated' },
  { value: '14-Day', label: 'Sprint Format' },
  { value: 'Personalized', label: 'to Income + Runway' },
  { value: 'No Email', label: 'No Card. No Upsell.' },
];

function StarRow() {
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label="5 out of 5 stars"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          aria-hidden
          className="h-3.5 w-3.5 text-instrument-crimson"
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

function AvatarPlaceholder({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
      style={{
        background:
          'radial-gradient(circle at 30% 25%, rgba(240, 74, 77, 0.35) 0%, rgba(122, 37, 39, 0.55) 55%, #141419 100%)',
        boxShadow:
          '0 0 0 1px rgba(240, 74, 77, 0.35), 0 0 12px rgba(240, 74, 77, 0.18)',
      }}
    >
      <span className="font-mono text-[11px] tracking-[0.18em] text-instrument-primary">
        {initials}
      </span>
    </div>
  );
}

function ResultBadge({
  label,
  icon: Icon,
}: {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div
      className="mt-5 flex items-center gap-2.5 rounded-md border px-3 py-2.5"
      style={{
        borderColor: 'rgba(58, 166, 122, 0.40)',
        background: 'rgba(58, 166, 122, 0.06)',
      }}
    >
      <Icon
        aria-hidden
        className="h-4 w-4 shrink-0 text-instrument-success"
        strokeWidth={1.75}
      />
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-instrument-success">
        {label}
      </span>
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <Chassis
      intensity="subtle"
      statusLabel={t.statusLabel}
      status="active"
      brackets
    >
      <div className="bg-instrument-surface/60 backdrop-blur-sm rounded-lg p-6 sm:p-7 h-full flex flex-col">
        <div className="flex items-center gap-4">
          <AvatarPlaceholder initials={t.initials} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-base text-instrument-primary leading-tight truncate">
              {t.name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-instrument-tertiary mt-1 truncate">
              {t.role}
            </div>
          </div>
          <StarRow />
        </div>

        <div className="mt-5 h-px w-full bg-instrument-divider opacity-60" />

        <blockquote className="mt-5 font-body text-instrument-primary text-base sm:text-[17px] leading-relaxed italic">
          <span aria-hidden className="text-instrument-crimson">“</span>
          {t.quote}
          <span aria-hidden className="text-instrument-crimson">”</span>
        </blockquote>

        <div className="mt-auto">
          <ResultBadge label={t.resultLabel} icon={t.resultIcon} />
        </div>
      </div>
    </Chassis>
  );
}

export function TestimonialsSection() {
  return (
    <section className="relative px-4 sm:px-6 py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(240, 74, 77, 0.06) 0%, transparent 60%)',
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <p className="text-center font-mono text-[11px] tracking-[0.32em] uppercase text-instrument-tertiary mb-6">
          Trusted by Escape-Minded Builders
        </p>

        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-5 leading-tight">
          Real People. Real Escape Plans.
        </h2>

        <p className="text-center font-body text-instrument-secondary text-base sm:text-lg max-w-2xl mx-auto mb-3 leading-relaxed">
          See how people are using The Escape Assessment to find their Freedom
          Number, clarify their runway, and finally know what to do tomorrow
          morning.
        </p>

        <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-instrument-tertiary/80 mb-12 sm:mb-14">
          Sample success stories — early user examples
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>

        <div className="mt-12 sm:mt-14">
          <Chassis
            intensity="subtle"
            statusLabel="SYS://PROOF_STRIP"
            status="active"
            brackets
          >
            <div className="bg-instrument-surface/40 backdrop-blur-sm rounded-lg px-5 py-5 sm:px-8 sm:py-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {PROOF_POINTS.map((p, idx) => (
                  <div
                    key={p.label}
                    className={[
                      'flex items-baseline gap-3 sm:gap-4',
                      idx > 0 ? 'lg:border-l lg:border-instrument-divider lg:pl-6' : '',
                    ].join(' ')}
                  >
                    <Target
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 self-center text-instrument-crimson"
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                      <div className="font-display text-lg sm:text-xl text-instrument-primary leading-tight">
                        {p.value}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-instrument-tertiary mt-1 leading-snug">
                        {p.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Chassis>
        </div>
      </div>
    </section>
  );
}
