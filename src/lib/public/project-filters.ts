export type PublicProjectFilterOption = {
  value: string;
  label: string;
  description?: string;
};

export type PublicProjectFilters = {
  q?: string;
  regionId?: string;
  areaId?: string;
  statusId?: string;
  propertyTypeId?: string;
};

type FilterablePublicProject = {
  slug: string;
  displayName: string | null;
  legalName: string | null;
  developerName: string | null;
  regionId: string | null;
  regionName: string | null;
  areaId: string | null;
  areaName: string | null;
  propertyCategoryName: string | null;
  propertyTypeId: string | null;
  propertyTypeName: string | null;
  projectStatusId: string | null;
  projectStatusName: string | null;
  address: string | null;
};

export function buildPublicProjectFilterOptions(
  projects: FilterablePublicProject[],
) {
  const uniqueBy = (
    getter: (project: FilterablePublicProject) => string | null,
    labelGetter: (project: FilterablePublicProject) => string | null,
    descriptionGetter?: (project: FilterablePublicProject) => string | null,
  ) => {
    const map = new Map<string, PublicProjectFilterOption>();

    for (const project of projects) {
      const value = getter(project);
      const label = labelGetter(project);

      if (!value || !label || map.has(value)) {
        continue;
      }

      map.set(value, {
        value,
        label,
        description: descriptionGetter?.(project) ?? undefined,
      });
    }

    return Array.from(map.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  };

  return {
    regionOptions: uniqueBy(
      (project) => project.regionId,
      (project) => project.regionName,
    ),
    areaOptions: uniqueBy(
      (project) => project.areaId,
      (project) => project.areaName,
      (project) => project.regionId,
    ),
    statusOptions: uniqueBy(
      (project) => project.projectStatusId,
      (project) => project.projectStatusName,
    ),
    propertyTypeOptions: uniqueBy(
      (project) => project.propertyTypeId,
      (project) => project.propertyTypeName,
      (project) => project.propertyCategoryName,
    ),
  };
}

export function filterPublicProjects<T extends FilterablePublicProject>(
  projects: T[],
  filters: PublicProjectFilters,
) {
  const query = filters.q?.trim().toLowerCase() ?? "";

  return projects.filter((project) => {
    if (filters.regionId && project.regionId !== filters.regionId) {
      return false;
    }

    if (filters.areaId && project.areaId !== filters.areaId) {
      return false;
    }

    if (filters.statusId && project.projectStatusId !== filters.statusId) {
      return false;
    }

    if (
      filters.propertyTypeId &&
      project.propertyTypeId !== filters.propertyTypeId
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchableValues = [
      project.displayName,
      project.legalName,
      project.developerName,
      project.regionName,
      project.areaName,
      project.propertyCategoryName,
      project.propertyTypeName,
      project.projectStatusName,
      project.address,
      project.slug,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());

    return searchableValues.some((value) => value.includes(query));
  });
}
