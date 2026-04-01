import type { PropertyName } from "../schema/types.js";

interface ClampRange {
  min: number;
  max: number;
}

const clampRanges: Partial<Record<PropertyName, ClampRange>> = {
  opacity: { min: 0, max: 100 },
  rotation: { min: -360, max: 360 },
  // scale: min 0, no upper bound — handled specially
};

/**
 * Generate an ES3 clamp expression for a value.
 * Returns the clamped expression string, or the original if no clamping needed.
 */
export function clampValue(property: PropertyName, valueExpr: string): string {
  if (property === "scale") {
    return `Math.max(0, ${valueExpr})`;
  }

  const range = clampRanges[property];
  if (!range) return valueExpr;

  return `Math.min(${range.max}, Math.max(${range.min}, ${valueExpr}))`;
}

/**
 * Generate ES3 code for a clamp helper function to embed in generated scripts.
 */
export function generateClampFunction(): string {
  return [
    "function clamp(val, minVal, maxVal) {",
    "    return Math.min(maxVal, Math.max(minVal, val));",
    "}",
  ].join("\n");
}

export { clampRanges };
