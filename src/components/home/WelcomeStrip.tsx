import { Building2, Mountain, Ship, Waves } from "lucide-react";

interface WelcomeStripProps {
  hotelCount: number;
  parkActivityCount: number;
  beachActivityCount: number;
}

export function WelcomeStrip({
  hotelCount,
  parkActivityCount,
  beachActivityCount,
}: WelcomeStripProps) {
  const stats = [
    {
      icon: Building2,
      value: hotelCount > 0 ? `${hotelCount}+` : "—",
      label: "Hotels",
    },
    {
      icon: Mountain,
      value: parkActivityCount > 0 ? `${parkActivityCount}+` : "—",
      label: "Kingdom Activities",
    },
    {
      icon: Waves,
      value: beachActivityCount > 0 ? `${beachActivityCount}+` : "—",
      label: "Beach Adventures",
    },
    { icon: Ship, value: "Daily", label: "Ferry Routes" },
  ];

  return (
    <section className="bg-[#e7e7eb] py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="bg-primary grid grid-cols-2 overflow-hidden rounded-2xl shadow-xl md:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="group/stat flex flex-col items-center gap-2 px-4 py-8 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-deep/35 active:-translate-y-0.5 active:bg-primary-deep/35"
            >
              <Icon
                className="text-accent size-6 transition-transform duration-300 group-hover/stat:scale-110 group-hover/stat:-rotate-3 group-active/stat:scale-110 group-active/stat:-rotate-3"
                aria-hidden
              />
              <span className="font-heading text-3xl font-bold text-white">
                {value}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
