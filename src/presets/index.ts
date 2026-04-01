import type { Animation, PresetName, PropertyAnimation, EasingType } from "../schema/types.js";

interface PresetDefaults {
  properties: PropertyAnimation[];
  easing: EasingType;
  duration: number;
}

const presets: Record<PresetName, PresetDefaults> = {
  pop: {
    properties: [
      { property: "scale", from: 0, to: 100 },
      { property: "opacity", from: 0, to: 100 },
    ],
    easing: "easeOutBack",
    duration: 0.4,
  },
  "fade-in": {
    properties: [{ property: "opacity", from: 0, to: 100 }],
    easing: "easeOutCubic",
    duration: 0.5,
  },
  "fade-out": {
    properties: [{ property: "opacity", from: 100, to: 0 }],
    easing: "easeOutCubic",
    duration: 0.5,
  },
  "slide-up": {
    properties: [
      { property: "position", from: [0, 50], to: [0, 0], relative: true },
      { property: "opacity", from: 0, to: 100 },
    ],
    easing: "easeOutCubic",
    duration: 0.6,
  },
  bounce: {
    properties: [
      { property: "scale", from: 0, to: 100 },
      { property: "opacity", from: 0, to: 100 },
    ],
    easing: "easeOutBack",
    duration: 0.6,
  },
};

/**
 * Expands a preset into a full animation definition.
 * Merge rule: preset defaults → merge → explicit overrides
 * Explicit properties, easing, and duration take precedence over preset defaults.
 */
export function expandPreset(animation: Animation): Animation {
  if (!animation.preset) return animation;

  const preset = presets[animation.preset];
  if (!preset) return animation;

  const expanded: Animation = {
    ...animation,
    properties: animation.properties ?? preset.properties,
    easing: animation.easing ?? preset.easing,
    duration: animation.duration ?? preset.duration,
  };

  // Remove preset field from expanded result — it's been resolved
  delete expanded.preset;
  return expanded;
}

export { presets };
