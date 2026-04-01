import type { InlineAnimation, ShapeAnimation, TextAnimation, Animation, PropertyAnimation } from "../schema/types.js";
import { expandPreset } from "../presets/index.js";
import { generateKeyframes } from "./keyframes.js";
import { generateEffects } from "./effects.js";
import { generateTrimPathAnimation } from "./trim-path.js";
import { generateTypewriterAnimation } from "./typewriter.js";
import { comment } from "./utils.js";

interface InlineAnimationOptions {
  animate: InlineAnimation | ShapeAnimation | TextAnimation;
  layerVar: string;
  actionIndex: number;
  trimVar?: string;
}

function isShapeAnimation(anim: InlineAnimation | ShapeAnimation | TextAnimation): anim is ShapeAnimation {
  return "property" in anim && anim.property !== undefined && anim.property !== "typewriter";
}

function isTextAnimation(anim: InlineAnimation | ShapeAnimation | TextAnimation): anim is TextAnimation {
  return "property" in anim && anim.property === "typewriter";
}

/**
 * Bridge between InlineAnimation (on created layers) and the existing
 * keyframe/effect generators. Sets up `var layer` and `var staggerDelay`
 * so existing generators work unchanged.
 */
export function generateInlineAnimation(options: InlineAnimationOptions): string {
  const { animate, layerVar, actionIndex, trimVar } = options;
  const lines: string[] = [];

  lines.push(comment("Animation"));
  lines.push(`var layer = ${layerVar};`);
  lines.push("var staggerDelay = 0;");

  // Handle typewriter on text animations
  if (isTextAnimation(animate)) {
    const easing = animate.easing ?? "linear";
    const duration = animate.duration ?? 1;
    const fromVal = typeof animate.from === "number" ? animate.from : 0;
    const toVal = typeof animate.to === "number" ? animate.to : 100;

    lines.push("");
    lines.push(comment("Typewriter Animation"));
    lines.push(
      generateTypewriterAnimation({
        layerVar,
        fromValue: fromVal,
        toValue: toVal,
        duration,
        easing,
        delay: animate.delay,
        startAt: animate.startAt,
      })
    );

    // Also handle any additional properties if present
    if (animate.properties && animate.properties.length > 0) {
      const syntheticAnim = buildSyntheticAnimation(animate);
      const expanded = expandPreset(syntheticAnim);
      generatePropertyKeyframes(expanded, lines, actionIndex);
    }
  // Handle trimPath shorthand on shape animations
  } else if (isShapeAnimation(animate) && animate.property === "trimPath" && trimVar) {
    const easing = animate.easing ?? "easeOutCubic";
    const duration = animate.duration ?? 0.5;
    const fromVal = typeof animate.from === "number" ? animate.from : 0;
    const toVal = typeof animate.to === "number" ? animate.to : 100;

    lines.push("");
    lines.push(comment("Trim Path Animation"));
    lines.push(
      generateTrimPathAnimation({
        trimVar,
        fromValue: fromVal,
        toValue: toVal,
        duration,
        easing,
        delay: animate.delay,
        startAt: animate.startAt,
      })
    );

    // Also handle any additional properties if present
    if (animate.properties && animate.properties.length > 0) {
      const syntheticAnim = buildSyntheticAnimation(animate);
      const expanded = expandPreset(syntheticAnim);
      generatePropertyKeyframes(expanded, lines, actionIndex);
    }
  } else {
    // Build synthetic Animation from InlineAnimation, then use existing pipeline
    const syntheticAnim = buildSyntheticAnimation(animate);
    const expanded = expandPreset(syntheticAnim);

    // If ShapeAnimation has shorthand property/from/to, append to properties
    if (isShapeAnimation(animate) && animate.property && animate.property !== "trimPath") {
      const shorthandProp: PropertyAnimation = {
        property: animate.property,
        from: animate.from,
        to: animate.to,
      };
      expanded.properties = [...(expanded.properties ?? []), shorthandProp];
    }

    generatePropertyKeyframes(expanded, lines, actionIndex);
  }

  // Effects
  if (animate.effects && animate.effects.length > 0) {
    lines.push("");
    lines.push(comment("Effects"));
    lines.push(generateEffects(animate.effects));
  }

  return lines.join("\n");
}

function buildSyntheticAnimation(animate: InlineAnimation | ShapeAnimation | TextAnimation): Animation {
  return {
    target: { mode: "all" }, // placeholder — not used for created layers
    preset: animate.preset,
    properties: animate.properties,
    easing: animate.easing,
    duration: animate.duration,
    delay: animate.delay,
    startAt: animate.startAt,
    effects: animate.effects,
    anchorPoint: animate.anchorPoint,
  };
}

function generatePropertyKeyframes(
  expanded: Animation,
  lines: string[],
  actionIndex: number
): void {
  if (expanded.properties && expanded.properties.length > 0) {
    const easing = expanded.easing ?? "easeOutCubic";
    const duration = expanded.duration ?? 0.5;

    for (var pi = 0; pi < expanded.properties.length; pi++) {
      lines.push("");
      lines.push(comment(`Property: ${expanded.properties[pi].property}`));
      lines.push(
        generateKeyframes({
          propAnim: expanded.properties[pi],
          easing,
          duration,
          animIndex: pi,
          delay: expanded.delay,
          startAt: expanded.startAt,
          anchorPoint: expanded.anchorPoint,
        })
      );
    }
  }
}
