import { ChevronDown } from 'lucide-react';
import { CodeEntry } from './CodeEntry';
import { PaidCheckoutButton } from './PaidCheckoutButton';

export function HookSection() {
  return (
    <section className="relative px-4 sm:px-6 pt-2 sm:pt-3 pb-20 sm:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(240, 74, 77, 0.10) 0%, transparent 60%)',
        }}
      />
      <div className="relative max-w-7xl mx-auto">
        {/* Plain <img> so a missing asset degrades to a broken-image icon
            instead of breaking the layout. */}
        <img
          src="/images/escape-assessment-logo.png"
          alt="Escape Assessment"
          className="mx-auto block w-56 sm:w-64 h-auto mb-1 sm:mb-1.5"
        />
        <h1 className="text-center font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic text-instrument-primary leading-[1.05] mb-3 mx-auto">
          &ldquo;This is the best 9 to 5 escape strategy I know, but it is going to require you to do this one <span className="underline decoration-[#f04a4d] decoration-[6px] underline-offset-[6px]">annoying thing</span>!&rdquo;
        </h1>
        <p className="text-center font-body text-xl sm:text-2xl text-instrument-secondary leading-snug max-w-6xl mx-auto mb-2">
          <span className="font-bold text-instrument-primary underline decoration-[#f04a4d] decoration-4 underline-offset-4">Take the Free Escape Assessment</span> and do the one thing most stuck employees avoid: calculate the exact number, timeline, and first move required to stop needing your 9-to-5!
        </p>
        <p className="text-center font-body text-base font-bold text-instrument-primary mb-4 sm:mb-5">
          No email. No card. Three minutes. Unlimited Freedom Agent access.
        </p>

        <div className="mb-2">
          <CodeEntry idPrefix="code-top" />
        </div>

        <div className="mb-3">
          <PaidCheckoutButton idPrefix="paid-top" />
        </div>

        <p className="text-center font-body text-sm text-instrument-tertiary mb-16 sm:mb-20">
          Normally <span className="text-instrument-secondary line-through">$97</span>. Free with a code from our YouTube channel.
        </p>

        <div className="max-w-3xl mx-auto">
          <div className="h-px w-full bg-instrument-divider opacity-50 mb-10" />
          <p className="text-center italic font-body text-sm sm:text-base text-instrument-secondary leading-relaxed mb-16">
            Have a code? Enter it above. Want to know what you&apos;re about to receive — and why we&apos;re giving away a $97 product to people who watched a video? Read on.
          </p>
        </div>

        <div className="flex justify-center mb-20 sm:mb-24">
          <ChevronDown
            aria-hidden
            className="h-6 w-6 text-instrument-tertiary motion-safe:animate-bounce"
          />
        </div>

        <h2 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary mb-3 leading-tight">
          You weren&apos;t the failure.
        </h2>
        <p className="text-center font-body text-instrument-secondary text-base sm:text-lg max-w-2xl mx-auto mb-16">
          Fifteen years of doing everything right. A salary that looks fine on paper. A life that doesn&apos;t feel like yours. There&apos;s a reason for that — and it isn&apos;t you.
        </p>

        <div className="max-w-[680px] mx-auto space-y-6 font-body text-instrument-primary text-base sm:text-lg leading-relaxed">
          <p className="text-xl italic leading-snug text-instrument-primary">
            You followed the script.
          </p>
          <p>
            You went to school. You picked the major that made sense. You took the internship, then the entry-level job, then the next one, then the one after that. You showed up early. You stayed late. You took the certifications. You did the LinkedIn thing. You did the networking thing. You said yes to the move, the promotion, the responsibility you weren&apos;t sure you wanted.
          </p>
          <p>
            You did it the way you were told to do it. Not perfectly — nobody does it perfectly — but well enough. Well enough that on paper, your life looks like the life you were promised.
          </p>
          <p>
            And somewhere between 32 and 38, you started waking up at 4:47 in the morning with your jaw clenched, staring at the ceiling, doing the math.
          </p>
          <p>
            The math on the salary that doesn&apos;t go as far as it was supposed to. The math on the runway you don&apos;t actually have. The math on how many more years of this — exactly this — are between you and the version of your life you used to believe you were going to have.
          </p>
          <p>And the worst part isn&apos;t the math.</p>
          <p>
            The worst part is that you can&apos;t say it out loud. Not to your partner, who&apos;s tired in the same way you are. Not to your parents, who would say you should be grateful, look at everything you have. Not to your friends, who are quietly drowning in the same water. Not to the people at work, who would treat the admission like a contagion.
          </p>
          <p>So you carry it. Quietly. For years.</p>
          <p>
            You buy the courses. You start the side projects. You make the Notion doc with seventeen business ideas. You watch forty hours of YouTube. You ask ChatGPT what to do and it gives you a generic answer and you close the tab. You tell yourself next quarter, next year, when things settle down.
          </p>
          <p>Things don&apos;t settle down.</p>
        </div>
      </div>
    </section>
  );
}
