import { eq } from "drizzle-orm";

import { db, schema } from "@/db";

import {
  LookupRef,
  normalizeCode,
  normalizeLookupRef,
  parseProjectImportPayload,
  ProjectImportPayload,
  slugify,
} from "./project-import-schema";

export type ProjectImportPreview = {
  projectName: string;
  projectSlug: string;
  existingProject: boolean;
  counts: {
    layouts: number;
    units: number;
    amenities: number;
    tags: number;
    nearbyPlaces: number;
  };
  warnings: string[];
};

export type ProjectImportResult = ProjectImportPreview & {
  projectId: string;
  createdOrUpdated: "created" | "updated";
};

function money(value: number) {
  return value.toFixed(2);
}

function optionalMoney(value: number | null | undefined) {
  return value === null || value === undefined ? null : value.toFixed(2);
}

async function firstId<T extends { id: string }>(rows: T[], label: string) {
  const row = rows[0];

  if (!row) {
    throw new Error(`Failed to create ${label}.`);
  }

  return row.id;
}

async function findOrCreateDeveloper(name: string) {
  const existing = await db.query.developers.findFirst({
    where: (table, { eq }) => eq(table.legalName, name),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.developers)
    .values({
      name,
      slug: slugify(name),
      legalName: name,
    })
    .returning({
      id: schema.developers.id,
    });

  return firstId(inserted, "developer");
}

async function findOrCreatePropertyCategory(ref: LookupRef) {
  const item = normalizeLookupRef(ref);

  const existing = await db.query.propertyCategories.findFirst({
    where: (table, { eq }) => eq(table.code, item.code),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.propertyCategories)
    .values({
      code: item.code,
      name: item.name,
      description: null,
      sortOrder: 0,
      isActive: true,
    })
    .returning({
      id: schema.propertyCategories.id,
    });

  return firstId(inserted, "property category");
}

async function findOrCreatePropertyType(categoryId: string, ref: LookupRef) {
  const item = normalizeLookupRef(ref);

  const existing = await db.query.propertyTypes.findFirst({
    where: (table, { eq }) => eq(table.code, item.code),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.propertyTypes)
    .values({
      categoryId,
      code: item.code,
      name: item.name,
      slug: slugify(item.name),
      description: null,
      sortOrder: 0,
      isActive: true,
    })
    .returning({
      id: schema.propertyTypes.id,
    });

  return firstId(inserted, "property type");
}

async function findOrCreateTenureType(ref: LookupRef) {
  const item = normalizeLookupRef(ref);

  const existing = await db.query.tenureTypes.findFirst({
    where: (table, { eq }) => eq(table.code, item.code),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.tenureTypes)
    .values({
      code: item.code,
      name: item.name,
      description: null,
      sortOrder: 0,
      isActive: true,
    })
    .returning({
      id: schema.tenureTypes.id,
    });

  return firstId(inserted, "tenure type");
}

async function findOrCreateProjectStatus(ref: LookupRef | null | undefined) {
  if (!ref) {
    return null;
  }

  const item = normalizeLookupRef(ref);

  const existing = await db.query.projectStatuses.findFirst({
    where: (table, { eq }) => eq(table.code, item.code),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.projectStatuses)
    .values({
      code: item.code,
      name: item.name,
      description: null,
      sortOrder: 0,
      isActive: true,
    })
    .returning({
      id: schema.projectStatuses.id,
    });

  return firstId(inserted, "project status");
}

async function findOrCreateLayoutType(ref: LookupRef | null | undefined) {
  if (!ref) {
    return null;
  }

  const item = normalizeLookupRef(ref);

  const existing = await db.query.layoutTypes.findFirst({
    where: (table, { eq }) => eq(table.code, item.code),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.layoutTypes)
    .values({
      code: item.code,
      name: item.name,
      description: null,
      sortOrder: 0,
      isActive: true,
    })
    .returning({
      id: schema.layoutTypes.id,
    });

  return firstId(inserted, "layout type");
}

async function findOrCreateLotType(ref: LookupRef) {
  const item = normalizeLookupRef(ref);

  const existing = await db.query.lotTypes.findFirst({
    where: (table, { eq }) => eq(table.code, item.code),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.lotTypes)
    .values({
      code: item.code,
      name: item.name,
      description: null,
      sortOrder: 0,
      isActive: true,
    })
    .returning({
      id: schema.lotTypes.id,
    });

  return firstId(inserted, "lot type");
}

async function findOrCreateBookingStatus(ref: LookupRef) {
  const item = normalizeLookupRef(ref);

  const existing = await db.query.bookingStatuses.findFirst({
    where: (table, { eq }) => eq(table.code, item.code),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.bookingStatuses)
    .values({
      code: item.code,
      name: item.name,
      description: null,
      sortOrder: 0,
      isActive: true,
    })
    .returning({
      id: schema.bookingStatuses.id,
    });

  return firstId(inserted, "booking status");
}

async function findOrCreateUnitPosition(ref: LookupRef | null | undefined) {
  if (!ref) {
    return null;
  }

  const item = normalizeLookupRef(ref);

  const existing = await db.query.unitPositions.findFirst({
    where: (table, { eq }) => eq(table.code, item.code),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.unitPositions)
    .values({
      code: item.code,
      name: item.name,
      description: null,
      sortOrder: 0,
      isActive: true,
    })
    .returning({
      id: schema.unitPositions.id,
    });

  return firstId(inserted, "unit position");
}

async function findOrCreateLocation(
  location: ProjectImportPayload["project"]["location"],
) {
  if (!location) {
    return {
      regionId: null,
      areaId: null,
      address: null,
    };
  }

  const stateSlug = slugify(location.state);
  const regionSlug = slugify(location.region);
  const areaSlug = slugify(location.area);

  let state = await db.query.states.findFirst({
    where: (table, { eq }) => eq(table.slug, stateSlug),
    columns: {
      id: true,
    },
  });

  if (!state) {
    const inserted = await db
      .insert(schema.states)
      .values({
        name: location.state,
        slug: stateSlug,
        country: location.country,
      })
      .returning({
        id: schema.states.id,
      });

    state = {
      id: await firstId(inserted, "state"),
    };
  }

  let region = await db.query.regions.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.stateId, state.id), eq(table.slug, regionSlug)),
    columns: {
      id: true,
    },
  });

  if (!region) {
    const inserted = await db
      .insert(schema.regions)
      .values({
        stateId: state.id,
        name: location.region,
        slug: regionSlug,
      })
      .returning({
        id: schema.regions.id,
      });

    region = {
      id: await firstId(inserted, "region"),
    };
  }

  let area = await db.query.areas.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.regionId, region.id), eq(table.slug, areaSlug)),
    columns: {
      id: true,
    },
  });

  if (!area) {
    const inserted = await db
      .insert(schema.areas)
      .values({
        regionId: region.id,
        name: location.area,
        slug: areaSlug,
      })
      .returning({
        id: schema.areas.id,
      });

    area = {
      id: await firstId(inserted, "area"),
    };
  }

  return {
    regionId: region.id,
    areaId: area.id,
    address: location.address ?? null,
  };
}

async function findOrCreateAmenity(name: string) {
  const slug = slugify(name);

  const existing = await db.query.amenities.findFirst({
    where: (table, { eq }) => eq(table.slug, slug),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.amenities)
    .values({
      name,
      slug,
      description: null,
      isActive: true,
    })
    .returning({
      id: schema.amenities.id,
    });

  return firstId(inserted, "amenity");
}

async function findOrCreateTag(name: string) {
  const slug = slugify(name);

  const existing = await db.query.tags.findFirst({
    where: (table, { eq }) => eq(table.slug, slug),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.tags)
    .values({
      name,
      slug,
      description: null,
      isActive: true,
    })
    .returning({
      id: schema.tags.id,
    });

  return firstId(inserted, "tag");
}

export async function previewProjectImport(payloadInput: unknown) {
  const payload = parseProjectImportPayload(payloadInput);
  const projectSlug = payload.project.slug
    ? slugify(payload.project.slug)
    : slugify(payload.project.name);

  const existingProject = await db.query.projects.findFirst({
    where: (table, { eq }) => eq(table.slug, projectSlug),
    columns: {
      id: true,
    },
  });

  const warnings: string[] = [];

  if (payload.units.length > 0 && payload.layouts.length === 0) {
    warnings.push("Units provided without layouts. Units will still import.");
  }

  if (!payload.project.location) {
    warnings.push("Project location is missing.");
  }

  return {
    projectName: payload.project.name,
    projectSlug,
    existingProject: Boolean(existingProject),
    counts: {
      layouts: payload.layouts.length,
      units: payload.units.length,
      amenities: payload.amenities.length,
      tags: payload.tags.length,
      nearbyPlaces: payload.nearbyPlaces.length,
    },
    warnings,
  } satisfies ProjectImportPreview;
}

export async function executeProjectImport(payloadInput: unknown) {
  const payload = parseProjectImportPayload(payloadInput);
  const preview = await previewProjectImport(payload);

  const projectSlug = preview.projectSlug;
  const developerId = await findOrCreateDeveloper(payload.project.developerName);
  const propertyCategoryId = await findOrCreatePropertyCategory(
    payload.project.propertyCategory,
  );
  const propertyTypeId = await findOrCreatePropertyType(
    propertyCategoryId,
    payload.project.propertyType,
  );
  const tenureTypeId = await findOrCreateTenureType(payload.project.tenureType);
  const projectStatusId = await findOrCreateProjectStatus(
    payload.project.projectStatus,
  );
  const location = await findOrCreateLocation(payload.project.location);

  const existingProject = await db.query.projects.findFirst({
    where: (table, { eq }) => eq(table.slug, projectSlug),
    columns: {
      id: true,
    },
  });

  let projectId = existingProject?.id;
  let createdOrUpdated: ProjectImportResult["createdOrUpdated"] = "updated";

  const projectValues = {
    name: payload.project.name,
    displayName: payload.project.name,
    legalName: payload.project.legalName ?? payload.project.name,
    slug: projectSlug,
    developerId,
    propertyCategoryId,
    propertyTypeId,
    projectStatusId,
    tenureTypeId,
    regionId: location.regionId,
    areaId: location.areaId,
    address: location.address,
    totalUnits: payload.project.totalUnits,
    launchYear: payload.project.launchYear ?? null,
    isHotDeal: payload.project.isHotDeal,
    isPublished: payload.project.isPublished,
  };

  if (projectId) {
    await db
      .update(schema.projects)
      .set({
        ...projectValues,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));
  } else {
    const insertedProject = await db
      .insert(schema.projects)
      .values(projectValues)
      .returning({
        id: schema.projects.id,
      });

    projectId = await firstId(insertedProject, "project");
    createdOrUpdated = "created";
  }

  const layoutIdByCode = new Map<string, string>();

  for (const layout of payload.layouts) {
    const code = normalizeCode(layout.code);
    const layoutTypeId = await findOrCreateLayoutType(layout.layoutType);

    const existingLayout = await db.query.projectLayouts.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.projectId, projectId), eq(table.code, code)),
      columns: {
        id: true,
      },
    });

    const layoutValues = {
      projectId,
      code,
      name: layout.name ?? code,
      layoutTypeId,
      builtUpSqft: money(layout.builtUpSqft),
      bedrooms: layout.bedrooms,
      bathrooms: layout.bathrooms,
      studyRooms: layout.studyRooms,
      hasBalcony: layout.hasBalcony,
      hasYard: layout.hasYard,
      isDualKey: layout.isDualKey,
      ceilingHeightM: optionalMoney(layout.ceilingHeightM),
      furnishingStatus: layout.furnishingStatus,
    };

    if (existingLayout) {
      await db
        .update(schema.projectLayouts)
        .set({
          ...layoutValues,
          updatedAt: new Date(),
        })
        .where(eq(schema.projectLayouts.id, existingLayout.id));

      layoutIdByCode.set(code, existingLayout.id);
    } else {
      const inserted = await db
        .insert(schema.projectLayouts)
        .values(layoutValues)
        .returning({
          id: schema.projectLayouts.id,
        });

      layoutIdByCode.set(code, await firstId(inserted, "layout"));
    }
  }

  for (const unit of payload.units) {
    const unitNo = unit.unitNo.trim();
    const layoutCode = unit.layoutCode ? normalizeCode(unit.layoutCode) : null;
    const layoutId = layoutCode ? layoutIdByCode.get(layoutCode) ?? null : null;
    const lotTypeId = await findOrCreateLotType(unit.lotType);
    const bookingStatusId = await findOrCreateBookingStatus(unit.bookingStatus);
    const positionTypeId = await findOrCreateUnitPosition(unit.positionType);

    const existingUnit = await db.query.units.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.projectId, projectId), eq(table.unitNo, unitNo)),
      columns: {
        id: true,
      },
    });

    const unitValues = {
      projectId,
      layoutId,
      unitNo,
      floor: unit.floor ?? null,
      stack: unit.stack ?? null,
      streetName: unit.streetName ?? null,
      displaySequence: unit.displaySequence,
      builtUpSqft: optionalMoney(unit.builtUpSqft),
      landAreaSqft: optionalMoney(unit.landAreaSqft),
      dimensionText: unit.dimensionText ?? null,
      facing: unit.facing ?? null,
      positionTypeId,
      carparkCount: unit.carparkCount,
      carparkLotNo: unit.carparkLotNo ?? null,
      carparkType: unit.carparkType ?? null,
      lotTypeId,
      bookingStatusId,
      basePrice: money(unit.basePrice),
      finalPrice: optionalMoney(unit.finalPrice),
    };

    if (existingUnit) {
      await db
        .update(schema.units)
        .set({
          ...unitValues,
          updatedAt: new Date(),
        })
        .where(eq(schema.units.id, existingUnit.id));
    } else {
      await db.insert(schema.units).values(unitValues);
    }
  }

  for (const amenityName of payload.amenities) {
    const amenityId = await findOrCreateAmenity(amenityName);

    const existing = await db.query.projectAmenities.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.projectId, projectId), eq(table.amenityId, amenityId)),
      columns: {
        projectId: true,
      },
    });

    if (!existing) {
      await db.insert(schema.projectAmenities).values({
        projectId,
        amenityId,
      });
    }
  }

  for (const tagName of payload.tags) {
    const tagId = await findOrCreateTag(tagName);

    const existing = await db.query.projectTags.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.projectId, projectId), eq(table.tagId, tagId)),
      columns: {
        projectId: true,
      },
    });

    if (!existing) {
      await db.insert(schema.projectTags).values({
        projectId,
        tagId,
      });
    }
  }

  for (const nearby of payload.nearbyPlaces) {
    const existing = await db.query.projectNearbyPlaces.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.projectId, projectId), eq(table.name, nearby.name)),
      columns: {
        id: true,
      },
    });

    const nearbyValues = {
      projectId,
      name: nearby.name,
      category: normalizeCode(nearby.category),
      distanceKm: optionalMoney(nearby.distanceKm),
      sortOrder: nearby.sortOrder,
    };

    if (existing) {
      await db
        .update(schema.projectNearbyPlaces)
        .set({
          ...nearbyValues,
          updatedAt: new Date(),
        })
        .where(eq(schema.projectNearbyPlaces.id, existing.id));
    } else {
      await db.insert(schema.projectNearbyPlaces).values(nearbyValues);
    }
  }

  return {
    ...preview,
    projectId,
    createdOrUpdated,
  } satisfies ProjectImportResult;
}
