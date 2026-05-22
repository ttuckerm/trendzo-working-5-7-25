import { CodeEntry } from './CodeEntry';
import { EmailNotifyForm } from './EmailNotifyForm';
import { YouTubeCTA } from './YouTubeCTA';
import { PaidCheckoutButton } from './PaidCheckoutButton';

export function CTASection() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-8 leading-tight">
          Redeem Your Code
        </h2>

        <img
          src="/images/escape-assessment-results.png"
          alt="The Escape Assessment results"
          className="block w-full max-w-xl h-auto mx-auto mb-12"
        />

        <div className="mb-2">
          <CodeEntry idPrefix="code-cta" />
        </div>

        <div className="mb-6">
          <PaidCheckoutButton idPrefix="paid-cta" />
        </div>

        <p className="text-center font-body text-sm text-instrument-tertiary max-w-2xl mx-auto mb-16 leading-relaxed">
          Three minutes. No card. No email required. The 14-day sprint, the 90-day roadmap, the Freedom Agent, the Freedom Number, and the founders&apos; list position — yours, free, with a valid code.
        </p>

        <div className="flex items-center gap-4 my-12 max-w-md mx-auto" role="separator">
          <div className="h-px flex-1 bg-instrument-divider opacity-60" />
          <span className="font-mono text-xs tracking-[0.18em] uppercase text-instrument-tertiary">
            No code yet?
          </span>
          <div className="h-px flex-1 bg-instrument-divider opacity-60" />
        </div>

        <div className="max-w-[680px] mx-auto space-y-6 font-body text-instrument-primary text-base sm:text-lg leading-relaxed mb-10">
          <p>
            Codes are released through our YouTube channel as it grows, through direct invitations to people who fit the profile we built this for, and through a small allocation released to partner channels.
          </p>
          <p>
            If you want to be notified the moment the next batch of codes is released, you can give us your email below. This is the only thing the email will be used for. You will receive one email when codes drop. No marketing list. No nurture sequence. No drip. One email. Single purpose.
          </p>
        </div>

        <EmailNotifyForm />

        <p className="text-center font-mono text-xs tracking-[0.18em] uppercase text-instrument-tertiary my-10">
          — or —
        </p>

        <p className="max-w-[680px] mx-auto text-center font-body text-instrument-secondary text-base sm:text-lg mb-8 leading-relaxed">
          If you would rather not give us your email, you can also subscribe to our YouTube channel, where codes are released to subscribers first.
        </p>

        <YouTubeCTA />
      </div>
    </section>
  );
}
