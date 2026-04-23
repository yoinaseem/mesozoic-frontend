import { Card, CardContent } from "@/components/ui/card";
import type { BeachActivity } from "@/types/booking";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?q=80&w=800",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800",
  "https://images.unsplash.com/photo-1500514966906-fe245eea9344?q=80&w=800",
  "https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=800",
  "https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?q=80&w=800",
  "https://images.unsplash.com/photo-1530053969600-caed2596d242?q=80&w=800",
];

interface BeachActivityCardProps {
  activity: BeachActivity;
}

export const BeachActivityCard = ({ activity }: BeachActivityCardProps) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
    return `${mins}m`;
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <img
        src={activity.image || FALLBACK_IMAGES[(activity.id - 1) % FALLBACK_IMAGES.length]}
        alt={activity.name}
        className="w-full h-48 object-cover"
      />

      <CardContent className="flex-grow p-6">
        <h3 className="text-xl font-bold text-primary mb-2">{activity.name}</h3>
        <p className="text-muted text-sm mb-4 line-clamp-3">{activity.description}</p>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted font-semibold uppercase">Price</span>
            <span className="text-primary font-bold">{formatPrice(activity.price)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted font-semibold uppercase">Duration</span>
            <span className="text-primary font-bold">{formatDuration(activity.duration)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted font-semibold uppercase">Capacity</span>
            <span className="text-primary font-bold">{activity.capacity}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
