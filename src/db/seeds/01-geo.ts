// src\db\seeds\01-geo.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedGeo(db: DB) {
  await db
    .insert(schema.states)
    .values({
      name: "Johor",
      slug: "johor",
      country: "Malaysia",
    })
    .onConflictDoUpdate({
      target: schema.states.slug,
      set: {
        name: "Johor",
        country: "Malaysia",
      },
    });

  const johor = await db.query.states.findFirst({
    where: (states, { eq: eqOp }) => eqOp(states.slug, "johor"),
  });

  if (!johor) {
    return;
  }

  const regionSeeds = [
    {
      stateId: johor.id,
      name: "Johor Bahru City Centre",
      slug: "jb-city-centre",
    },
    {
      stateId: johor.id,
      name: "Iskandar Puteri",
      slug: "iskandar-puteri",
    },
    {
      stateId: johor.id,
      name: "Tebrau Corridor",
      slug: "tebrau-corridor",
    },
    {
      stateId: johor.id,
      name: "Skudai & North JB",
      slug: "skudai-north-jb",
    },
    {
      stateId: johor.id,
      name: "Pasir Gudang Corridor",
      slug: "pasir-gudang-corridor",
    },
    {
      stateId: johor.id,
      name: "Kulai & Senai",
      slug: "kulai-senai",
    },
  ];

  for (const regionSeed of regionSeeds) {
    await db
      .insert(schema.regions)
      .values(regionSeed)
      .onConflictDoUpdate({
        target: [schema.regions.stateId, schema.regions.slug],
        set: {
          name: regionSeed.name,
        },
      });
  }

  const regions = await db.query.regions.findMany({
    where: (regionsTable, { eq: eqOp }) => eqOp(regionsTable.stateId, johor.id),
  });

  const regionMap = new Map(regions.map((region) => [region.slug, region.id]));

  const areasByRegion = [
    {
      regionSlug: "jb-city-centre",
      areas: [
        { name: "JB Sentral", slug: "jb-sentral" },
        { name: "Bukit Chagar", slug: "bukit-chagar" },
        { name: "Komtar / JBCC", slug: "komtar-jbcc" },
        { name: "Danga Bay", slug: "danga-bay" },
        { name: "Stulang", slug: "stulang" },
        { name: "Jalan Wong Ah Fook", slug: "jalan-wong-ah-fook" },
        { name: "Jalan Abdul Samad", slug: "jalan-abdul-samad" },
        { name: "Kolam Ayer", slug: "kolam-ayer" },
        { name: "Taman Abad", slug: "taman-abad" },
      ],
    },
    {
      regionSlug: "iskandar-puteri",
      areas: [
        { name: "Medini", slug: "medini" },
        { name: "Puteri Harbour", slug: "puteri-harbour" },
        { name: "Bukit Indah", slug: "bukit-indah" },
        { name: "Eco Botanic", slug: "eco-botanic" },
        { name: "East Ledang", slug: "east-ledang" },
        { name: "Gelang Patah", slug: "gelang-patah" },
      ],
    },
    {
      regionSlug: "tebrau-corridor",
      areas: [
        { name: "Mount Austin", slug: "mount-austin" },
        { name: "Austin Heights", slug: "austin-heights" },
        { name: "Desa Tebrau", slug: "desa-tebrau" },
        { name: "Setia Indah", slug: "setia-indah" },
        { name: "Taman Daya", slug: "taman-daya" },
        { name: "Larkin", slug: "larkin" },
      ],
    },
    {
      regionSlug: "skudai-north-jb",
      areas: [
        { name: "Skudai Town", slug: "skudai-town" },
        { name: "Taman Universiti", slug: "taman-universiti" },
        { name: "Sutera Utama", slug: "sutera-utama" },
        { name: "Tampoi", slug: "tampoi" },
        { name: "Kempas", slug: "kempas" },
        { name: "Mukim Pulai", slug: "mukim-pulai" },
        { name: "Kangkar Pulai", slug: "kangkar-pulai" },
      ],
    },
    {
      regionSlug: "pasir-gudang-corridor",
      areas: [
        { name: "Permas Jaya", slug: "permas-jaya" },
        { name: "Masai", slug: "masai" },
        { name: "Bandar Seri Alam", slug: "bandar-seri-alam" },
      ],
    },
    {
      regionSlug: "kulai-senai",
      areas: [
        { name: "Kulai", slug: "kulai" },
        { name: "Senai", slug: "senai" },
        { name: "Indahpura", slug: "indahpura" },
      ],
    },
  ] as const;

  for (const regionAreas of areasByRegion) {
    const regionId = regionMap.get(regionAreas.regionSlug);
    if (!regionId) {
      continue;
    }

    for (const areaSeed of regionAreas.areas) {
      await db
        .insert(schema.areas)
        .values({
          regionId,
          name: areaSeed.name,
          slug: areaSeed.slug,
        })
        .onConflictDoUpdate({
          target: [schema.areas.regionId, schema.areas.slug],
          set: {
            name: areaSeed.name,
          },
        });
    }
  }
}
