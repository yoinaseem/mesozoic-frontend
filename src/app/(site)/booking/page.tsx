import type { Metadata } from "next";
import Link from "next/link";
import { getRoomTypeById, roomTypes } from "@/components/rooms/rooms-data";

export const metadata: Metadata = {
  title: "Booking | Mesozoic Isle",
  description: "Book your Mesozoic Isle stay, rooms, and adventures.",
};

type BookingPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const selectedRoomTypeIdRaw =
    typeof params.roomTypeId === "string" ? Number.parseInt(params.roomTypeId, 10) : null;
  const selectedRoomType =
    selectedRoomTypeIdRaw && Number.isFinite(selectedRoomTypeIdRaw)
      ? getRoomTypeById(selectedRoomTypeIdRaw)
      : null;

  const fieldClass =
    "mt-1 w-full rounded-lg border border-base bg-surface px-3 py-2 text-base text-base-color placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

  return (
    <div className="bg-base min-h-full">
      <section className="pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-5xl font-bold text-primary">Room Booking</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Submit your booking request with dates and guest details. This form maps directly to
            room type data from the accommodation catalog.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h2 className="text-3xl font-bold text-base-color">Booking details</h2>
              <form className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="guestName" className="text-sm font-semibold text-base-color">
                    Full name
                  </label>
                  <input id="guestName" type="text" className={fieldClass} placeholder="Your full name" />
                </div>
                <div>
                  <label htmlFor="guestEmail" className="text-sm font-semibold text-base-color">
                    Email
                  </label>
                  <input
                    id="guestEmail"
                    type="email"
                    className={fieldClass}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="checkIn" className="text-sm font-semibold text-base-color">
                    Check-in
                  </label>
                  <input id="checkIn" type="date" className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="checkOut" className="text-sm font-semibold text-base-color">
                    Check-out
                  </label>
                  <input id="checkOut" type="date" className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="roomType" className="text-sm font-semibold text-base-color">
                    Room type
                  </label>
                  <select
                    id="roomType"
                    defaultValue={selectedRoomType ? String(selectedRoomType.id) : ""}
                    className={fieldClass}
                  >
                    <option value="">Select a room type</option>
                    {roomTypes.map((roomType) => (
                      <option key={roomType.id} value={roomType.id}>
                        {roomType.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="guestCount" className="text-sm font-semibold text-base-color">
                    Guests
                  </label>
                  <input
                    id="guestCount"
                    type="number"
                    min={1}
                    className={fieldClass}
                    placeholder="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="specialNotes" className="text-sm font-semibold text-base-color">
                    Special requests
                  </label>
                  <textarea
                    id="specialNotes"
                    className={fieldClass}
                    placeholder="Accessibility, child bed, late check-in, etc."
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2">
                  <button type="button" className="btn-accent">
                    Submit Booking Request
                  </button>
                </div>
              </form>
            </div>

            <aside className="card">
              <h3 className="text-xl font-bold text-primary">Selected room type</h3>
              {selectedRoomType ? (
                <div className="mt-4">
                  <p className="text-base-color font-semibold">{selectedRoomType.name}</p>
                  <p className="mt-2 text-muted">
                    {selectedRoomType.description ?? "No description available yet."}
                  </p>
                  <p className="mt-3 text-base-color">Capacity: {selectedRoomType.capacity}</p>
                  <p className="mt-1 text-base-color">
                    Price per night: ${selectedRoomType.price.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-muted">
                  No room type selected yet. Pick one from the form or choose Book Now from the
                  accommodation page.
                </p>
              )}

              <p className="mt-6">
                <Link href="/accommodation" className="btn-primary inline-block">
                  Back to Accommodation
                </Link>
              </p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
