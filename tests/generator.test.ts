import { describe, it, expect } from "vitest";
import { generate } from "../src/generator/index.js";
import type { AnimationPlan } from "../src/schema/types.js";

describe("generate", () => {
  const basePlan: AnimationPlan = {
    version: "1.0",
    name: "Test Plan",
    animations: [
      {
        target: { mode: "all" },
        properties: [{ property: "opacity", from: 0, to: 100 }],
        easing: "easeOutCubic",
        duration: 0.5,
      },
    ],
  };

  it("wraps output in an IIFE", () => {
    const script = generate(basePlan);
    expect(script.startsWith("(function() {")).toBe(true);
    expect(script.endsWith("})();")).toBe(true);
  });

  it("includes undo group", () => {
    const script = generate(basePlan);
    expect(script).toContain('app.beginUndoGroup("Spline Animation")');
    expect(script).toContain("app.endUndoGroup()");
  });

  it("includes comp validation", () => {
    const script = generate(basePlan);
    expect(script).toContain("app.project.activeItem");
    expect(script).toContain("CompItem");
  });

  it("does not contain ES6+ syntax (let/const/arrow)", () => {
    const script = generate(basePlan);
    // Check for let/const declarations (not inside strings)
    const lines = script.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comment lines and string literals
      if (trimmed.startsWith("//") || trimmed.startsWith('"') || trimmed.startsWith("'")) continue;
      expect(trimmed).not.toMatch(/^\s*(let|const)\s/);
    }
    // No arrow functions
    expect(script).not.toMatch(/=>/);
  });

  it("generates layer targeting for all mode", () => {
    const script = generate(basePlan);
    expect(script).toContain("var layers = []");
    expect(script).toContain("comp.numLayers");
  });

  it("generates layer targeting for pattern mode", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Pattern Test",
      animations: [
        {
          target: { mode: "pattern", pattern: "^Card" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
          duration: 0.5,
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("RegExp");
    expect(script).toContain("^Card");
  });

  it("generates stagger code when specified", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Stagger Test",
      animations: [
        {
          target: { mode: "all" },
          properties: [{ property: "scale", from: 0, to: 100 }],
          easing: "easeOutBack",
          duration: 0.4,
          stagger: { delay: 0.1, order: "index" },
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("staggerDelay");
    expect(script).toContain("layerIndex * 0.1");
  });

  it("generates effect code when specified", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Effect Test",
      animations: [
        {
          target: { mode: "selected" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
          duration: 0.5,
          effects: [
            { type: "glow", params: { threshold: 60, radius: 25 } },
          ],
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("ADBE Glo2");
  });

  it("expands presets in generation", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Preset Gen Test",
      animations: [
        {
          preset: "pop",
          target: { mode: "all" },
        },
      ],
    };
    const script = generate(plan);
    // Pop preset should produce scale and opacity keyframes
    expect(script).toContain("Scale");
    expect(script).toContain("Opacity");
  });

  it("generates correct AE property names", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Property Names",
      animations: [
        {
          target: { mode: "all" },
          properties: [
            { property: "opacity", from: 0, to: 100 },
            { property: "scale", from: 0, to: 100 },
            { property: "rotation", from: 0, to: 360 },
          ],
          duration: 0.5,
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain('"Opacity"');
    expect(script).toContain('"Scale"');
    expect(script).toContain('"Rotation"');
  });
});
