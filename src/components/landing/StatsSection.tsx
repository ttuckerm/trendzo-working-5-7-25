interface Stat {
  number: string;
  description: string;
}

const STATS: Stat[] = [
  {
    number: '67%',
    description: 'of professionals report being stuck — unable to advance, unable to leave, unable to see a way forward.',
  },
  {
    number: '70%+',
    description: 'of tech workers say the same.',
  },
  {
    number: '80%',
    description: 'of millennials describe a midlife crisis as "a luxury they can\'t afford."',
  },
  {
    number: '25%',
    description: 'of people in this position are actively planning a pivot.',
  },
];

export function StatsSection() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-[680px] mx-auto">
        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-12 leading-tight">
          What the numbers actually say
        </h2>

        <div className="space-y-6 font-body text-instrument-primary text-base sm:text-lg leading-relaxed">
          <p>
            We didn&apos;t build the Escape Assessment because we had a hunch.
          </p>
          <p>
            67% of professionals report being stuck — unable to advance, unable to leave, unable to see a way forward (Glassdoor, October 2025). 70%+ of tech workers say the same. 80% of millennials describe a midlife crisis as &quot;a luxury they can&apos;t afford&quot; (April 2024). The cost of school is 40% higher than it was twenty years ago, in real terms, while wages for the degrees those schools confer have not kept pace.
          </p>
        </div>

        <div className="my-14 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((s) => (
            <div key={s.number} className="text-center">
              <div className="font-display text-4xl sm:text-5xl text-instrument-crimson mb-3 leading-none">
                {s.number}
              </div>
              <p className="font-body text-sm text-instrument-secondary leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center font-display italic text-xl sm:text-2xl text-instrument-primary my-12 leading-snug">
          And here is the number that should haunt you: only 25% of the people in this position are actively planning a pivot.
        </p>

        <div className="space-y-6 font-body text-instrument-primary text-base sm:text-lg leading-relaxed">
          <p>
            That is not because the other 75% don&apos;t want to. It is because the other 75% don&apos;t know what to do tomorrow morning. They have ideas. They have intentions. They have evenings spent reading about other people doing what they want to do. They do not have a sprint sized to the bandwidth they actually have, calibrated to the math they&apos;re actually inside of, with one obvious next action that fits in the hours they actually own.
          </p>
          <p>
            The Escape Assessment exists because that gap — between intent and tomorrow-morning action — is where almost everyone in your demographic dies professionally. Not because they were lazy. Not because they were stupid. Because the system they were inside of was specifically engineered to absorb their motivation and convert it back into compliance.
          </p>
          <p className="font-display text-xl sm:text-2xl text-instrument-primary leading-snug">
            You don&apos;t need more motivation. You need a sprint.
          </p>
        </div>
      </div>
    </section>
  );
}
