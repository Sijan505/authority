// Seeds fields, 6 sample articles across fields and 2 sample offers.
// Safe to run more than once: rows are upserted by slug / fixed id.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { fieldConfigs } from "../content/fields";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const day = 86_400_000;

// SAMPLE CONTENT: placeholder articles for layout and testing, not real reporting.
const articles = [
  {
    slug: "patan-gets-plated-for-the-world",
    field: "restaurant",
    title: "Patan Gets Plated for the World",
    excerpt: "Inside the Newari kitchens turning courtyard recipes into tasting menus.",
    author: "Authority Desk",
    tags: ["Patan", "Newari", "tasting menu"],
  },
  {
    slug: "the-postcard-arrives-in-meghauli-chitwan",
    field: "hospitality",
    title: "The Postcard Arrives in Meghauli, Chitwan",
    excerpt: "A new lodge on the edge of the national park bets on slow, quiet luxury.",
    author: "Authority Desk",
    tags: ["Chitwan", "lodge", "opening"],
  },
  {
    slug: "production-declines-in-dhaka",
    field: "fashion",
    title: "Production Declines in Dhaka",
    excerpt: "What falling output next door means for Nepal's ateliers and weavers.",
    author: "Authority Desk",
    tags: ["dhaka", "supply chain", "textiles"],
  },
  {
    slug: "the-new-pokhara-bar-crawl",
    field: "bars",
    title: "The New Pokhara Bar Crawl",
    excerpt: "Lakeside is growing up: five rooms where the cocktails now match the view.",
    author: "Authority Desk",
    tags: ["Pokhara", "cocktails"],
  },
  {
    slug: "himalayan-routes-worth-the-road",
    field: "travel",
    title: "Himalayan Routes Worth the Road",
    excerpt: "Three journeys that reward travellers who leave the main trails.",
    author: "Authority Desk",
    tags: ["routes", "trekking"],
  },
  {
    slug: "where-investors-see-nepals-taste-economy",
    field: "investors",
    title: "Where Investors See Nepal's Taste Economy",
    excerpt: "Hospitality, craft and food brands are drawing a new kind of capital.",
    author: "Authority Desk",
    tags: ["capital", "brands"],
  },
];

const sampleBody = (title: string) =>
  [
    `${title} is a sample article used to preview the Authority members platform. Replace it from the admin panel with real reporting.`,
    "Members read the full article for their own field. Public visitors see the title and excerpt only, and are invited to sign in and join.",
    "Pro members can comment below, and discuss the piece with other members in their field's discussion feed.",
  ].join("\n\n");

async function main() {
  for (const [position, f] of fieldConfigs.entries()) {
    await db.field.upsert({ where: { slug: f.slug }, create: { slug: f.slug, name: f.name, position }, update: { name: f.name, position } });
  }
  const fields = new Map((await db.field.findMany()).map((f) => [f.slug, f.id]));

  for (const [i, a] of articles.entries()) {
    const data = {
      title: a.title,
      excerpt: a.excerpt,
      body: sampleBody(a.title),
      fieldId: fields.get(a.field)!,
      authorName: a.author,
      tags: a.tags,
      status: "PUBLISHED" as const,
      publishedAt: new Date(Date.now() - (i + 1) * day),
    };
    await db.article.upsert({ where: { slug: a.slug }, create: { slug: a.slug, ...data }, update: data });
  }

  // SAMPLE OFFERS: placeholder partner venues (TBC).
  const offers = [
    {
      id: "seed-offer-restaurant",
      fieldId: fields.get("restaurant")!,
      name: "Chef's table evening",
      venue: "Partner restaurant, Patan (TBC)",
      discountText: "Members' seats at the chef's table + 15% off the tasting menu",
    },
    {
      id: "seed-offer-hospitality",
      fieldId: fields.get("hospitality")!,
      name: "Founding member stay",
      venue: "Partner lodge, Chitwan (TBC)",
      discountText: "Room upgrade on arrival, subject to availability",
    },
  ];
  for (const o of offers) {
    const data = { ...o, active: true, validUntil: new Date(Date.now() + 180 * day) };
    await db.offer.upsert({ where: { id: o.id }, create: data, update: data });
  }

  console.log(`Seeded ${fields.size} fields, ${articles.length} articles, ${offers.length} offers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
