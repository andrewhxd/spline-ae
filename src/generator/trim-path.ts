import type { EasingType } from "../schema/types.js";
import { generateEasing } from "./easing.js";

interface TrimPathOptions {
  trimVar: string;
  fromValue: number;
  toValue: number;
  duration: number;
  easing: EasingType;
  delay?: number;
  startAt?: number;
}

/**
 * Generate ExtendScript keyframes on Trim Paths "End" property.
 * Trim Paths lives under Contents, not Transform, so it needs
 * its own generator separate from keyframes.ts.
 */
export function generateTrimPathAnimation(options: TrimPathOptions): string {
  const { trimVar, fromValue, toValue, duration, easing, delay, startAt } = options;
  const lines: string[] = [];

  const endProp = `${trimVar}.property("End")`;

  if (startAt !== undefined) {
    lines.push(`var trimStart = ${startAt};`);
  } else {
    const delayVal = delay ?? 0;
    lines.push(`var trimStart = comp.displayStartTime + ${delayVal};`);
  }
  lines.push(`var trimEnd = trimStart + ${duration};`);

  lines.push(`${endProp}.setValueAtTime(trimStart, ${fromValue});`);
  lines.push(`${endProp}.setValueAtTime(trimEnd, ${toValue});`);

  // Apply easing
  const easingResult = generateEasing(easing, endProp, [1, 2]);
  if (easingResult.code) {
    const easingCode = [
      `var trimKStart = ${endProp}.numKeys - 1;`,
      `var trimKEnd = ${endProp}.numKeys;`,
      easingResult.code
        .replace(/setTemporalEaseAtKey\(1,/g, "setTemporalEaseAtKey(trimKStart,")
        .replace(/setTemporalEaseAtKey\(2,/g, "setTemporalEaseAtKey(trimKEnd,"),
    ].join("\n");
    lines.push(easingCode);
  }

  return lines.join("\n");
}
