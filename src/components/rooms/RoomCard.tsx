import Link from "next/link";
import Image from "next/image";

export type RoomType = {
  id: number;
  hotelId: number;
  name: string;
  description: string | null;
  image: string | null;
  capacity: number;
  price: number;
  amenities: string[];
};

type RoomCardProps = {
  roomType: RoomType;
};

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export function RoomCard({ roomType }: RoomCardProps) {
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative h-44 w-full overflow-hidden rounded-lg">
        <Image
          src={roomType.image ?? "/img/banner.avif"}
          alt={roomType.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-xl font-bold text-primary">{roomType.name}</h3>
        <p className="mt-2 text-muted">{roomType.description ?? "No description available yet."}</p>
        <p className="mt-4 text-base-color">
          Capacity: <span className="font-semibold text-primary">{roomType.capacity}</span>
        </p>
        <p className="mt-1 text-base-color">
          Price per night:{" "}
          <span className="font-semibold text-primary">{formatPrice(roomType.price)}</span>
        </p>
        <div className="mt-4">
          <Link href={`/booking?roomTypeId=${roomType.id}`} className="btn-accent inline-block">
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}
