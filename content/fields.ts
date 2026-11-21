// Per-field theme and home page settings. One shared component set reads this file.
// `slug` must match the fields seeded into the database (prisma/seed.ts).

export type FieldConfig = {
  slug: string;
  name: string;
  /** Accent colour for headings, rules and buttons on this field's pages. Keep ≥ 4.5:1 on ivory. */
  accent: string;
  /** Lighter tint used for placeholder gradients and soft backgrounds. */
  tint: string;
  heroTitle: string;
  heroText: string;
  featuredLabel: string;
  offersTitle: string;
  offersIntro: string;
  /** Order of the home page blocks for this field. */
  layout: ("featured" | "articles" | "offers" | "venues")[];
};

export const fieldConfigs: FieldConfig[] = [
  {
    slug: "fashion",
    name: "Fashion",
    accent: "#7A3E2B",
    tint: "#EED9CC",
    heroTitle: "Kapas",
    heroText: "Designers, ateliers, weavers and stylists shaping how Nepal dresses.",
    featuredLabel: "From the atelier",
    offersTitle: "Studio and label offers",
    offersIntro: "Fittings, previews and member prices from partner labels.",
    layout: ["featured", "articles", "venues", "offers"],
  },
  {
    slug: "food",
    name: "Food",
    accent: "#6B4A12",
    tint: "#F1E2C0",
    heroTitle: "Gaas",
    heroText: "Producers, cooks and the stories behind what Nepal eats.",
    featuredLabel: "On the table",
    offersTitle: "Tables and tastings",
    offersIntro: "Chef's tables, tastings and producer visits for members.",
    layout: ["featured", "offers", "articles", "venues"],
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    accent: "#8A2F1C",
    tint: "#F2D6CB",
    heroTitle: "Gaas",
    heroText: "Kitchens, dining rooms and the people who run them.",
    featuredLabel: "From the pass",
    offersTitle: "Restaurant offers",
    offersIntro: "Member seats and privileges at partner restaurants.",
    layout: ["featured", "venues", "articles", "offers"],
  },
  {
    slug: "hospitality",
    name: "Hospitality",
    accent: "#4E5A2A",
    tint: "#E3E6CC",
    heroTitle: "Baas",
    heroText: "Hotels, lodges and homestays that make Nepal feel like home.",
    featuredLabel: "Check-in",
    offersTitle: "Stays and upgrades",
    offersIntro: "Room upgrades and member rates at partner properties.",
    layout: ["featured", "venues", "offers", "articles"],
  },
  {
    slug: "travel",
    name: "Travel",
    accent: "#2F5566",
    tint: "#D3E2E6",
    heroTitle: "Baas",
    heroText: "Routes, journeys and the places worth the road.",
    featuredLabel: "Dispatch",
    offersTitle: "Journeys and partners",
    offersIntro: "Member privileges with partner operators and stays.",
    layout: ["featured", "articles", "offers", "venues"],
  },
  {
    slug: "bars",
    name: "Bars",
    accent: "#5B2340",
    tint: "#EBD3DF",
    heroTitle: "Gaas",
    heroText: "Bartenders, cellars and the rooms where the night happens.",
    featuredLabel: "Last call",
    offersTitle: "Bar offers",
    offersIntro: "Member pours, launches and seats at partner bars.",
    layout: ["featured", "venues", "articles", "offers"],
  },
  {
    slug: "business",
    name: "Business",
    accent: "#3B1F12",
    tint: "#EADFD3",
    heroTitle: "Business",
    heroText: "The brands, founders and numbers behind Nepal's taste economy.",
    featuredLabel: "The brief",
    offersTitle: "Business offers",
    offersIntro: "Member privileges from partner services and spaces.",
    layout: ["featured", "articles", "offers", "venues"],
  },
  {
    slug: "investors",
    name: "Investors",
    accent: "#28463A",
    tint: "#D3E3DA",
    heroTitle: "Investors",
    heroText: "Where capital meets craft, hospitality and luxury in Nepal.",
    featuredLabel: "Deal notes",
    offersTitle: "Investor offers",
    offersIntro: "Introductions and member-only sessions with partners.",
    layout: ["featured", "articles", "venues", "offers"],
  },
  {
    slug: "other",
    name: "Other",
    accent: "#8B5E1A",
    tint: "#F3E6C4",
    heroTitle: "Authority",
    heroText: "Creators, students and everyone with taste.",
    featuredLabel: "Featured",
    offersTitle: "Member offers",
    offersIntro: "Privileges from Authority's partner venues.",
    layout: ["featured", "articles", "offers", "venues"],
  },
];

export function fieldConfig(slug: string | null | undefined): FieldConfig {
  return fieldConfigs.find((f) => f.slug === slug) ?? fieldConfigs[fieldConfigs.length - 1];
}
