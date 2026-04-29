const NEGATIVE_LIST = [
  'You are not going to be asked for an email before you see the result.',
  'You are not going to be asked for a credit card.',
  'You are not going to be added to a nurture sequence.',
  'You are not going to be retargeted across the internet with ads for the next ninety days.',
  'You are not going to be upsold inside the assessment.',
  'You are not going to be pushed into a "free strategy call" that turns into a $2,000 pitch.',
  'You are not going to be told that the real answer is behind a paywall.',
];

export function PromiseSection() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-[680px] mx-auto">
        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-12 leading-tight">
          The No-Strings Promise
        </h2>

        <div className="space-y-6 font-body text-instrument-primary text-base sm:text-lg leading-relaxed">
          <p>This is what is not going to happen when you enter your code.</p>

          <ul className="space-y-3 my-8 not-prose">
            {NEGATIVE_LIST.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 font-mono text-[14px] sm:text-[15px] text-instrument-secondary leading-relaxed pl-2"
              >
                <span aria-hidden className="text-instrument-crimson select-none mt-[2px]">
                  ›
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p>
            You enter the code. You answer five questions. You receive the assessment. That is the entire transaction.
          </p>
          <p>
            If you want to come back and tell us it helped, we&apos;d love to hear it. If you want to come back and tell us it didn&apos;t, we&apos;d love to hear that too. If you never come back at all, that is also fine — you got what we said you&apos;d get, and we got the only thing we wanted, which is the chance to be useful to you for three minutes.
          </p>
          <p>
            That is the promise. It is structurally enforced — there is no email field on the assessment, there is no card field, there is no tracking pixel running ad retargeting. We built the system this way on purpose, because the avatar we built it for has been burned by exactly the pattern this avoids.
          </p>
        </div>
      </div>
    </section>
  );
}
