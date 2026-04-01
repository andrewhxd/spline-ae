import type { EasingType } from "../schema/types.js";
import { generateEasing } from "./easing.js";

interface TypewriterOptions {
  layerVar: string;
  fromValue: number;
  toValue: number;
  duration: number;
  easing: EasingType;
  delay?: number;
  startAt?: number;
}

/**
 * Generate ExtendScript for a Text Animator typewriter effect.
 * Uses a Range Selector End keyframe from 0% → 100% with Opacity = 0
 * to progressively reveal characters.
 */
export function generateTypewriterAnimation(options: TypewriterOptions): string {
  var { layerVar, fromValue, toValue, duration, easing, delay, startAt } = options;
  var lines: string[] = [];

  // Access Text Animators and add a new animator
  lines.push("var textProps = " + layerVar + '.property("ADBE Text Properties");');
  lines.push('var animators = textProps.property("ADBE Text Animators");');
  lines.push('var animator = animators.addProperty("ADBE Text Animator");');

  // Add Opacity property and set to 0
  lines.push('var opacityProp = animator.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");');
  lines.push("opacityProp.setValue(0);");

  // Get Range Selector (default exists on new animator) and keyframe End property
  lines.push('var selectors = animator.property("ADBE Text Selectors");');
  lines.push("var selector = selectors.numProperties > 0 ? selectors.property(1) : selectors.addProperty(\"ADBE Text Selector\");");
  lines.push('var endProp = selector.property("ADBE Text Percent End");');

  // Calculate timing
  if (startAt !== undefined) {
    lines.push("var twStart = " + startAt + ";");
  } else {
    var delayVal = delay ?? 0;
    lines.push("var twStart = comp.displayStartTime + " + delayVal + ";");
  }
  lines.push("var twEnd = twStart + " + duration + ";");

  // Set keyframes
  lines.push("endProp.setValueAtTime(twStart, " + fromValue + ");");
  lines.push("endProp.setValueAtTime(twEnd, " + toValue + ");");

  // Apply easing
  var easingResult = generateEasing(easing, "endProp", [1, 2]);
  if (easingResult.code) {
    var easingCode = [
      "var twKStart = endProp.numKeys - 1;",
      "var twKEnd = endProp.numKeys;",
      easingResult.code
        .replace(/setTemporalEaseAtKey\(1,/g, "setTemporalEaseAtKey(twKStart,")
        .replace(/setTemporalEaseAtKey\(2,/g, "setTemporalEaseAtKey(twKEnd,"),
    ].join("\n");
    lines.push(easingCode);
  }

  return lines.join("\n");
}
