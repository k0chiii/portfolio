import { describe, expect, it } from "vitest";

import { resolveInitialTheme } from "../src/lib/theme";

describe("theme resolution", () => {
  it("prefers saved valid theme over OS preference", () => {
    expect(resolveInitialTheme("light", true)).toBe("light");
    expect(resolveInitialTheme("dark", false)).toBe("dark");
  });

  it("falls back to OS preference when saved value is empty or invalid", () => {
    expect(resolveInitialTheme(null, true)).toBe("dark");
    expect(resolveInitialTheme(undefined, false)).toBe("light");
    expect(resolveInitialTheme("sepia", true)).toBe("dark");
  });
});
