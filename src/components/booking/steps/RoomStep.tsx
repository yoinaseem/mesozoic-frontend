"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { StepNav } from "@/components/booking/StepNav";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import { getHotel, listHotels } from "@/lib/api/hotels";
import type { Hotel, RoomType } from "@/types/booking";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function RoomStep() {
  const { cart, addRoom, removeRoom, clearRooms, roomAlreadyExists } =
    useBookingCart();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [hotelsError, setHotelsError] = useState<string | null>(null);

  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [hotelDetail, setHotelDetail] = useState<Hotel | null>(null);
  const [hotelDetailFor, setHotelDetailFor] = useState<number | null>(null);
  const loadingHotel =
    selectedHotelId !== null && hotelDetailFor !== selectedHotelId;

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(
    null,
  );

  const [checkIn, setCheckIn] = useState<string>(todayIso());
  const [checkOut, setCheckOut] = useState<string>(tomorrowIso());
  const [guests, setGuests] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);

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

  const roomTypes: RoomType[] = hotelDetail?.room_types ?? [];

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId) ?? null;
  const selectedRoomType =
    roomTypes.find((t) => t.id === selectedRoomTypeId) ?? null;

  const formIsTouched =
    selectedHotelId !== null ||
    selectedRoomTypeId !== null ||
    checkIn !== todayIso() ||
    checkOut !== tomorrowIso() ||
    guests !== 2;

  const validateForm = (): boolean => {
    setError(null);
    if (!selectedHotel || !selectedRoomType) {
      setError("Pick a hotel and a room type to add the room.");
      return false;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
      return false;
    }
    if (
      selectedRoomType.capacity !== null &&
      guests > selectedRoomType.capacity
    ) {
      setError(
        `This room type sleeps up to ${selectedRoomType.capacity} guests.`,
      );
      return false;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return false;
    }
    return true;
  };

  const commitRoom = (): boolean => {
    if (!validateForm() || !selectedHotel || !selectedRoomType) return false;
    addRoom({
      hotel: selectedHotel,
      roomType: selectedRoomType,
      checkIn,
      checkOut,
      guests,
    });
    return true;
  };

  const resetForm = () => {
    setSelectedHotelId(null);
    setSelectedRoomTypeId(null);
    setHotelDetail(null);
    setHotelDetailFor(null);
    setCheckIn(todayIso());
    setCheckOut(tomorrowIso());
    setGuests(2);
    setError(null);
  };

  const handleAddAnother = () => {
    if (commitRoom()) {
      resetForm();
    }
  };

  // Next handler:
  //  - If the form has user input, validate + commit, then advance.
  //  - If the form is untouched but at least one room is already in cart,
  //    just advance.
  //  - If the form is untouched and no rooms are in cart, error.
  const handleNext = (): boolean => {
    if (formIsTouched) {
      return commitRoom();
    }
    if (cart.rooms.length === 0) {
      setError("Add at least one room before continuing.");
      return false;
    }
    return true;
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">Room booking</h2>
        <p className="text-muted text-sm">
          Add one or more rooms to your trip. We&rsquo;ll pick the actual room
          number for you. Need a second room for the family? Just add another.
        </p>
      </header>

      {cart.rooms.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-base-color text-sm font-semibold">Rooms on this trip</h3>
          <ul className="border-base divide-base divide-y rounded-lg border">
            {cart.rooms.map((room, index) => (
              <li
                key={`${room.hotel.id}-${room.roomType.id}-${room.checkIn}-${index}`}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="space-y-0.5 text-sm">
                  <p className="text-primary font-semibold">
                    {room.hotel.name} · {room.roomType.name}
                  </p>
                  <p className="text-muted">
                    {room.checkIn} → {room.checkOut} · {room.guests} guest
                    {room.guests === 1 ? "" : "s"}
                    {room.existingId !== undefined ? " · already booked" : ""}
                  </p>
                </div>
                {room.existingId === undefined ? (
                  <button
                    type="button"
                    onClick={() => removeRoom(index)}
                    className="text-muted hover:text-danger flex items-center gap-1 text-xs font-semibold"
                    aria-label="Remove room"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-base-color text-sm font-semibold">
          {cart.rooms.length === 0 ? "Pick a room" : "Add another room"}
        </h3>
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
            min={checkIn}
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

      <StepNav
        onNext={handleNext}
        leadingActions={
          <>
            <button
              type="button"
              className="border-primary text-primary hover:bg-primary/5 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              onClick={handleAddAnother}
            >
              {cart.rooms.length === 0
                ? "Add this room"
                : "Add another room"}
            </button>
            {cart.rooms.length > 0 && !roomAlreadyExists ? (
              <button
                type="button"
                className="text-sm font-semibold text-danger hover:opacity-80"
                onClick={clearRooms}
              >
                Clear all rooms
              </button>
            ) : null}
          </>
        }
      />
    </section>
  );
}
