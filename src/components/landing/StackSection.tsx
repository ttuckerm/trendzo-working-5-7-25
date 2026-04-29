import { Chassis } from '@/components/assessment/Chassis';

interface Row {
  label: string;
  value: string;
}

const ROWS: Row[] = [
  { label: 'The Escape Assessment', value: '$97' },
  { label: 'The Freedom Agent', value: '$497' },
  { label: 'The 90-Day Roadmap', value: '$200' },
  { label: 'Your Freedom Number, calculated', value: '$150' },
  { label: 'The Lead Generation Playbook', value: '$300' },
];

export function StackSection() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-12 leading-tight">
          What it&apos;s worth
        </h2>

        <Chassis intensity="standard" statusLabel="SYS://VALUE_STACK" status="active" brackets>
          <div className="bg-instrument-surface/60 backdrop-blur-sm rounded-lg p-6 sm:p-8">
            <table className="w-full">
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-instrument-divider/60 last:border-b-0">
                    <td className="py-3 sm:py-4 font-mono text-sm sm:text-base text-instrument-primary pr-4">
                      {row.label}
                    </td>
                    <td className="py-3 sm:py-4 text-right font-mono text-sm sm:text-base text-instrument-crimson tabular-nums">
                      {row.value}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-instrument-crimson/40">
                  <td className="pt-4 font-mono text-sm sm:text-base text-instrument-primary uppercase tracking-wider">
                    Total itemized value
                  </td>
                  <td className="pt-4 text-right font-display text-xl sm:text-2xl text-instrument-crimson tabular-nums">
                    $1,244
                  </td>
                </tr>
                <tr>
                  <td className="pt-3 font-mono text-sm text-instrument-secondary">
                    Founders&apos; List Access
                  </td>
                  <td className="pt-3 text-right font-mono text-sm text-instrument-tertiary italic">
                    (see below)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Chassis>

        <p className="mt-10 max-w-[640px] mx-auto font-body text-base sm:text-lg text-instrument-secondary leading-relaxed">
          <span className="text-instrument-primary font-semibold">Founders&apos; List Access.</span>{' '}
          We are not assigning a dollar value to this because we have not set the price for what we&apos;re building yet, and we would rather tell you the truth than invent a number.
        </p>

        <p className="text-center font-display text-2xl sm:text-3xl text-instrument-primary mt-12 leading-snug">
          Your price with a valid code:{' '}
          <span className="text-instrument-crimson">$0</span>.
        </p>
      </div>
    </section>
  );
}
