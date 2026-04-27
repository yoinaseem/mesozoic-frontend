"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { StepNav } from "@/components/booking/StepNav";
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

export function RoomStep() {
  const {
    cart,
    addRoom,
    removeRoom,
    clearRooms,
    roomAlreadyExists,
    registerStepCommitter,
  } = useBookingCart();

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

  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState<number>(2);
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
    if (selectedHotelId === null || selectedRoomTypeId === null) return;
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

  const checkInDisabledDates = useMemo(() => {
    if (selectedHotelId === null || selectedRoomTypeId === null) return [];
    return availabilityDays.filter((d) => d.free <= 0).map((d) => d.date);
  }, [availabilityDays, selectedHotelId, selectedRoomTypeId]);

  // The latest check-out is the first fully-booked night >= check-in:
  // a guest can leave the morning of that day, but cannot sleep through it.
  const checkOutMax = useMemo(() => {
    if (
      selectedHotelId === null ||
      selectedRoomTypeId === null ||
      !checkIn ||
      availabilityDays.length === 0
    ) {
      return undefined;
    }
    const firstBlocked = availabilityDays.find(
      (d) => d.date >= checkIn && d.free <= 0,
    );
    return firstBlocked?.date;
  }, [availabilityDays, checkIn, selectedHotelId, selectedRoomTypeId]);

  const formIsTouched =
    selectedHotelId !== null ||
    selectedRoomTypeId !== null ||
    checkIn !== null ||
    checkOut !== null ||
    guests !== 2;

  const validateForm = (): boolean => {
    setError(null);
    if (!selectedHotel || !selectedRoomType) {
      setError("Pick a hotel and a room type to add the room.");
      return false;
    }
    if (!checkIn || !checkOut) {
      setError("Pick check-in and check-out dates.");
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
    if (
      !validateForm() ||
      !selectedHotel ||
      !selectedRoomType ||
      !checkIn ||
      !checkOut
    )
      return false;

    // Soft-warn (don't block) when the new room exactly matches one
    // already in the cart — two rooms of the same type for the same
    // dates is legitimate (parents + kids), but it's also a common
    // accidental double-click. Notify but allow.
    const duplicate = cart.rooms.some(
      (r) =>
        r.existingId === undefined &&
        r.hotel.id === selectedHotel.id &&
        r.roomType.id === selectedRoomType.id &&
        r.checkIn === checkIn &&
        r.checkOut === checkOut,
    );

    addRoom({
      hotel: selectedHotel,
      roomType: selectedRoomType,
      checkIn,
      checkOut,
      guests,
    });
    if (duplicate) {
      toast.warning(
        `Heads up: you already have a ${selectedRoomType.name} at ${selectedHotel.name} for these dates in your cart. Both will be booked unless you remove one.`,
      );
    } else {
      toast.success(
        `Added to cart: ${selectedHotel.name} · ${selectedRoomType.name} · ${checkIn} → ${checkOut}`,
      );
    }
    return true;
  };

  const resetForm = () => {
    setSelectedHotelId(null);
    setSelectedRoomTypeId(null);
    setHotelDetail(null);
    setHotelDetailFor(null);
    setCheckIn(null);
    setCheckOut(null);
    setGuests(2);
    setError(null);
  };

  // Refs for scroll-on-change UX. After a successful add we scroll the
  // form heading into view so the customer can SEE the form has reset
  // (without this, the cleared inputs sit below the fold and clicking
  // Save feels like it did nothing). On a new error we scroll the
  // error into view so it isn't hidden under the inputs.
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [error]);

  const handleAddAnother = () => {
    if (commitRoom()) {
      resetForm();
      formHeadingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Next handler:
  //  - If the form has user input, validate + commit, then advance.
  //  - If the form is untouched but at least one room is already in cart,
  //    just advance.
  //  - If the form is untouched and no rooms are in cart, error.
  const handleNext = (): boolean => {
    if (formIsTouched) {
      if (!commitRoom()) return false;
      resetForm();
      return true;
    }
    if (cart.rooms.length === 0) {
      setError("Add at least one room before continuing.");
      return false;
    }
    return true;
  };

  // Auto-commit hook for tab navigation. Same logic as handleNext minus
  // the min-room check (the stepper already locks downstream tabs when
  // no room is added). A ref-shim wraps the latest closure so the
  // registered function always sees fresh form state — assignment
  // happens in an effect (no deps) so it runs after every commit and
  // doesn't trip the react-hooks/refs rule that bans ref writes during
  // render.
  const tryCommitRef = useRef<() => boolean>(() => true);
  useEffect(() => {
    tryCommitRef.current = (): boolean => {
      if (!formIsTouched) return true;
      if (!commitRoom()) return false;
      resetForm();
      return true;
    };
  });

  useEffect(() => {
    registerStepCommitter("room", () => tryCommitRef.current());
    return () => registerStepCommitter("room", null);
  }, [registerStepCommitter]);

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
        <h3
          ref={formHeadingRef}
          className="text-base-color scroll-mt-24 text-sm font-semibold"
        >
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
                    // Toggle: clicking the active hotel deselects it so
                    // the customer can back out of the form without
                    // refreshing the page.
                    if (active) {
                      setSelectedHotelId(null);
                      setSelectedRoomTypeId(null);
                      setHotelDetail(null);
                      setHotelDetailFor(null);
                      setCheckIn(null);
                      setCheckOut(null);
                      return;
                    }
                    setSelectedHotelId(hotel.id);
                    setSelectedRoomTypeId(null);
                    setCheckIn(null);
                    setCheckOut(null);
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
                    onClick={() => {
                      // Toggle: clicking the active room type deselects.
                      if (active) {
                        setSelectedRoomTypeId(null);
                        setCheckIn(null);
                        setCheckOut(null);
                        return;
                      }
                      setSelectedRoomTypeId(rt.id);
                      setCheckIn(null);
                      setCheckOut(null);
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

      {error ? (
        <p
          ref={errorRef}
          className="scroll-mt-24 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Save & add another lives in the form area (not the StepNav
          footer) so it reads as a form action rather than navigation —
          the customer can stack rooms without ever leaving this step. */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={handleAddAnother}
        >
          <Plus className="size-4" aria-hidden />
          {cart.rooms.length === 0 ? "Save room" : "Save & add another"}
        </button>
        {/* Discard partially-filled form input — important when the
            customer has rooms in cart, clicked "Add another room",
            started filling, then changed their mind. */}
        {formIsTouched ? (
          <button
            type="button"
            className="text-base-color hover:bg-base/40 rounded-lg border border-base px-4 py-2 text-sm font-semibold transition-colors"
            onClick={resetForm}
          >
            Cancel
          </button>
        ) : null}
      </div>

      <StepNav
        onNext={handleNext}
        leadingActions={
          cart.rooms.length > 0 && !roomAlreadyExists ? (
            <button
              type="button"
              className="text-sm font-semibold text-danger hover:opacity-80"
              onClick={clearRooms}
            >
              Clear all rooms
            </button>
          ) : null
        }
      />
    </section>
  );
}
