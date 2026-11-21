// Syncs the field list from content/fields.ts into the database.
// Runs on every Vercel build (see "vercel-build" in package.json) so production
// always has the fields members choose from. Safe to run repeatedly: upserts by slug.
// Unlike prisma/seed.ts, this adds no sample articles or offers.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { fieldConfigs } from "../content/fields";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL }),
});

async function main() {
  for (const [position, f] of fieldConfigs.entries()) {
    await db.field.upsert({
      where: { slug: f.slug },
      create: { slug: f.slug, name: f.name, position },
      update: { name: f.name, position },
    });
  }
  console.log(`Synced ${fieldConfigs.length} fields.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
