import { describe, it, expect } from "vitest";
import { generateEasing, nativeEasingParams } from "../src/generator/easing.js";

describe("generateEasing", () => {
  it("returns empty code for linear easing", () => {
    const result = generateEasing("linear", "prop", [1, 2]);
    expect(result.code).toBe("");
    expect(result.usesExpression).toBe(false);
  });

  it("generates native easing for easeOutCubic", () => {
    const result = generateEasing("easeOutCubic", "prop", [1, 2]);
    expect(result.usesExpression).toBe(false);
    expect(result.code).toContain("KeyframeEase");
    expect(result.code).toContain("setTemporalEaseAtKey");
  });

  it("generates native easing for easeOutExpo", () => {
    const result = generateEasing("easeOutExpo", "prop", [1, 2]);
    expect(result.usesExpression).toBe(false);
    expect(result.code).toContain("KeyframeEase");
  });

  it("generates native easing for easeInOutQuad", () => {
    const result = generateEasing("easeInOutQuad", "prop", [1, 2]);
    expect(result.usesExpression).toBe(false);
    expect(result.code).toContain("KeyframeEase");
  });

  it("generates expression-based easing for easeOutBack", () => {
    const result = generateEasing("easeOutBack", "prop", [1, 2]);
    expect(result.usesExpression).toBe(true);
    expect(result.code).toContain("expression");
    expect(result.code).toContain("1.70158"); // overshoot constant
  });

  it("has params defined for all native easings", () => {
    expect(nativeEasingParams.linear).toBeDefined();
    expect(nativeEasingParams.easeOutCubic).toBeDefined();
    expect(nativeEasingParams.easeOutExpo).toBeDefined();
    expect(nativeEasingParams.easeInOutQuad).toBeDefined();
  });

  it("easeOutBack expression does not use ES6 syntax", () => {
    const result = generateEasing("easeOutBack", "prop", [1, 2]);
    expect(result.code).not.toContain("=>");
    expect(result.code).not.toMatch(/\blet\b/);
    expect(result.code).not.toMatch(/\bconst\b/);
  });
});
