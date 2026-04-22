import { Card, CardContent } from "@/components/ui/card";
import type { BeachActivity } from "@/lib/api/beach-activities";

interface BeachActivityCardProps {
  activity: BeachActivity;
  selected: boolean;
  onSelect: (activity: BeachActivity) => void;
}

export const BeachActivityCard = ({ activity, selected, onSelect }: BeachActivityCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
    }
    return `${mins}m`;
  };

  return (
    <Card
      onClick={() => onSelect(activity)}
      className={`h-full flex flex-col overflow-hidden cursor-pointer transition-all ${
        selected
          ? "ring-2 ring-accent shadow-lg"
          : "hover:shadow-lg"
      }`}
    >
      {/* Image */}
      {activity.image && (
        <img
          src={activity.image}
          alt={activity.name}
          className="rounded-lg w-full h-64 object-cover"
        />
      )}

      {/* Content */}
      <CardContent className="flex-grow p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-primary">{activity.name}</h3>
          {selected && (
            <span className="text-xs font-semibold text-accent ml-2 shrink-0">
              ✓ Selected
            </span>
          )}
        </div>
        <p className="text-muted text-sm mb-4 line-clamp-3">
          {activity.description}
        </p>

        {/* Activity Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted font-semibold uppercase">
              Price
            </span>
            <span className="text-primary font-bold">
              {formatPrice(activity.price)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted font-semibold uppercase">
              Duration
            </span>
            <span className="text-primary font-bold">
              {formatDuration(activity.duration)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted font-semibold uppercase">
              Capacity
            </span>
            <span className="text-primary font-bold">{activity.capacity}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
