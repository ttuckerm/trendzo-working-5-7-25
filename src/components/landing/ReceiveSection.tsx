import { Chassis } from '@/components/assessment/Chassis';

interface Deliverable {
  name: string;
  statusLabel: string;
  body: string;
}

const DELIVERABLES: Deliverable[] = [
  {
    name: 'The 14-Day Sprint',
    statusLabel: 'SYS://SPRINT_PLAN',
    body:
      'A day-by-day plan, calibrated to your inputs. Each day has one obvious action sized to your available hours. No fluff days. No "manifest" days. No "buy a course" days.',
  },
  {
    name: 'The 90-Day Roadmap',
    statusLabel: 'SYS://ROADMAP',
    body:
      'What the next three months look like if the first 14 days work. Milestones. Decision points. The specific signals that tell you to push harder, hold steady, or pivot.',
  },
  {
    name: 'Your Freedom Number',
    statusLabel: 'SYS://FREEDOM_NUMBER',
    body:
      'The exact monthly revenue figure that, for your current income, runway, and obligations, gives you the option to leave. Not a generic "$10K/month" — a number derived from your actual math.',
  },
  {
    name: 'The Lead Generation Playbook',
    statusLabel: 'SYS://LEADS_ENGINE',
    body:
      'The first revenue-producing channel for your niche, with the specific approach that fits your bandwidth. Not "build an audience for two years." A channel that can produce a paying customer inside the 14-day sprint.',
  },
  {
    name: 'The Freedom Agent',
    statusLabel: 'SYS://AI_ADVISOR',
    body:
      'A persistent AI advisor with full context on your assessment, your sprint, your number, your niche. Not a chat window with a fresh memory every time. An advisor that knows what you committed to on day one and can reason about whether what you\'re doing on day eleven still serves the plan.',
  },
];

const FOUNDERS_LIST: Deliverable = {
  name: "Founders' List Access",
  statusLabel: 'SYS://FOUNDERS_LIST',
  body:
    "When we open the founders' list for what we're building next, you'll be on it before it goes public. Pricing will be locked meaningfully better than launch pricing, and you will not need to re-qualify.",
};

function DeliverableCard({ d }: { d: Deliverable }) {
  return (
    <Chassis intensity="subtle" statusLabel={d.statusLabel} status="active" brackets>
      <div className="bg-instrument-surface/60 backdrop-blur-sm rounded-lg p-6 sm:p-7 h-full">
        <h3 className="font-display text-xl text-instrument-primary mb-3 leading-snug">
          {d.name}
        </h3>
        <p className="font-body text-instrument-secondary text-base leading-relaxed">
          {d.body}
        </p>
      </div>
    </Chassis>
  );
}

export function ReceiveSection() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-6 leading-tight">
          What you receive
        </h2>
        <p className="text-center font-body text-instrument-secondary text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          When you enter your code and answer the five questions, you receive — in roughly 90 seconds — a personalized assessment that includes:
        </p>

        <img
          src="/images/escape-assessment-product.png"
          alt="The Escape Assessment — book, dashboard, and Freedom Agent"
          className="block w-full max-w-2xl h-auto mx-auto mb-14"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {DELIVERABLES.map((d) => (
            <DeliverableCard key={d.name} d={d} />
          ))}
        </div>

        <div className="mt-6 sm:mt-8">
          <DeliverableCard d={FOUNDERS_LIST} />
        </div>
      </div>
    </section>
  );
}
