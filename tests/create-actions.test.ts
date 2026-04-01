import { describe, it, expect } from "vitest";
import { validatePlan } from "../src/schema/validation.js";
import { generate } from "../src/generator/index.js";
import type { AnimationPlan } from "../src/schema/types.js";

describe("create action validation", () => {
  it("accepts a create_text action", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Text Test",
      actions: [
        {
          type: "create_text",
          name: "Headline",
          text: "Hello World",
          position: [960, 200],
          style: { fontSize: 64 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a create_shape action with line", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Shape Test",
      actions: [
        {
          type: "create_shape",
          name: "Line1",
          shape: "line",
          from: [200, 500],
          to: [800, 500],
          strokeWidth: 4,
          strokeColor: [1, 1, 1],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects create_shape line without from/to", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Bad Shape",
      actions: [
        {
          type: "create_shape",
          name: "NoEndpoints",
          shape: "line",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects create_text without text field", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Bad Text",
      actions: [
        {
          type: "create_text",
          name: "Headline",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts mixed actions and animations", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Mixed",
      actions: [
        {
          type: "create_text",
          name: "Title",
          text: "Hello",
        },
      ],
      animations: [
        {
          target: { mode: "all" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts legacy animations-only plan", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Legacy",
      animations: [
        {
          target: { mode: "all" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects plan with neither animations nor actions", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Empty",
    });
    expect(result.success).toBe(false);
  });

  it("accepts create_text with inline animation", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Animated Text",
      actions: [
        {
          type: "create_text",
          name: "Headline",
          text: "Hello",
          animate: {
            preset: "fade-in",
            duration: 0.8,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts create_shape with trimPath animation", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Trim Shape",
      actions: [
        {
          type: "create_shape",
          name: "Wipe Line",
          shape: "line",
          from: [100, 300],
          to: [900, 300],
          animate: {
            property: "trimPath",
            from: 0,
            to: 100,
            duration: 1.2,
            easing: "easeOutCubic",
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts create_shape with shorthand effects", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Glow Shape",
      actions: [
        {
          type: "create_shape",
          name: "Glow Line",
          shape: "line",
          from: [200, 500],
          to: [800, 500],
          effects: ["glow"],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts legacy animation in actions array", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Actions Legacy",
      actions: [
        {
          target: { mode: "all" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("create action generation", () => {
  it("generates addText for create_text action", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Text Gen",
      actions: [
        {
          type: "create_text",
          name: "Headline",
          text: "Hello World",
          position: [960, 200],
          style: {
            fontSize: 64,
            fontFamily: "Helvetica",
            fillColor: [1, 0.5, 0],
            justification: "center",
          },
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("comp.layers.addText");
    expect(script).toContain('"Hello World"');
    expect(script).toContain('.name = "Headline"');
    expect(script).toContain("fontSize = 64");
    expect(script).toContain('.font = "Helvetica"');
    expect(script).toContain("fillColor = [1, 0.5, 0]");
    expect(script).toContain("CENTER_JUSTIFY");
    expect(script).toContain("Position");
    expect(script).toContain("[960, 200]");
  });

  it("generates addShape for create_shape line", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Shape Gen",
      actions: [
        {
          type: "create_shape",
          name: "Glow_Line",
          shape: "line",
          from: [200, 500],
          to: [800, 500],
          strokeWidth: 4,
          strokeColor: [1, 1, 1],
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("comp.layers.addShape()");
    expect(script).toContain('.name = "Glow_Line"');
    expect(script).toContain("ADBE Vector Group");
    expect(script).toContain("ADBE Vector Shape - Group");
    expect(script).toContain("new Shape()");
    expect(script).toContain("[[200, 500], [800, 500]]");
    expect(script).toContain("closed = false");
    expect(script).toContain("ADBE Vector Graphic - Stroke");
    expect(script).toContain("Stroke Width");
    expect(script).toContain("setValue(4)");
  });

  it("generates trim path setup for trimPath animation", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Trim Gen",
      actions: [
        {
          type: "create_shape",
          name: "Wipe",
          shape: "line",
          from: [100, 300],
          to: [900, 300],
          animate: {
            property: "trimPath",
            from: 0,
            to: 100,
            duration: 1.2,
            easing: "easeOutCubic",
          },
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("ADBE Vector Filter - Trim");
    expect(script).toContain('.property("End")');
    expect(script).toContain("setValueAtTime");
  });

  it("generates inline animation with preset", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Preset Inline",
      actions: [
        {
          type: "create_text",
          name: "FadeText",
          text: "Fading",
          animate: {
            preset: "fade-in",
            duration: 0.8,
          },
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("comp.layers.addText");
    expect(script).toContain("Opacity");
    expect(script).toContain("setValueAtTime");
  });

  it("generates effects on shape layer", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Effect Shape",
      actions: [
        {
          type: "create_shape",
          name: "GlowLine",
          shape: "line",
          from: [100, 100],
          to: [500, 100],
          effects: ["glow"],
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("ADBE Glo2");
  });

  it("handles mixed actions and legacy animations", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Mixed Gen",
      actions: [
        {
          type: "create_text",
          name: "Title",
          text: "Mixed",
        },
      ],
      animations: [
        {
          target: { mode: "all" },
          properties: [{ property: "opacity", from: 0, to: 100 }],
          duration: 0.5,
        },
      ],
    };
    const script = generate(plan);
    // Should have both text creation and legacy animation targeting
    expect(script).toContain("comp.layers.addText");
    expect(script).toContain("var layers = []");
    expect(script).toContain("comp.numLayers");
  });

  it("does not contain ES6+ syntax in generated output", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "ES3 Check",
      actions: [
        {
          type: "create_text",
          name: "Test",
          text: "ES3",
          animate: { preset: "fade-in" },
        },
        {
          type: "create_shape",
          name: "Line",
          shape: "line",
          from: [0, 0],
          to: [100, 100],
          animate: {
            property: "trimPath",
            from: 0,
            to: 100,
            duration: 1,
          },
        },
      ],
    };
    const script = generate(plan);
    const lines = script.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith('"') ||
        trimmed.startsWith("'")
      )
        continue;
      expect(trimmed).not.toMatch(/^\s*(let|const)\s/);
    }
    expect(script).not.toMatch(/=>/);
  });
});

describe("typewriter animation", () => {
  it("accepts create_text with typewriter property", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Typewriter Test",
      actions: [
        {
          type: "create_text",
          name: "Brand",
          text: "shipped.one",
          animate: {
            property: "typewriter",
            duration: 1.5,
            easing: "linear",
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts typewriter with additional properties", () => {
    const result = validatePlan({
      version: "1.0",
      name: "Typewriter + Fade",
      actions: [
        {
          type: "create_text",
          name: "Brand",
          text: "shipped.one",
          animate: {
            property: "typewriter",
            duration: 1.5,
            properties: [{ property: "opacity", from: 0, to: 100 }],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("generates Text Animator code for typewriter", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Typewriter Gen",
      actions: [
        {
          type: "create_text",
          name: "Brand",
          text: "shipped.one",
          animate: {
            property: "typewriter",
            duration: 1.5,
            easing: "linear",
          },
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("ADBE Text Properties");
    expect(script).toContain("ADBE Text Animators");
    expect(script).toContain("ADBE Text Animator");
    expect(script).toContain("ADBE Text Opacity");
    expect(script).toContain("ADBE Text Selectors");
    expect(script).toContain("ADBE Text Percent End");
    expect(script).toContain("setValueAtTime");
    expect(script).toContain("opacityProp.setValue(0)");
  });

  it("generates typewriter with correct timing", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Typewriter Timing",
      actions: [
        {
          type: "create_text",
          name: "Title",
          text: "Hello",
          animate: {
            property: "typewriter",
            duration: 2,
            startAt: 1.5,
          },
        },
      ],
    };
    const script = generate(plan);
    expect(script).toContain("var twStart = 1.5;");
    expect(script).toContain("var twEnd = twStart + 2;");
    expect(script).toContain("endProp.setValueAtTime(twStart, 0)");
    expect(script).toContain("endProp.setValueAtTime(twEnd, 100)");
  });

  it("generates typewriter with combined properties", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Typewriter + Opacity",
      actions: [
        {
          type: "create_text",
          name: "Title",
          text: "Hello",
          animate: {
            property: "typewriter",
            duration: 1.5,
            properties: [{ property: "opacity", from: 0, to: 100 }],
          },
        },
      ],
    };
    const script = generate(plan);
    // Should have both typewriter and opacity keyframes
    expect(script).toContain("ADBE Text Animator");
    expect(script).toContain("Opacity");
  });

  it("does not contain ES6+ syntax in typewriter output", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "ES3 Typewriter",
      actions: [
        {
          type: "create_text",
          name: "Test",
          text: "ES3",
          animate: {
            property: "typewriter",
            duration: 1,
            easing: "easeOutCubic",
          },
        },
      ],
    };
    const script = generate(plan);
    const lines = script.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith('"') ||
        trimmed.startsWith("'")
      )
        continue;
      expect(trimmed).not.toMatch(/^\s*(let|const)\s/);
    }
    expect(script).not.toMatch(/=>/);
  });
});

describe("backwards compatibility", () => {
  it("generates identical output for legacy animations-only plans", () => {
    const plan: AnimationPlan = {
      version: "1.0",
      name: "Legacy Plan",
      animations: [
        {
          preset: "pop",
          target: { mode: "all" },
          stagger: { delay: 0.08, order: "index" },
        },
      ],
    };
    const script = generate(plan);
    // Should still use the old animation pipeline
    expect(script).toContain("var layers = []");
    expect(script).toContain("comp.numLayers");
    expect(script).toContain("Scale");
    expect(script).toContain("Opacity");
    expect(script).toContain("staggerDelay");
  });
});
