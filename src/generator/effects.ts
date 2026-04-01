import type { Effect } from "../schema/types.js";

/**
 * AE effect match names and their configurable properties.
 */
const effectMatchNames: Record<string, { matchName: string; props: Record<string, string> }> = {
  glow: {
    matchName: "ADBE Glo2",
    props: {
      threshold: "ADBE Glo2-0001",      // Glow Threshold
      radius: "ADBE Glo2-0002",         // Glow Radius
      intensity: "ADBE Glo2-0003",      // Glow Intensity
    },
  },
  blur: {
    matchName: "ADBE Gaussian Blur 2",
    props: {
      blurriness: "ADBE Gaussian Blur 2-0001", // Blurriness
    },
  },
  "drop-shadow": {
    matchName: "ADBE Drop Shadow",
    props: {
      distance: "ADBE Drop Shadow-0004",   // Distance
      softness: "ADBE Drop Shadow-0005",   // Softness
      opacity: "ADBE Drop Shadow-0002",    // Opacity
      direction: "ADBE Drop Shadow-0003",  // Direction
    },
  },
};

/**
 * Generate ExtendScript code to apply an effect to the current layer.
 * Assumes `layer` variable is available in scope.
 */
export function generateEffect(effect: Effect, effectIndex: number): string {
  const config = effectMatchNames[effect.type];
  if (!config) {
    return `// Unknown effect type: ${effect.type}`;
  }

  const varName = `eff${effectIndex}`;
  const lines: string[] = [
    `var ${varName} = layer.property("Effects").addProperty("${config.matchName}");`,
  ];

  for (const [paramName, paramValue] of Object.entries(effect.params)) {
    const matchName = config.props[paramName];
    if (matchName) {
      lines.push(
        `${varName}.property("${matchName}").setValue(${paramValue});`
      );
    }
  }

  return lines.join("\n");
}

/**
 * Generate code for all effects on a layer.
 */
export function generateEffects(effects: Effect[]): string {
  return effects
    .map((effect, index) => generateEffect(effect, index))
    .join("\n");
}

export { effectMatchNames };
