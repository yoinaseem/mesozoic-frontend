"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import { getHotel, listHotels, listRooms } from "@/lib/api/hotels";
import type { Hotel, Room, RoomType } from "@/types/booking";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function RoomStep() {
  const { cart, setRoom } = useBookingCart();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [hotelsError, setHotelsError] = useState<string | null>(null);

  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(
    cart.room?.hotel.id ?? null,
  );
  const [hotelDetail, setHotelDetail] = useState<Hotel | null>(null);
  const [loadingHotel, setLoadingHotel] = useState(false);

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(
    cart.room?.roomType.id ?? null,
  );

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    cart.room?.room.id ?? null,
  );

  const [checkIn, setCheckIn] = useState<string>(
    cart.room?.checkIn ?? todayIso(),
  );
  const [checkOut, setCheckOut] = useState<string>(
    cart.room?.checkOut ?? tomorrowIso(),
  );
  const [guests, setGuests] = useState<number>(cart.room?.guests ?? 2);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingHotels(true);
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
    if (selectedHotelId === null) {
      setHotelDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingHotel(true);
    getHotel(selectedHotelId)
      .then((res) => {
        if (cancelled) return;
        setHotelDetail(res.data);
        setLoadingHotel(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingHotel(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedHotelId]);

  useEffect(() => {
    if (selectedHotelId === null) {
      setRooms([]);
      return;
    }
    let cancelled = false;
    setLoadingRooms(true);
    listRooms(selectedHotelId)
      .then((res) => {
        if (cancelled) return;
        setRooms(res.data);
        setLoadingRooms(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingRooms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedHotelId]);

  const roomTypes: RoomType[] = hotelDetail?.room_types ?? [];
  const roomsForType = useMemo(
    () =>
      selectedRoomTypeId === null
        ? []
        : rooms.filter((r) => r.room_type_id === selectedRoomTypeId),
    [rooms, selectedRoomTypeId],
  );

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId) ?? null;
  const selectedRoomType =
    roomTypes.find((t) => t.id === selectedRoomTypeId) ?? null;
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  const handleConfirm = () => {
    setError(null);
    if (!selectedHotel || !selectedRoomType || !selectedRoom) {
      setError("Pick a hotel, room type, and room number to continue.");
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
      room: selectedRoom,
      checkIn,
      checkOut,
      guests,
    });
  };

  const handleClear = () => {
    setRoom(null);
    setSelectedHotelId(null);
    setSelectedRoomTypeId(null);
    setSelectedRoomId(null);
    setError(null);
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">Room booking</h2>
        <p className="text-muted text-sm">
          Every stay on the isle starts with a room. Pick your hotel and dates
          below to unlock ferries, theme parks, and beach activities.
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
                    setSelectedRoomId(null);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-base hover:border-primary"
                  }`}
                  aria-pressed={active}
                >
                  <p className="font-semibold text-primary">{hotel.name}</p>
                  <p className="text-muted mt-1 text-sm">{hotel.address ?? "—"}</p>
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
                    onClick={() => {
                      setSelectedRoomTypeId(rt.id);
                      setSelectedRoomId(null);
                    }}
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

      {selectedRoomTypeId !== null ? (
        <div className="space-y-2">
          <label
            htmlFor="room-select"
            className="block text-sm font-medium text-base-color"
          >
            Room number
          </label>
          {loadingRooms ? (
            <p className="text-muted text-sm">Loading rooms…</p>
          ) : roomsForType.length === 0 ? (
            <p className="text-muted text-sm">No rooms available for this type.</p>
          ) : (
            <select
              id="room-select"
              value={selectedRoomId ?? ""}
              onChange={(e) =>
                setSelectedRoomId(e.target.value ? Number(e.target.value) : null)
              }
              className="border-base bg-surface focus:ring-primary h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2"
            >
              <option value="">Select a room…</option>
              {roomsForType.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_no}
                </option>
              ))}
            </select>
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
          <Input
            id="check-in"
            type="date"
            className="mt-2"
            min={todayIso()}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="check-out"
            className="block text-sm font-medium text-base-color"
          >
            Check-out
          </label>
          <Input
            id="check-out"
            type="date"
            className="mt-2"
            min={checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
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
