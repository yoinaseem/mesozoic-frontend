"use client";

import { useEffect, useMemo, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import {
  getHotel,
  getHotelAvailabilityDaily,
  listHotels,
  type HotelAvailabilityDailyDay,
} from "@/lib/api/hotels";
import type { Hotel, RoomType } from "@/types/booking";

const AVAILABILITY_WINDOW_DAYS = 90;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function AnchoredRoomSummary() {
  const { cart, reset } = useBookingCart();
  if (!cart.room) return null;
  return (
    <section className="card space-y-4">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">
          Room — already booked
        </h2>
        <p className="text-muted text-sm">
          We&rsquo;re adding to your existing trip. The room below is already
          confirmed; pick activities from the steps above.
        </p>
      </header>

      <dl className="border-base divide-base divide-y rounded-lg border text-sm">
        <div className="flex justify-between px-4 py-2">
          <dt className="text-muted">Hotel</dt>
          <dd className="font-medium">{cart.room.hotel.name}</dd>
        </div>
        <div className="flex justify-between px-4 py-2">
          <dt className="text-muted">Room type</dt>
          <dd className="font-medium">{cart.room.roomType.name}</dd>
        </div>
        <div className="flex justify-between px-4 py-2">
          <dt className="text-muted">Check-in</dt>
          <dd className="font-medium">{cart.room.checkIn}</dd>
        </div>
        <div className="flex justify-between px-4 py-2">
          <dt className="text-muted">Check-out</dt>
          <dd className="font-medium">{cart.room.checkOut}</dd>
        </div>
        <div className="flex justify-between px-4 py-2">
          <dt className="text-muted">Guests</dt>
          <dd className="font-medium">{cart.room.guests}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="text-sm font-semibold text-danger hover:opacity-80"
        onClick={reset}
      >
        Start a new trip instead
      </button>
    </section>
  );
}

export function RoomStep() {
  const { cart, setRoom, roomAlreadyExists } = useBookingCart();

  if (roomAlreadyExists) {
    return <AnchoredRoomSummary />;
  }

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [hotelsError, setHotelsError] = useState<string | null>(null);

  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(
    cart.room?.hotel.id ?? null,
  );
  const [hotelDetail, setHotelDetail] = useState<Hotel | null>(null);
  const [hotelDetailFor, setHotelDetailFor] = useState<number | null>(null);
  const loadingHotel =
    selectedHotelId !== null && hotelDetailFor !== selectedHotelId;

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(
    cart.room?.roomType.id ?? null,
  );

  const [checkIn, setCheckIn] = useState<string | null>(
    cart.room?.checkIn ?? null,
  );
  const [checkOut, setCheckOut] = useState<string | null>(
    cart.room?.checkOut ?? null,
  );
  const [guests, setGuests] = useState<number>(cart.room?.guests ?? 2);
  const [error, setError] = useState<string | null>(null);

  const [availabilityDays, setAvailabilityDays] = useState<
    HotelAvailabilityDailyDay[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    listHotels()
      .then((res) => {
        if (cancelled) return;
        setHotels(res.data);
        setLoadingHotels(false);
      })
      .catch(() => {
        if (cancelled) return;
        setHotelsError("Could not load hotels.");
        setLoadingHotels(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedHotelId === null) return;
    let cancelled = false;
    const hotelId = selectedHotelId;
    getHotel(hotelId)
      .then((res) => {
        if (cancelled) return;
        setHotelDetail(res.data);
        setHotelDetailFor(hotelId);
      })
      .catch(() => {
        if (cancelled) return;
        setHotelDetailFor(hotelId);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedHotelId]);

  useEffect(() => {
    if (selectedHotelId === null || selectedRoomTypeId === null) {
      setAvailabilityDays([]);
      return;
    }
    let cancelled = false;
    const hotelId = selectedHotelId;
    const roomTypeId = selectedRoomTypeId;
    getHotelAvailabilityDaily(
      hotelId,
      todayIso(),
      isoDaysFromNow(AVAILABILITY_WINDOW_DAYS),
    )
      .then((res) => {
        if (cancelled) return;
        const rt = res.data.room_types.find(
          (r) => r.room_type_id === roomTypeId,
        );
        setAvailabilityDays(rt?.days ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailabilityDays([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedHotelId, selectedRoomTypeId]);

  const roomTypes: RoomType[] = hotelDetail?.room_types ?? [];

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId) ?? null;
  const selectedRoomType =
    roomTypes.find((t) => t.id === selectedRoomTypeId) ?? null;

  const checkInDisabledDates = useMemo(
    () =>
      availabilityDays.filter((d) => d.free <= 0).map((d) => d.date),
    [availabilityDays],
  );

  // The latest check-out is the first fully-booked night >= check-in:
  // a guest can leave the morning of that day, but cannot sleep through it.
  const checkOutMax = useMemo(() => {
    if (!checkIn || availabilityDays.length === 0) return undefined;
    const firstBlocked = availabilityDays.find(
      (d) => d.date >= checkIn && d.free <= 0,
    );
    return firstBlocked?.date;
  }, [availabilityDays, checkIn]);

  const handleConfirm = () => {
    setError(null);
    if (!selectedHotel || !selectedRoomType) {
      setError("Pick a hotel and a room type to continue.");
      return;
    }
    if (!checkIn || !checkOut) {
      setError("Pick check-in and check-out dates.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (
      selectedRoomType.capacity !== null &&
      guests > selectedRoomType.capacity
    ) {
      setError(
        `This room type sleeps up to ${selectedRoomType.capacity} guests.`,
      );
      return;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return;
    }
    setRoom({
      hotel: selectedHotel,
      roomType: selectedRoomType,
      checkIn,
      checkOut,
      guests,
    });
  };

  const handleClear = () => {
    setRoom(null);
    setSelectedHotelId(null);
    setSelectedRoomTypeId(null);
    setError(null);
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">Room booking</h2>
        <p className="text-muted text-sm">
          Every stay on the isle starts with a room. Pick your hotel, room type,
          and dates — we&rsquo;ll assign the actual room number for you.
        </p>
      </header>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-base-color">
          Hotel
        </label>
        {loadingHotels ? (
          <p className="text-muted text-sm">Loading hotels…</p>
        ) : hotelsError ? (
          <p className="text-sm text-danger">{hotelsError}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {hotels.map((hotel) => {
              const active = selectedHotelId === hotel.id;
              return (
                <button
                  key={hotel.id}
                  type="button"
                  onClick={() => {
                    setSelectedHotelId(hotel.id);
                    setSelectedRoomTypeId(null);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-base hover:border-primary"
                  }`}
                  aria-pressed={active}
                >
                  <p className="font-semibold text-primary">{hotel.name}</p>
                  <p className="text-muted mt-1 text-sm">
                    {hotel.address ?? "—"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedHotelId !== null ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-base-color">
            Room type
          </label>
          {loadingHotel ? (
            <p className="text-muted text-sm">Loading room types…</p>
          ) : roomTypes.length === 0 ? (
            <p className="text-muted text-sm">
              This hotel has no published room types yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {roomTypes.map((rt) => {
                const active = selectedRoomTypeId === rt.id;
                return (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => setSelectedRoomTypeId(rt.id)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-base hover:border-primary"
                    }`}
                    aria-pressed={active}
                  >
                    <p className="font-semibold text-primary">{rt.name}</p>
                    <p className="text-muted mt-1 text-sm">
                      Sleeps {rt.capacity ?? "—"}
                      {rt.price ? ` · $${rt.price}/night` : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="check-in"
            className="block text-sm font-medium text-base-color"
          >
            Check-in
          </label>
          <DatePicker
            id="check-in"
            className="mt-2"
            min={todayIso()}
            value={checkIn}
            onChange={setCheckIn}
            placeholder="Select check-in"
            disabledDates={checkInDisabledDates}
          />
        </div>
        <div>
          <label
            htmlFor="check-out"
            className="block text-sm font-medium text-base-color"
          >
            Check-out
          </label>
          <DatePicker
            id="check-out"
            className="mt-2"
            min={checkIn ?? undefined}
            max={checkOutMax}
            value={checkOut}
            onChange={setCheckOut}
            placeholder="Select check-out"
          />
        </div>
        <div>
          <label
            htmlFor="guests"
            className="block text-sm font-medium text-base-color"
          >
            Guests
          </label>
          <Input
            id="guests"
            type="number"
            min={1}
            max={selectedRoomType?.capacity ?? 10}
            className="mt-2"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={handleConfirm}>
          {cart.room ? "Update room booking" : "Confirm room booking"}
        </button>
        {cart.room ? (
          <button
            type="button"
            className="text-sm font-semibold text-danger hover:opacity-80"
            onClick={handleClear}
          >
            Clear room booking
          </button>
        ) : null}
      </div>
    </section>
  );
}
