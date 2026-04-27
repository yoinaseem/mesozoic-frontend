import { Card, CardContent } from "@/components/ui/card";
import { FALLBACK_IMAGE, resolveImage } from "@/lib/imageSrc";
import type { BeachActivity } from "@/types/booking";

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
        src={resolveImage(activity) || FALLBACK_IMAGE}
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
