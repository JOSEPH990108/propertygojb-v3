import { describe, expect, it } from "vitest";

import { getWhatsappHref, resolveLeadRowView } from "./lead-inquiry-view";

describe("getWhatsappHref", () => {
  it("builds a wa.me link from a normalized phone number", () => {
    const href = getWhatsappHref("60123456789", "Vistara Hills");

    expect(href).toContain("https://wa.me/60123456789?text=");
    expect(href).toContain(encodeURIComponent("Vistara Hills"));
  });

  it("strips non-digit characters before building the link", () => {
    const href = getWhatsappHref("+60 12-345 6789", "Elmora Condominium");

    expect(href).toContain("https://wa.me/60123456789?text=");
  });

  it("returns null when there is no usable phone number", () => {
    expect(getWhatsappHref("", "Vistara Hills")).toBeNull();
    expect(getWhatsappHref("   ", "Vistara Hills")).toBeNull();
  });
});

describe("resolveLeadRowView", () => {
  const base = {
    inquiryId: "inq-1",
    projectDisplayName: null,
    projectName: null,
    fullName: null,
    requesterName: null,
    phoneNormalized: null,
    requesterPhoneNormalized: null,
    email: null,
    requesterEmail: null,
  };

  it("prefers lead/project fields over raw requester-supplied fields", () => {
    const view = resolveLeadRowView({
      ...base,
      projectDisplayName: "Vistara Hills (Phase 2)",
      projectName: "vistara-hills",
      fullName: "Chong Zi Yong",
      requesterName: "chong",
      phoneNormalized: "60123456789",
      requesterPhoneNormalized: "60000000000",
      email: "chong@example.test",
      requesterEmail: "raw@example.test",
    });

    expect(view.projectName).toBe("Vistara Hills (Phase 2)");
    expect(view.customerName).toBe("Chong Zi Yong");
    expect(view.phone).toBe("60123456789");
    expect(view.email).toBe("chong@example.test");
    expect(view.whatsappHref).toContain("https://wa.me/60123456789");
  });

  it("falls back to requester-supplied fields and safe defaults when unlinked", () => {
    const view = resolveLeadRowView({
      ...base,
      requesterName: "Guest Enquirer",
      requesterPhoneNormalized: "60111222333",
      requesterEmail: "guest@example.test",
    });

    expect(view.projectName).toBe("Project not linked");
    expect(view.customerName).toBe("Guest Enquirer");
    expect(view.phone).toBe("60111222333");
    expect(view.email).toBe("guest@example.test");
  });

  it("reports an unknown customer and null WhatsApp link when nothing is available", () => {
    const view = resolveLeadRowView(base);

    expect(view.customerName).toBe("Unknown customer");
    expect(view.phone).toBe("");
    expect(view.whatsappHref).toBeNull();
  });
});
