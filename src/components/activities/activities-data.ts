export type ActivityCTA = "Book Now" | "Learn More";

export type ActivityItem = {
  name: string;
  description: string;
  cta: ActivityCTA;
  /** Theming photo — replace with files under /public/images/activities/ when you have park assets */
  imageSrc: string;
  imageAlt: string;
};

export type ActivityCategory = {
  title: string;
  activities: ActivityItem[];
};

export const activityCategories: ActivityCategory[] = [
  {
    title: "🦕 Dinosaur Experiences",
    activities: [
      {
        name: "Dinosaur Safari Jeep Tour",
        description:
          "Guided jeep ride through herbivore enclosures with a paleo-ranger narration.",
        cta: "Book Now",
        imageSrc:
          "https://images.unsplash.com/photo-1547036967-23d11aaca7dc?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Open safari vehicle on a road through green parkland",
      },
      {
        name: "Raptor Encounter",
        description: "Meet velociraptors with an expert handler at a safe viewing distance.",
        cta: "Learn More",
        imageSrc:
          "https://images.unsplash.com/photo-1559251606-c776832baf8f?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Close-up of a dinosaur model head with detailed scales",
      },
      {
        name: "T-Rex Feeding Show",
        description: "Arena spectacle as the park’s star predator claims its daily meal.",
        cta: "Book Now",
        imageSrc:
          "https://images.unsplash.com/photo-1560264357-8d9202250e21?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Large theropod dinosaur display in a dramatic outdoor setting",
      },
      {
        name: "Herbivore Petting Zone",
        description: "Calm giants you can brush and feed under staff supervision.",
        cta: "Learn More",
        imageSrc:
          "https://images.unsplash.com/photo-1516466720416-7f452d5d73a6?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Long-necked dinosaur statue among trees",
      },
    ],
  },
  {
    title: "🌿 Nature & Exploration",
    activities: [
      {
        name: "Jungle Trek",
        description: "Shaded boardwalks past waterfalls, tree ferns, and lookout points.",
        cta: "Book Now",
        imageSrc:
          "https://images.unsplash.com/photo-1441974231532-c32c787668b6?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Sunlight through tall trees on a forest path",
      },
      {
        name: "Fossil Dig Site",
        description: "Brush away sand to uncover replica fossils you can take home.",
        cta: "Learn More",
        imageSrc:
          "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Desert sand dunes and rocky terrain under a clear sky",
      },
      {
        name: "Pterodactyl Viewing Platform",
        description: "Elevated deck for cliff-side flyers and canyon thermals overhead.",
        cta: "Learn More",
        imageSrc:
          "https://images.unsplash.com/photo-1464822759023-fed622bf2d7b?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Mountain ridge view above clouds",
      },
    ],
  },
  {
    title: "🚤 Water & Adventure",
    activities: [
      {
        name: "Lagoon Boat Safari",
        description: "Quiet electric boats across the lagoon at dawn or golden hour.",
        cta: "Book Now",
        imageSrc:
          "https://images.unsplash.com/photo-1439066610841-661bbd176c45?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Calm lake with small boat near forested shore",
      },
      {
        name: "Waterfall Canyon Kayaking",
        description: "Paddle misty pools and narrow channels with a certified guide.",
        cta: "Book Now",
        imageSrc:
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Kayaker on turquoise water between rocky cliffs",
      },
      {
        name: "Mosasaurus Dive Experience",
        description: "Behind-glass gallery and viewing tunnel for our marine apex predator.",
        cta: "Book Now",
        imageSrc:
          "https://images.unsplash.com/photo-1505142468610-359e7d316ad0?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Underwater view of a large shark swimming past glass",
      },
    ],
  },
  {
    title: "🎭 Shows & Entertainment",
    activities: [
      {
        name: "The Great Stampede Show",
        description: "Live arena story with herds, heroes, and thundering practical effects.",
        cta: "Book Now",
        imageSrc:
          "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Concert stage lights and crowd silhouettes",
      },
      {
        name: "Mesozoic Night Safari",
        description: "After-dark route with low lights, soundscapes, and nocturnal behavior.",
        cta: "Learn More",
        imageSrc:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2177?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Jungle at night with moonlight on palm trees",
      },
    ],
  },
];
