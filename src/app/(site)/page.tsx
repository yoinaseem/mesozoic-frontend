import { AccommodationFeature } from "@/components/home/AccommodationFeature";
import { BeachFeature } from "@/components/home/BeachFeature";
import HeroBanner from "@/components/home/HeroBanner";
import { KingdomFeature } from "@/components/home/KingdomFeature";
import { MomentsCarousel } from "@/components/home/MomentsCarousel";
import { PlanCta } from "@/components/home/PlanCta";
import { WelcomeStrip } from "@/components/home/WelcomeStrip";
import { WhyMesozoic } from "@/components/home/WhyMesozoic";
import { fetchBeachActivities } from "@/lib/api/server/beach-activities";
import { fetchHotels } from "@/lib/api/server/hotels";
import { fetchParkActivities } from "@/lib/api/server/park-activities";

export const revalidate = 300;

async function safeFetch<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [hotels, parkActivities, beachActivities] = await Promise.all([
    safeFetch(fetchHotels),
    safeFetch(fetchParkActivities),
    safeFetch(fetchBeachActivities),
  ]);

  return (
    <>
      <HeroBanner />
      <WelcomeStrip
        hotelCount={hotels.length}
        parkActivityCount={parkActivities.length}
        beachActivityCount={beachActivities.length}
      />
      <MomentsCarousel />
      <AccommodationFeature hotels={hotels} />
      <KingdomFeature activities={parkActivities} />
      <BeachFeature activities={beachActivities} />
      <WhyMesozoic />
      <PlanCta />
    </>
  );
}
