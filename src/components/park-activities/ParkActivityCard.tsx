import { Card, CardContent } from "@/components/ui/card";

export interface ParkActivityCardData {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null;
  duration?: number | null;
  max_capacity?: number | null;
  image?: string | null;
  imageUrl?: string | null;
}

interface ParkActivityCardProps {
  activity: ParkActivityCardData;
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1615632134011-b2f62e6fe2df?q=80&w=800",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=800",
  "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
  "https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=800",
];

export function ParkActivityCard({ activity }: ParkActivityCardProps) {
  const formatPrice = (price: number | null | undefined) =>
    price == null
      ? "Included"
      : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  const formatDuration = (minutes: number | null | undefined) => {
    if (minutes == null) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
    return `${mins}m`;
  };

  const imageSrc =
    activity.imageUrl ||
    activity.image ||
    FALLBACK_IMAGES[(activity.id - 1) % FALLBACK_IMAGES.length];

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <img
        src={imageSrc}
        alt={activity.name}
        className="w-full h-48 object-cover"
      />

      <CardContent className="flex flex-col flex-grow p-6">
        <h3 className="text-xl font-bold text-primary mb-2">{activity.name}</h3>

        {activity.description ? (
          <p className="text-muted text-sm mb-4 line-clamp-3">{activity.description}</p>
        ) : null}

        <div className="grid grid-cols-3 gap-4 text-sm mb-6">
          <div className="flex flex-col">
            <span className="text-xs text-muted font-semibold uppercase">Price</span>
            <span className="text-primary font-bold">{formatPrice(activity.price)}</span>
          </div>
          {activity.duration ? (
            <div className="flex flex-col">
              <span className="text-xs text-muted font-semibold uppercase">Duration</span>
              <span className="text-primary font-bold">{formatDuration(activity.duration)}</span>
            </div>
          ) : null}
          {activity.max_capacity ? (
            <div className="flex flex-col">
              <span className="text-xs text-muted font-semibold uppercase">Capacity</span>
              <span className="text-primary font-bold">{activity.max_capacity}</span>
            </div>
          ) : null}
        </div>

      </CardContent>
    </Card>
  );
}
