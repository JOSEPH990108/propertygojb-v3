import { describe, expect, it } from "vitest";

import {
  canonicalUrlSchema,
  externalImageUrlSchema,
  heroVideoUrlSchema,
  isProjectPubliclyVisible,
  publishScheduleSchema,
} from "./project-content-validation";

describe("project content URLs", () => {
  it("accepts HTTPS canonical, image, and hosted video URLs", () => {
    expect(canonicalUrlSchema.parse("https://propertygojb.com/projects/home")).toContain("https://");
    expect(externalImageUrlSchema.parse("https://cdn.example.com/hero.webp")).toContain(".webp");
    expect(heroVideoUrlSchema.parse("https://cdn.example.com/tour.mp4")).toContain(".mp4");
  });

  it("rejects insecure or unsupported media URLs", () => {
    expect(() => canonicalUrlSchema.parse("http://example.com/project")).toThrow();
    expect(() => externalImageUrlSchema.parse("https://example.com/image.svg")).toThrow();
    expect(() => heroVideoUrlSchema.parse("https://youtube.com/watch?v=123")).toThrow();
  });
});

describe("project publication", () => {
  const now = new Date("2026-07-31T12:00:00.000Z");

  it("shows published projects only after their scheduled time", () => {
    expect(isProjectPubliclyVisible(true, null, now)).toBe(true);
    expect(isProjectPubliclyVisible(true, new Date("2026-07-31T11:00:00.000Z"), now)).toBe(true);
    expect(isProjectPubliclyVisible(true, new Date("2026-07-31T13:00:00.000Z"), now)).toBe(false);
    expect(isProjectPubliclyVisible(false, null, now)).toBe(false);
  });

  it("validates optional publication timestamps", () => {
    expect(publishScheduleSchema.parse({ isPublished: true, publishedAt: null })).toEqual({
      isPublished: true,
      publishedAt: null,
    });
    expect(() => publishScheduleSchema.parse({ isPublished: true, publishedAt: "not-a-date" })).toThrow();
  });
});