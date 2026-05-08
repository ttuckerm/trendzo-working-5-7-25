import { CodeEntry } from './CodeEntry';
import { PaidCheckoutButton } from './PaidCheckoutButton';

export function CloseSection() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-[680px] mx-auto">
        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-12 leading-tight">
          One Last Thing
        </h2>

        <div className="space-y-6 font-body text-instrument-primary text-base sm:text-lg leading-relaxed">
          <p>
            If you are reading this final line, you have read the entire page.
          </p>
          <p>
            You know what you are looking at. You know what is being offered. You know what it would cost you anywhere else, and you know what it costs here. You know what the assessment includes, what the agent does, and what the founders&apos; list represents. You know what we are building next, and you know why the assessment is free.
          </p>
          <p>
            You also know what tomorrow morning looks like if you don&apos;t redeem the code.
          </p>
        </div>

        <div className="my-16 sm:my-20 space-y-8 sm:space-y-10 text-center">
          <p className="font-display text-2xl sm:text-3xl text-instrument-primary leading-snug">
            You weren&apos;t the failure.
          </p>
          <p className="font-display text-2xl sm:text-3xl text-instrument-primary leading-snug">
            You were the product.
          </p>
          <p className="font-display text-2xl sm:text-3xl text-instrument-crimson leading-snug">
            The next move is yours.
          </p>
        </div>

        <div className="mt-16 mb-2">
          <CodeEntry idPrefix="code-final" variant="minimal" />
        </div>

        <div className="mb-6">
          <PaidCheckoutButton idPrefix="paid-final" />
        </div>
      </div>
    </section>
  );
}
