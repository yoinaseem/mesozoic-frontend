import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Hotel } from "@/types/booking";

const FALLBACK_IMAGE = "/img/banner.avif";
const VISIBLE_AMENITIES = 4;

interface HotelCardProps {
  hotel: Hotel;
}

export function HotelCard({ hotel }: HotelCardProps) {
  const amenities = hotel.amenities ?? [];
  const shownAmenities = amenities.slice(0, VISIBLE_AMENITIES);
  const extraCount = Math.max(0, amenities.length - shownAmenities.length);

  return (
    <Link
      href={`/accommodation/${hotel.id}`}
      aria-label={`View details for ${hotel.name}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
    >
      <Card className="h-full flex flex-col overflow-hidden transition-shadow group-hover:shadow-lg">
        <img
          src={hotel.image || FALLBACK_IMAGE}
          alt={hotel.name}
          className="w-full h-48 object-cover"
        />

        <CardContent className="flex flex-col flex-grow p-6">
          <h3 className="text-xl font-bold text-primary mb-1 group-hover:underline underline-offset-4">
            {hotel.name}
          </h3>

          {hotel.address ? (
            <p className="flex items-center gap-1.5 text-muted text-sm mb-3">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden />
              <span className="truncate">{hotel.address}</span>
            </p>
          ) : null}

          {hotel.description ? (
            <p className="text-muted text-sm mb-4 line-clamp-3">{hotel.description}</p>
          ) : null}

          {shownAmenities.length > 0 ? (
            <ul className="mt-auto flex flex-wrap gap-2 pt-2">
              {shownAmenities.map((amenity) => (
                <li
                  key={amenity}
                  className="text-xs px-2.5 py-1 rounded-full border border-base bg-base/40 text-base-color capitalize"
                >
                  {amenity}
                </li>
              ))}
              {extraCount > 0 ? (
                <li className="text-xs px-2.5 py-1 rounded-full border border-base text-muted">
                  +{extraCount} more
                </li>
              ) : null}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
