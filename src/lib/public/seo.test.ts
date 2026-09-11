import { describe, expect, it } from "vitest";

import { marketingProviderId } from "../../config/public-site";
import {
  buildPublicPageMetadata,
  getPublicRobotsFile,
  getPublicRobotsMetadata,
} from "./seo";

describe("public crawl policy", () => {
  it("blocks indexing outside production", () => {
    expect(getPublicRobotsMetadata(false)).toMatchObject({
      index: false,
      follow: false,
    });
    expect(getPublicRobotsFile(false)).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("allows public routes and protects private routes in production", () => {
    expect(getPublicRobotsMetadata(true)).toMatchObject({
      index: true,
      follow: true,
    });
    expect(getPublicRobotsFile(true)).toMatchObject({
      rules: {
        allow: "/",
        disallow: expect.arrayContaining(["/admin/", "/account/", "/api/"]),
      },
    });
  });
});

describe("public page metadata", () => {
  it("builds canonical and fallback social-image metadata", () => {
    const metadata = buildPublicPageMetadata({
      title: "Contact",
      description: "Contact description",
      path: "/contact",
    });

    expect(metadata.alternates).toEqual({ canonical: "http://localhost:3000/contact" });
    expect(metadata.openGraph).toMatchObject({
      url: "http://localhost:3000/contact",
      images: [{ url: "http://localhost:3000/social-image", width: 1200, height: 630 }],
    });
  });

  it("replaces malformed CMS social images with the site fallback", () => {
    const metadata = buildPublicPageMetadata({
      title: "Project",
      description: "Project description",
      path: "/projects/example",
      images: [{ url: "javascript:alert(1)" }],
    });

    expect(metadata.openGraph).toMatchObject({
      images: [{ url: "http://localhost:3000/social-image" }],
    });
  });
});

describe("marketing provider configuration", () => {
  it("accepts expected IDs and rejects unsafe values", () => {
    expect(marketingProviderId(" G-ABC123 ", /^G-[A-Z0-9]+$/i)).toBe("G-ABC123");
    expect(marketingProviderId("x';alert(1)//", /^G-[A-Z0-9]+$/i)).toBeUndefined();
  });
});