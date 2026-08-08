import { and, eq, isNull, or } from "drizzle-orm";

import { db, schema } from "../src/db";
import { geocodeProjectLocation } from "../src/lib/geocoding";

async function main() {
  const projects = await db
    .select({
      id: schema.projects.id,
      name: schema.projects.name,
      displayName: schema.projects.displayName,
      address: schema.projects.address,
      regionName: schema.regions.name,
      areaName: schema.areas.name,
      stateName: schema.states.name,
      countryName: schema.states.country,
      latitude: schema.projects.latitude,
      longitude: schema.projects.longitude,
      isPublished: schema.projects.isPublished,
      slug: schema.projects.slug,
    })
    .from(schema.projects)
    .leftJoin(schema.regions, eq(schema.projects.regionId, schema.regions.id))
    .leftJoin(schema.states, eq(schema.regions.stateId, schema.states.id))
    .leftJoin(schema.areas, eq(schema.projects.areaId, schema.areas.id))
    .where(
      and(
        isNull(schema.projects.deletedAt),
        or(isNull(schema.projects.latitude), isNull(schema.projects.longitude)),
      ),
    )
    .orderBy(schema.projects.slug);

  const updates: Array<{ id: string; latitude: string; longitude: string }> = [];

  for (const project of projects) {
    const coordinates = await geocodeProjectLocation({
      address: project.address,
      area: project.areaName,
      region: project.regionName,
      state: project.stateName,
      country: project.countryName,
    });

    if (!coordinates) {
      console.log(`skip ${project.slug}: no coordinates found`);
      continue;
    }

    updates.push({
      id: project.id,
      latitude: coordinates.lat,
      longitude: coordinates.lon,
    });

    console.log(
      `matched ${project.slug} -> ${coordinates.display_name} (${coordinates.lat}, ${coordinates.lon})`,
    );
  }

  for (const update of updates) {
    await db
      .update(schema.projects)
      .set({
        latitude: update.latitude,
        longitude: update.longitude,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, update.id));
  }

  console.log(
    JSON.stringify(
      {
        totalProjectsChecked: projects.length,
        totalUpdated: updates.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});