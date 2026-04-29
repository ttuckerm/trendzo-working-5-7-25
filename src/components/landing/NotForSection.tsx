import { Chassis } from '@/components/assessment/Chassis';

interface Disqualifier {
  headline: string;
  body: string;
}

const DISQUALIFIERS: Disqualifier[] = [
  {
    headline: "You're not actually unhappy.",
    body:
      'The assessment is calibrated for someone whose 4:47 AM math problem is real. If your job is fine, if your life is fine, if you\'re reading this out of casual curiosity, the result will not feel personal because the inputs you give will not be honest. Come back if and when the math gets uncomfortable.',
  },
  {
    headline: 'You want a passive-income fantasy.',
    body:
      'The 14-day sprint is work. It is calibrated work, sized to your bandwidth, with a real payoff — but it is work. If what you\'re looking for is a system where money arrives without effort, this is not it, and there is no honest version of it anywhere.',
  },
  {
    headline: 'You want someone to do it for you.',
    body:
      'The Freedom Agent is an advisor with context. It is not a co-founder, it is not an executor, it is not going to write the emails or make the calls or close the customers. You are. The agent helps you decide; you have to act.',
  },
  {
    headline: "You're collecting plans instead of executing them.",
    body:
      'If you have a Notion doc with seventeen business ideas and you\'re about to add this assessment to it as the eighteenth, please don\'t. The assessment is designed to be executed within 14 days of receipt. If you cannot commit to attempting day one tomorrow, the assessment will sit in your inbox and become another piece of evidence that you don\'t take action — and that is worse for you than not having it at all.',
  },
];

export function NotForSection() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-6 leading-tight">
          Who this is not for
        </h2>
        <p className="text-center font-body text-instrument-secondary text-base sm:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          This is not for everyone. If any of these are you, please close the tab — you&apos;ll waste your time and ours.
        </p>

        <div className="space-y-6">
          {DISQUALIFIERS.map((d, i) => (
            <Chassis
              key={d.headline}
              intensity="subtle"
              statusLabel={`SYS://EXCLUSION — ${i + 1}`}
              status="idle"
              brackets
            >
              <div className="bg-instrument-surface/40 backdrop-blur-sm rounded-lg p-6 sm:p-7">
                <h3 className="font-display text-lg sm:text-xl text-instrument-primary mb-3 leading-snug">
                  {d.headline}
                </h3>
                <p className="font-body text-instrument-secondary text-base leading-relaxed">
                  {d.body}
                </p>
              </div>
            </Chassis>
          ))}
        </div>

        <p className="text-center font-body text-instrument-secondary text-base sm:text-lg mt-12 leading-relaxed">
          If none of the above is you — keep reading. The next section is the part that matters.
        </p>
      </div>
    </section>
  );
}
