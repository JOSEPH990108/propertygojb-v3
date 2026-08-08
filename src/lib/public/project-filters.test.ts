import { describe, expect, it } from "vitest";

import {
  buildPublicProjectFilterOptions,
  filterPublicProjects,
} from "./project-filters";

const projects = [
  {
    slug: "bayu-residences",
    displayName: "Bayu Residences",
    legalName: "Bayu Residences Sdn Bhd",
    developerName: "Southern Homes",
    regionId: "johor",
    regionName: "Johor",
    areaId: "iskandar-puteri",
    areaName: "Iskandar Puteri",
    propertyCategoryName: "Residential",
    propertyTypeId: "condo",
    propertyTypeName: "Condominium",
    projectStatusId: "launching",
    projectStatusName: "Launching",
    address: "Persiaran Bayu",
  },
  {
    slug: "city-suites",
    displayName: "City Suites",
    legalName: null,
    developerName: "Metro Land",
    regionId: "johor",
    regionName: "Johor",
    areaId: "johor-bahru",
    areaName: "Johor Bahru",
    propertyCategoryName: "Residential",
    propertyTypeId: "serviced-apartment",
    propertyTypeName: "Serviced Apartment",
    projectStatusId: "completed",
    projectStatusName: "Completed",
    address: null,
  },
];

describe("filterPublicProjects", () => {
  it("combines exact filters with case-insensitive search", () => {
    expect(
      filterPublicProjects(projects, {
        regionId: "johor",
        propertyTypeId: "condo",
        q: "ISKANDAR",
      }),
    ).toEqual([projects[0]]);
  });

  it("searches developer and slug fields", () => {
    expect(filterPublicProjects(projects, { q: "metro" })).toEqual([projects[1]]);
    expect(filterPublicProjects(projects, { q: "bayu-res" })).toEqual([projects[0]]);
  });
});

describe("buildPublicProjectFilterOptions", () => {
  it("deduplicates values and sorts labels", () => {
    const options = buildPublicProjectFilterOptions(projects);

    expect(options.regionOptions).toEqual([{ value: "johor", label: "Johor" }]);
    expect(options.areaOptions.map((option) => option.label)).toEqual([
      "Iskandar Puteri",
      "Johor Bahru",
    ]);
  });
});
