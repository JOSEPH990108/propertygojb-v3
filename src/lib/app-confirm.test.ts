import { describe, expect, it } from "vitest";

import { confirmToneClassNames } from "./app-confirm";

describe("confirmToneClassNames", () => {
  it("defines a matching presentation entry for every confirm tone", () => {
    const tones: Array<keyof typeof confirmToneClassNames> = [
      "danger",
      "warning",
      "info",
    ];

    for (const tone of tones) {
      const entry = confirmToneClassNames[tone];
      expect(entry.iconWrap).toEqual(expect.any(String));
      expect(entry.badge).toEqual(expect.any(String));
      expect(entry.confirmButton).toEqual(expect.any(String));
    }
  });

  it("keeps distinct button colors per tone so meaning is not lost across surfaces", () => {
    const buttons = Object.values(confirmToneClassNames).map(
      (entry) => entry.confirmButton,
    );

    expect(new Set(buttons).size).toBe(buttons.length);
  });
});
