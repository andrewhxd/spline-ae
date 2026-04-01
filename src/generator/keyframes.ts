import type { PropertyAnimation, EasingType, PropertyName } from "../schema/types.js";
import { generateEasing } from "./easing.js";
import { clampValue } from "./clamp.js";

/**
 * AE property name mapping.
 */
const aePropertyNames: Record<PropertyName, string> = {
  opacity: "Opacity",
  scale: "Scale",
  position: "Position",
  rotation: "Rotation",
};

/**
 * Format a value for ExtendScript.
 * - Numbers are output directly
 * - Arrays become [x, y] or [x, y, z]
 */
function formatValue(
  value: number | [number, number] | [number, number, number]
): string {
  if (Array.isArray(value)) {
    return `[${value.join(", ")}]`;
  }
  return String(value);
}

/**
 * Generate code that resolves a value — either absolute or relative to current.
 * For relative values, we read the layer's current property value at runtime.
 */
function resolveValue(
  property: PropertyName,
  value: number | [number, number] | [number, number, number],
  relative: boolean,
  propVar: string,
  resultVar: string
): string {
  if (!relative) {
    if (property === "scale" && typeof value === "number") {
      // Scale is a 2D/3D array in AE — expand scalar to [v, v]
      return `var ${resultVar} = [${value}, ${value}];`;
    }
    return `var ${resultVar} = ${formatValue(value)};`;
  }

  // Relative: offset from current value
  const lines: string[] = [
    `var ${resultVar}_base = ${propVar}.value;`,
  ];

  if (typeof value === "number") {
    if (property === "scale") {
      lines.push(
        `var ${resultVar} = [${resultVar}_base[0] + ${value}, ${resultVar}_base[1] + ${value}];`
      );
    } else if (property === "position") {
      lines.push(
        `var ${resultVar} = [${resultVar}_base[0] + ${value}, ${resultVar}_base[1] + ${value}];`
      );
    } else {
      lines.push(`var ${resultVar} = ${resultVar}_base + ${value};`);
    }
  } else {
    // Array value — element-wise addition
    const additions = value
      .map((v, idx) => `${resultVar}_base[${idx}] + ${v}`)
      .join(", ");
    lines.push(`var ${resultVar} = [${additions}];`);
  }

  return lines.join("\n");
}

interface KeyframeGenOptions {
  propAnim: PropertyAnimation;
  easing: EasingType;
  duration: number;
  animIndex: number;
  delay?: number;
  startAt?: number;
  anchorPoint?: string;
}

/**
 * Generate ExtendScript code for keyframing a single property animation.
 * Assumes `layer`, `comp`, and `staggerDelay` are in scope.
 */
export function generateKeyframes(options: KeyframeGenOptions): string {
  const { propAnim, easing, duration, animIndex, delay, startAt, anchorPoint } = options;
  const { property, relative } = propAnim;

  const aePropName = aePropertyNames[property];
  const propVar = `prop${animIndex}`;
  const lines: string[] = [];

  // Get the AE property reference
  lines.push(`var ${propVar} = layer.property("Transform").property("${aePropName}");`);

  // Anchor point adjustment if requested
  if (anchorPoint && anchorPoint !== "center") {
    lines.push(...generateAnchorPointAdjustment(anchorPoint));
  }

  // Calculate start time
  if (startAt !== undefined) {
    lines.push(`var startTime${animIndex} = ${startAt} + staggerDelay;`);
  } else {
    const delayVal = delay ?? 0;
    lines.push(`var startTime${animIndex} = comp.displayStartTime + ${delayVal} + staggerDelay;`);
  }
  lines.push(`var endTime${animIndex} = startTime${animIndex} + ${duration};`);

  // Handle custom keyframes or from/to
  if (propAnim.keyframes && propAnim.keyframes.length > 0) {
    // Custom keyframe sequence
    for (let ki = 0; ki < propAnim.keyframes.length; ki++) {
      const kf = propAnim.keyframes[ki];
      const timeExpr = `startTime${animIndex} + ${kf.time}`;
      const val = formatValue(kf.value);
      lines.push(`${propVar}.setValueAtTime(${timeExpr}, ${val});`);
    }
  } else {
    // Simple from → to interpolation
    const fromVal = propAnim.from ?? getDefaultFrom(property);
    const toVal = propAnim.to ?? getDefaultTo(property);
    const isRelative = relative ?? false;

    // Resolve from value
    lines.push(resolveValue(property, fromVal, isRelative, propVar, `fromVal${animIndex}`));

    // Resolve to value
    lines.push(resolveValue(property, toVal, isRelative, propVar, `toVal${animIndex}`));

    // Apply clamping for relevant properties
    if (property === "opacity" || property === "rotation") {
      if (typeof fromVal === "number") {
        lines.push(`fromVal${animIndex} = ${clampValue(property, `fromVal${animIndex}`)};`);
        lines.push(`toVal${animIndex} = ${clampValue(property, `toVal${animIndex}`)};`);
      }
    }

    // Set keyframes
    lines.push(`${propVar}.setValueAtTime(startTime${animIndex}, fromVal${animIndex});`);
    lines.push(`${propVar}.setValueAtTime(endTime${animIndex}, toVal${animIndex});`);

    // Apply easing
    const numKeys = `${propVar}.numKeys`;
    const keyStart = `(${numKeys} - 1)`;
    const keyEnd = numKeys;
    const easingResult = generateEasing(easing, propVar, [1, 2]); // symbolic — replaced by regex below
    if (easingResult.code) {
      // Replace symbolic indices with actual key references
      const easingCode = [
        `var kStart${animIndex} = ${keyStart};`,
        `var kEnd${animIndex} = ${keyEnd};`,
        easingResult.code
          .replace(/setTemporalEaseAtKey\(1,/g, `setTemporalEaseAtKey(kStart${animIndex},`)
          .replace(/setTemporalEaseAtKey\(2,/g, `setTemporalEaseAtKey(kEnd${animIndex},`),
      ].join("\n");
      lines.push(easingCode);
    }
  }

  return lines.join("\n");
}

function generateAnchorPointAdjustment(anchor: string): string[] {
  const lines = [
    "var rect = layer.sourceRectAtTime(0, false);",
    'var ap = layer.property("Transform").property("Anchor Point");',
  ];

  switch (anchor) {
    case "bottom":
      lines.push("ap.setValue([rect.left + rect.width / 2, rect.top + rect.height]);");
      break;
    case "top":
      lines.push("ap.setValue([rect.left + rect.width / 2, rect.top]);");
      break;
    case "left":
      lines.push("ap.setValue([rect.left, rect.top + rect.height / 2]);");
      break;
    case "right":
      lines.push("ap.setValue([rect.left + rect.width, rect.top + rect.height / 2]);");
      break;
  }

  return lines;
}

function getDefaultFrom(property: PropertyName): number | [number, number] {
  switch (property) {
    case "opacity": return 0;
    case "scale": return 0;
    case "position": return [0, 0];
    case "rotation": return 0;
  }
}

function getDefaultTo(property: PropertyName): number | [number, number] {
  switch (property) {
    case "opacity": return 100;
    case "scale": return 100;
    case "position": return [0, 0];
    case "rotation": return 0;
  }
}

export { aePropertyNames };
