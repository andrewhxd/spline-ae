import type { Stagger } from "../schema/types.js";

/**
 * Generate ExtendScript code that computes stagger delay for each layer.
 * The code assumes `layers` array and `layerIndex` (0-based) are available.
 *
 * For spatial orders (left-to-right), sorting happens in the generated
 * ExtendScript because position values are only known at AE runtime.
 */
export function generateStagger(stagger: Stagger): string {
  const lines: string[] = [];

  switch (stagger.order) {
    case "index":
      lines.push(`var staggerDelay = layerIndex * ${stagger.delay};`);
      break;

    case "reverse":
      lines.push(
        `var staggerDelay = (layers.length - 1 - layerIndex) * ${stagger.delay};`
      );
      break;

    case "center": {
      lines.push(
        "var center = (layers.length - 1) / 2;",
        `var staggerDelay = Math.abs(layerIndex - center) * ${stagger.delay};`
      );
      break;
    }

    case "random": {
      // Seeded LCG PRNG for deterministic random order
      const seed = stagger.seed ?? 42;
      lines.push(
        "// Seeded PRNG (LCG) for deterministic random stagger",
        `var seed = ${seed};`,
        "function nextRand() {",
        "    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;",
        "    return seed / 0x7fffffff;",
        "}",
        "// Shuffle layer indices using Fisher-Yates",
        "var order = [];",
        "for (var si = 0; si < layers.length; si++) { order.push(si); }",
        "for (var si = order.length - 1; si > 0; si--) {",
        "    var ri = Math.floor(nextRand() * (si + 1));",
        "    var tmp = order[si]; order[si] = order[ri]; order[ri] = tmp;",
        "}",
        "var staggerRank = 0;",
        "for (var si = 0; si < order.length; si++) {",
        "    if (order[si] === layerIndex) { staggerRank = si; break; }",
        "}",
        `var staggerDelay = staggerRank * ${stagger.delay};`
      );
      break;
    }

    case "left-to-right": {
      // Sort layers by X position at comp start time — must happen in AE runtime
      lines.push(
        "// Sort layers by X position for left-to-right stagger",
        "var sortedIndices = [];",
        "for (var si = 0; si < layers.length; si++) {",
        '    var xPos = layers[si].property("Position").value[0];',
        "    sortedIndices.push({ idx: si, x: xPos });",
        "}",
        "sortedIndices.sort(function(a, b) { return a.x - b.x; });",
        "var staggerRank = 0;",
        "for (var si = 0; si < sortedIndices.length; si++) {",
        "    if (sortedIndices[si].idx === layerIndex) { staggerRank = si; break; }",
        "}",
        `var staggerDelay = staggerRank * ${stagger.delay};`
      );
      break;
    }
  }

  return lines.join("\n");
}
