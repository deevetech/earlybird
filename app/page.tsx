import { WaitlistForm } from "@/components/waitlist-form";

const CURRENT_YEAR = new Date().getFullYear();

type EditorialPrinciple = {
  numeral: string;
  title: string;
  body: string;
};

const EDITORIAL_PRINCIPLES: EditorialPrinciple[] = [
  {
    numeral: "01",
    title: "Signal over volume",
    body: "We send one email when something ships. Nothing in between, nothing in the noise.",
  },
  {
    numeral: "02",
    title: "Builders, not marketers",
    body: "Written by the people doing the work, not a growth team chasing a quarterly target.",
  },
  {
    numeral: "03",
    title: "Unsubscribe is one click",
    body: "No drip campaigns, no win-back flows, no dark patterns. Leave whenever you want.",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="hairline-b">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <p className="smallcaps text-[0.7rem] text-ink">
            Earlybird
            <span className="ml-1 text-[color:var(--accent-terracotta)]" aria-hidden="true">
              *
            </span>
          </p>
          <p className="smallcaps text-[0.7rem] text-ink-soft">Est. 2026</p>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-y-16 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-x-16 lg:py-28">
          <div className="lg:col-span-7">
            <p className="smallcaps text-[0.7rem] text-ink-soft">
              Issue No. 001 / Waitlist
            </p>

            <h1 className="mt-6 font-display text-[clamp(2.75rem,7vw,5.25rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink">
              The list before
              <br />
              the launch.
              <span
                className="ml-1 inline-block h-[0.33em] w-[0.33em] align-baseline bg-[color:var(--accent-terracotta)]"
                aria-hidden="true"
              />
            </h1>

            <p className="mt-8 max-w-xl font-mono text-[0.95rem] leading-relaxed text-ink-soft">
              Earlybird sends one email when something worth your attention
              ships. No newsletters, no noise, no second guesses. Quiet by
              design, signed by the people building it.
            </p>

            <div className="mt-10">
              <WaitlistForm />
            </div>

            <p className="mt-6 max-w-md font-mono text-[0.72rem] leading-relaxed text-ink-soft">
              Your email is stored in a single Supabase row with row level
              security on. We hash your IP for spam control and never share
              anything with anyone.
            </p>
          </div>

          <aside className="lg:col-span-5 lg:pl-10">
            <div className="hairline-t">
              <p className="smallcaps mt-6 text-[0.7rem] text-ink-soft">
                Three principles
              </p>
              <ol className="mt-8 flex flex-col">
                {EDITORIAL_PRINCIPLES.map((principle) => (
                  <li
                    key={principle.numeral}
                    className="hairline-b grid grid-cols-[auto_1fr] gap-x-6 py-6 last:border-b-0"
                  >
                    <span className="font-display text-2xl font-light leading-none text-ink">
                      {principle.numeral}
                    </span>
                    <div>
                      <p className="font-mono text-[0.82rem] font-medium uppercase tracking-[0.14em] text-ink">
                        {principle.title}
                      </p>
                      <p className="mt-2 font-mono text-[0.8rem] leading-relaxed text-ink-soft">
                        {principle.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </section>

      <footer className="hairline-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-mono text-[0.72rem] text-ink-soft">
            &copy; {CURRENT_YEAR} Earlybird. All rights reserved.
          </p>
          <p className="font-mono text-[0.72rem] text-ink-soft">
            Built by{" "}
            <a
              href="https://deeve.info"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline decoration-[color:var(--accent-terracotta)] decoration-2 underline-offset-4 hover:text-[color:var(--accent-terracotta)]"
            >
              Deeve
            </a>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}
