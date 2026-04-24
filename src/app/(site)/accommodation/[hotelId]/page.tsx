import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";
import { RoomCard } from "@/components/rooms/RoomCard";
import { fetchHotel } from "@/lib/api/server/hotels";

export const revalidate = 300;

const FALLBACK_IMAGE = "/img/banner.avif";

type PageProps = {
  params: Promise<{ hotelId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { hotelId } = await params;
  const id = Number(hotelId);
  if (!Number.isFinite(id)) return { title: "Hotel | Mesozoic Isle" };

  const hotel = await fetchHotel(id);
  if (!hotel) return { title: "Hotel not found | Mesozoic Isle" };

  return {
    title: `${hotel.name} | Mesozoic Isle`,
    description:
      hotel.description?.slice(0, 160) ??
      `Explore rooms and amenities at ${hotel.name}, a Mesozoic Isle hotel.`,
  };
}

export default async function HotelDetailsPage({ params }: PageProps) {
  const { hotelId } = await params;
  const id = Number(hotelId);
  if (!Number.isFinite(id)) notFound();

  const hotel = await fetchHotel(id);
  if (!hotel) notFound();

  const roomTypes = hotel.room_types ?? [];
  const amenities = hotel.amenities ?? [];

  return (
    <div className="bg-base min-h-screen pt-[72px]">
      <section className="relative">
        <div className="relative h-72 md:h-96 w-full overflow-hidden">
          <img
            src={hotel.image || FALLBACK_IMAGE}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-16 relative">
          <Link
            href="/accommodation"
            className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            Back to hotels
          </Link>

          <div className="card">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">{hotel.name}</h1>
            {hotel.address ? (
              <p className="mt-3 flex items-center gap-1.5 text-muted">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                <span>{hotel.address}</span>
              </p>
            ) : null}
            {hotel.description ? (
              <p className="mt-4 text-base-color leading-relaxed">{hotel.description}</p>
            ) : null}

            {amenities.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
                  Amenities
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="text-sm px-3 py-1 rounded-full border border-base bg-base/40 text-base-color capitalize"
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-primary">Available room types</h2>
          <p className="mt-2 text-muted">
            Pick a room to continue to the booking form.
          </p>

          {roomTypes.length === 0 ? (
            <div className="mt-12 flex justify-center">
              <p className="text-muted">No room types available for this hotel yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roomTypes.map((roomType) => (
                <RoomCard key={roomType.id} roomType={roomType} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
