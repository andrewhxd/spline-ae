import { describe, it, expect } from "vitest";
import { expandPreset, presets } from "../src/presets/index.js";
import type { Animation } from "../src/schema/types.js";

describe("expandPreset", () => {
  it("expands pop preset with default properties", () => {
    const anim: Animation = {
      preset: "pop",
      target: { mode: "all" },
    };
    const expanded = expandPreset(anim);
    expect(expanded.properties).toEqual(presets.pop.properties);
    expect(expanded.easing).toBe("easeOutBack");
    expect(expanded.duration).toBe(0.4);
    expect(expanded.preset).toBeUndefined();
  });

  it("expands fade-in preset", () => {
    const anim: Animation = {
      preset: "fade-in",
      target: { mode: "selected" },
    };
    const expanded = expandPreset(anim);
    expect(expanded.properties).toHaveLength(1);
    expect(expanded.properties![0].property).toBe("opacity");
    expect(expanded.easing).toBe("easeOutCubic");
  });

  it("expands slide-up preset", () => {
    const anim: Animation = {
      preset: "slide-up",
      target: { mode: "all" },
    };
    const expanded = expandPreset(anim);
    expect(expanded.properties).toHaveLength(2);
    expect(expanded.properties![0].property).toBe("position");
    expect(expanded.properties![0].relative).toBe(true);
  });

  it("preserves explicit overrides over preset defaults", () => {
    const anim: Animation = {
      preset: "pop",
      target: { mode: "all" },
      easing: "linear",
      duration: 1.0,
    };
    const expanded = expandPreset(anim);
    expect(expanded.easing).toBe("linear");
    expect(expanded.duration).toBe(1.0);
    // Properties should still come from preset since not overridden
    expect(expanded.properties).toEqual(presets.pop.properties);
  });

  it("preserves explicit properties over preset defaults", () => {
    const anim: Animation = {
      preset: "pop",
      target: { mode: "all" },
      properties: [{ property: "rotation", from: 0, to: 360 }],
    };
    const expanded = expandPreset(anim);
    expect(expanded.properties).toHaveLength(1);
    expect(expanded.properties![0].property).toBe("rotation");
  });

  it("returns animation unchanged when no preset", () => {
    const anim: Animation = {
      target: { mode: "all" },
      properties: [{ property: "opacity", from: 0, to: 100 }],
      easing: "easeOutExpo",
      duration: 0.3,
    };
    const expanded = expandPreset(anim);
    expect(expanded).toEqual(anim);
  });
});
