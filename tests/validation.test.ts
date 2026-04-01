import { describe, it, expect } from "vitest";
import { validatePlan } from "../src/schema/validation.js";

describe("validatePlan", () => {
  it("accepts a valid minimal plan", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Test",
      animations: [
        {
          target: { mode: "all" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.plan).toBeDefined();
  });

  it("accepts a plan with preset", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Preset Test",
      animations: [
        {
          preset: "pop",
          target: { mode: "all" },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing version", () => {
    const result = validatePlan({
      name: "No Version",
      animations: [{ target: { mode: "all" } }],
    });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("rejects wrong version", () => {
    const result = validatePlan({
      version: "2.0",
      name: "Wrong Version",
      animations: [{ target: { mode: "all" } }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty animations array", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Empty",
      animations: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects pattern mode without pattern string", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Missing Pattern",
      animations: [
        {
          target: { mode: "pattern" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
        },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes("pattern"))).toBe(true);
  });

  it("accepts pattern mode with pattern string", () => {
    const result = validatePlan({
      version: "1.0",
      name: "With Pattern",
      animations: [
        {
          target: { mode: "pattern", pattern: "^Layer" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts full plan with stagger and effects", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Full Plan",
      animations: [
        {
          target: { mode: "all" },
          properties: [
            { property: "scale", from: 0, to: 100 },
            { property: "opacity", from: 0, to: 100 },
          ],
          easing: "easeOutBack",
          duration: 0.5,
          delay: 0.2,
          stagger: { delay: 0.1, order: "index" },
          effects: [
            { type: "glow", params: { threshold: 50, radius: 10 } },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts array values for position property", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Array Values",
      animations: [
        {
          target: { mode: "all" },
          properties: [
            { property: "position", from: [0, 50], to: [0, 0], relative: true },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid easing type", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Bad Easing",
      animations: [
        {
          target: { mode: "all" },
          easing: "invalidEasing",
          properties: [{ property: "opacity", from: 0, to: 100 }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
