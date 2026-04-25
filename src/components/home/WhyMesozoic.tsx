import Link from "next/link";
import { ArrowRight, Compass, Shield, Sparkles } from "lucide-react";

const PILLARS = [
  {
    icon: Compass,
    title: "Curated end-to-end",
    body: "Stays, attractions, and ferries arranged in one journey — no juggling tabs.",
  },
  {
    icon: Shield,
    title: "Safety, woven in",
    body: "Every guided experience is led by trained experts with rigorous protocols.",
  },
  {
    icon: Sparkles,
    title: "Built for wonder",
    body: "From dawn dives to torchlit dinners, the moments find you.",
  },
];

export function WhyMesozoic() {
  return (
    <section className="bg-base border-base border-t py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-[0.28em]">
            Why Mesozoic Isle
          </p>
          <h2 className="font-heading text-primary mt-6 text-4xl font-bold leading-tight md:text-5xl">
            One island, one journey.
          </h2>
          <div
            className="bg-primary mx-auto mt-5 h-1 w-20 rounded-full"
            aria-hidden
          />
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="border-base bg-surface rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="bg-primary/10 inline-flex size-12 items-center justify-center rounded-xl">
                <Icon className="text-primary size-6" aria-hidden />
              </div>
              <h3 className="font-heading text-primary mt-5 text-xl font-bold">
                {title}
              </h3>
              <div
                className="bg-primary mt-3 h-px w-12 rounded-full"
                aria-hidden
              />
              <p className="text-base-color mt-4 text-base font-bold leading-relaxed">
                {body}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <Link
            href="/about"
            className="text-primary inline-flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
          >
            Read our full story
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
