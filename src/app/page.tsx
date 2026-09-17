import Assess from "@/components/Assess";

export default function Page() {
  return (
    <main className="px-5 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Masthead */}
        <header className="rule-b py-6">
          <div className="flex items-baseline justify-between">
            <span className="display text-[22px] tracking-[-0.01em]">RADIUS</span>
            <span className="mark idle">transmission : 001</span>
          </div>
        </header>

        <section className="rise py-20 text-center md:py-28">
          <div className="mark mb-8">[ the question ]</div>
          <h1 className="display mx-auto max-w-[16ch] text-[clamp(38px,8vw,88px)] leading-[0.98]">
            How far apart are your copies, really?
          </h1>
          <p className="mx-auto mt-8 max-w-[58ch] text-[15.5px] leading-[1.75] text-dim">
            Redundancy is a distance, and almost nobody knows theirs. Two copies can sit in different
            buildings, on different continents, under different providers — and still share one
            event, one key, or one jurisdiction that ends all of them at once.
          </p>
        </section>

        {/* The fact the whole thing turns on */}
        <section className="rule-t rule-b py-14">
          <div className="grid gap-px bg-rule md:grid-cols-[1fr_1.4fr]">
            <div className="bg-void py-8 pr-6">
              <div className="mark mb-4">[ from the documentation ]</div>
              <p className="display text-[clamp(22px,3.4vw,34px)] leading-[1.15]">
                &ldquo;Availability Zones in a Region are meaningfully distant from each other, up to
                60 miles (~100 km).&rdquo;
              </p>
            </div>
            <div className="bg-void py-8 md:pl-8">
              <p className="text-[15px] leading-[1.75] text-dim">
                That sentence is AWS describing its own architecture, and it is the whole reason this
                exists. A hundred kilometres is a serious distance for a power cut and no distance at
                all for a hurricane, a war, or a court order.
              </p>
              <p className="mt-4 text-[15px] leading-[1.75] text-dim">
                Multi-AZ is not multi-region. Multi-region is not multi-provider. Multi-provider is
                not multi-jurisdiction. And none of those four is a defence against somebody holding
                your keys.
              </p>
            </div>
          </div>
        </section>

        {/* The instrument */}
        <section className="py-16">
          <Assess />
        </section>

        {/* Why */}
        <section className="rule-t py-16">
          <div className="mark mb-5">[ why now ]</div>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="display text-[clamp(21px,3vw,30px)] leading-[1.2]">
                This week AWS said it could not restore some customer data from facilities that had
                been physically destroyed.
              </p>
              <p className="mt-5 text-[14.5px] leading-[1.75] text-dim">
                Four hundred comments followed, and the sharpest of them was geometric rather than
                political — that tens of miles is close enough to be the same place when the threat
                moves at a few hundred miles an hour. Redundancy that assumes a fire assumes wrongly
                about everything else.
              </p>
            </div>
            <div className="space-y-5">
              <blockquote className="border-l border-rule-lit pl-5 text-[14px] italic leading-[1.7] text-dim">
                &ldquo;10s of miles is close enough that they are functionally in the same place in a
                military context… if you want protection against those risks you have to use multiple
                regions.&rdquo;
                <span className="mark block pt-2 not-italic">— hacker news, 17 sep 2026</span>
              </blockquote>
              <blockquote className="border-l border-rule-lit pl-5 text-[14px] italic leading-[1.7] text-dim">
                &ldquo;I would love if someone could tell me the name for this phenomena.&rdquo; — on
                feeling assured by a system you have not checked.
                <span className="mark block pt-2 not-italic">— same thread</span>
              </blockquote>
              <blockquote className="border-l border-rule-lit pl-5 text-[14px] italic leading-[1.7] text-dim">
                &ldquo;Once a malware infects a machine, any machine with shared credentials in the
                vicinity is infected within seconds.&rdquo;
                <span className="mark block pt-2 not-italic">— &ldquo;backups aren&rsquo;t simple&rdquo;, same day</span>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Honesty */}
        <section className="rule-t py-16">
          <div className="mark mb-5">[ what this is and is not ]</div>
          <div className="grid gap-px bg-rule md:grid-cols-3">
            {[
              ["City-level, not building-level", "No cloud provider publishes the coordinates of its buildings, so each region is placed at the city it documents. That is precise enough to tell 40 km from 4,000 km, and pretending otherwise would be invention."],
              ["A geometry, not an audit", "It knows what you tell it. It cannot see your replication lag, your restore times, or whether the backup you have never tested actually contains anything."],
              ["The radius is a floor", "The enclosing circle is the smallest one containing every copy, so any event at least that wide reaches all of them. Smaller events may still reach several."],
            ].map(([h, b]) => (
              <div key={h} className="bg-void px-5 py-6">
                <div className="display text-[19px] leading-tight">{h}</div>
                <p className="mt-2.5 text-[13px] leading-[1.65] text-faint">{b}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="rule-t py-8">
          <div className="mark flex flex-col gap-2 sm:flex-row sm:justify-between">
            <span>radius · mit · nothing leaves your browser</span>
            <span className="idle">[ end transmission ]</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
