import type { Target } from "../schema/types.js";

/**
 * Generate ExtendScript code that populates a `layers` array
 * based on the targeting mode.
 */
export function generateTargeting(target: Target): string {
  const lines: string[] = ["var layers = [];"];

  switch (target.mode) {
    case "all":
      lines.push(
        "for (var li = 1; li <= comp.numLayers; li++) {",
        "    layers.push(comp.layer(li));",
        "}"
      );
      break;

    case "selected":
      lines.push(
        "var sel = comp.selectedLayers;",
        "for (var li = 0; li < sel.length; li++) {",
        "    layers.push(sel[li]);",
        "}"
      );
      break;

    case "pattern":
      if (!target.pattern) {
        throw new Error("Target mode 'pattern' requires a pattern string");
      }
      // Escape the pattern for use in a RegExp constructor
      const escapedPattern = target.pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      lines.push(
        `var pat = new RegExp("${escapedPattern}", "i");`,
        "for (var li = 1; li <= comp.numLayers; li++) {",
        '    if (pat.test(comp.layer(li).name)) {',
        "        layers.push(comp.layer(li));",
        "    }",
        "}"
      );
      break;
  }

  // Apply limit if specified
  if (target.limit !== undefined && target.limit > 0) {
    lines.push(`layers = layers.slice(0, ${target.limit});`);
  }

  return lines.join("\n");
}
