import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking | Mesozoic Isle",
  description: "Book your Mesozoic Isle stay, rooms, and adventures.",
};

type BookingPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const summary =
    typeof params.room === "string"
      ? `Room selection: ${params.room}`
      : typeof params.type === "string"
        ? `Room type: ${params.type.replace(/-/g, " ")}`
        : null;

  return (
    <div className="bg-base min-h-full">
      <section className="pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-5xl font-bold text-primary">Booking</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Start your reservation here. Full date and guest flow will connect to the backend
            when your API is ready—this page confirms you arrived from Rooms.
          </p>
          {summary ? (
            <p className="mt-4 text-base-color">
              <span className="font-semibold text-primary">Selection:</span> {summary}
            </p>
          ) : null}
          <p className="mt-8">
            <Link href="/rooms" className="btn-primary inline-block">
              Back to Rooms
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
