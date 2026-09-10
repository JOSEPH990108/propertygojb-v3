import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { getAppButtonChildren } from "./app-button-children";

describe("getAppButtonChildren", () => {
  it("returns exactly the original single child when composed with asChild, even while loading", () => {
    const children = "Continue";

    const result = getAppButtonChildren({
      asChild: true,
      isLoading: true,
      children,
    });

    expect(result).toBe(children);
  });

  it("returns the plain children when not loading", () => {
    const children = "Save";

    const result = getAppButtonChildren({
      asChild: false,
      isLoading: false,
      children,
    });

    expect(result).toBe(children);
  });

  it("wraps a loading spinner alongside children only when not composed via asChild", () => {
    const children = "Save";

    const result = getAppButtonChildren({
      asChild: false,
      isLoading: true,
      children,
    });

    expect(isValidElement(result)).toBe(true);
    if (!isValidElement(result)) return;

    const wrappedChildren = result.props as { children: unknown[] };
    expect(Array.isArray(wrappedChildren.children)).toBe(true);
    expect(wrappedChildren.children).toHaveLength(2);
    expect(wrappedChildren.children[1]).toBe(children);
  });
});
