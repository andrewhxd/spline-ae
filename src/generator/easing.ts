import type { EasingType } from "../schema/types.js";

export interface EasingResult {
  /** ExtendScript code to apply the easing */
  code: string;
  /** Whether an expression string is applied to the property */
  usesExpression: boolean;
}

/**
 * Native easing parameters: [inSpeed, inInfluence, outSpeed, outInfluence]
 * Used with setTemporalEaseAtKey via KeyframeEase(speed, influence).
 */
const nativeEasingParams: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 0, 0], // no ease
  easeOutCubic: [0, 0.1, 0, 80],
  easeOutExpo: [0, 0.1, 0, 95],
  easeInOutQuad: [0, 50, 0, 50],
};

/**
 * Generate easing code for a property's keyframes.
 *
 * @param easing - Named easing type
 * @param propVar - Variable name of the AE property in generated code
 * @param keyIndices - Array of keyframe indices (1-based) that were added
 * @returns EasingResult with code string and expression flag
 */
export function generateEasing(
  easing: EasingType,
  propVar: string,
  keyIndices: [number, number]
): EasingResult {
  // easeOutBack requires expression — native KeyframeEase can't do overshoot
  if (easing === "easeOutBack") {
    return generateEaseOutBackExpression(propVar);
  }

  const params = nativeEasingParams[easing];
  if (!params) {
    // Fallback: no easing applied
    return { code: "", usesExpression: false };
  }

  // linear: special case — flat interpolation, no ease needed
  if (easing === "linear") {
    return { code: "", usesExpression: false };
  }

  const [inSpeed, inInfluence, outSpeed, outInfluence] = params;
  const [startKey, endKey] = keyIndices;

  const lines = [
    `var easeIn = new KeyframeEase(${inSpeed}, ${inInfluence});`,
    `var easeOut = new KeyframeEase(${outSpeed}, ${outInfluence});`,
    `${propVar}.setTemporalEaseAtKey(${startKey}, [easeIn], [easeOut]);`,
    `${propVar}.setTemporalEaseAtKey(${endKey}, [easeIn], [easeOut]);`,
  ];

  return { code: lines.join("\n"), usesExpression: false };
}

function generateEaseOutBackExpression(propVar: string): EasingResult {
  // Expression-based easeOutBack with overshoot
  const expr = [
    "var t = (time - thisProperty.key(1).time) / (thisProperty.key(2).time - thisProperty.key(1).time);",
    "if (t < 0) t = 0;",
    "if (t > 1) t = 1;",
    "var s = 1.70158;",
    "t = t - 1;",
    "var val = t * t * ((s + 1) * t + s) + 1;",
    "var startVal = thisProperty.key(1).value;",
    "var endVal = thisProperty.key(2).value;",
    "startVal + (endVal - startVal) * val;",
  ].join("\\n");

  const code = `${propVar}.expression = "${expr}";`;
  return { code, usesExpression: true };
}

export { nativeEasingParams };
