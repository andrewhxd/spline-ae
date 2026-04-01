import type { CreateShapeAction, Effect } from "../schema/types.js";
import { generateInlineAnimation } from "./inline-animation.js";
import { generateEffects } from "./effects.js";
import { comment } from "./utils.js";

/**
 * Generate ExtendScript code to create a shape layer and optionally animate it.
 */
export function generateCreateShape(action: CreateShapeAction, actionIndex: number): string {
  const layerVar = `shapeLayer${actionIndex}`;
  const contentsVar = `contents${actionIndex}`;
  const groupVar = `group${actionIndex}`;
  const pathGroupVar = `pathGroup${actionIndex}`;
  const lines: string[] = [];

  lines.push(comment(`Create Shape: "${action.name}"`));

  // Create shape layer
  lines.push(`var ${layerVar} = comp.layers.addShape();`);
  lines.push(`${layerVar}.name = "${action.name}";`);

  // Add shape contents group
  lines.push(`var ${contentsVar} = ${layerVar}.property("Contents");`);
  lines.push(`var ${groupVar} = ${contentsVar}.addProperty("ADBE Vector Group");`);
  lines.push(`var ${pathGroupVar} = ${groupVar}.property("Contents");`);

  // Shape-specific code
  if (action.shape === "line") {
    lines.push(...generateLinePath(action, actionIndex, pathGroupVar));
  }

  // Stroke
  const strokeVar = `stroke${actionIndex}`;
  lines.push(`var ${strokeVar} = ${pathGroupVar}.addProperty("ADBE Vector Graphic - Stroke");`);

  if (action.strokeColor) {
    const [r, g, b] = action.strokeColor;
    lines.push(`${strokeVar}.property("Color").setValue([${r}, ${g}, ${b}]);`);
  } else {
    lines.push(`${strokeVar}.property("Color").setValue([1, 1, 1]);`);
  }

  const strokeWidth = action.strokeWidth ?? 4;
  lines.push(`${strokeVar}.property("Stroke Width").setValue(${strokeWidth});`);

  // Fill color (optional for shapes)
  if (action.fillColor) {
    const fillVar = `fill${actionIndex}`;
    const [r, g, b] = action.fillColor;
    lines.push(`var ${fillVar} = ${pathGroupVar}.addProperty("ADBE Vector Graphic - Fill");`);
    lines.push(`${fillVar}.property("Color").setValue([${r}, ${g}, ${b}]);`);
  }

  // Trim Paths — add if animation requests trimPath
  let trimVar: string | undefined;
  const hasTrimPathAnim =
    action.animate &&
    "property" in action.animate &&
    action.animate.property === "trimPath";

  if (hasTrimPathAnim) {
    const trimVarName = `trim${actionIndex}`;
    trimVar = trimVarName;
    lines.push(`var ${trimVarName} = ${pathGroupVar}.addProperty("ADBE Vector Filter - Trim");`);
    lines.push(`${trimVarName}.property("End").setValue(0);`);
  }

  // Shorthand effects on the layer (e.g. ["glow"])
  if (action.effects && action.effects.length > 0) {
    lines.push("");
    lines.push(comment("Layer Effects"));
    const expandedEffects: Effect[] = action.effects.map((effectType) => ({
      type: effectType,
      params: {},
    }));
    lines.push(`var layer = ${layerVar};`);
    lines.push(generateEffects(expandedEffects));
  }

  // Inline animation
  if (action.animate) {
    lines.push("");
    lines.push(
      generateInlineAnimation({
        animate: action.animate,
        layerVar,
        actionIndex,
        trimVar,
      })
    );
  }

  return lines.join("\n");
}

function generateLinePath(
  action: CreateShapeAction,
  actionIndex: number,
  pathGroupVar: string
): string[] {
  const pathPropVar = `pathProp${actionIndex}`;
  const shapePathVar = `shapePath${actionIndex}`;
  const lines: string[] = [];

  lines.push(`var ${pathPropVar} = ${pathGroupVar}.addProperty("ADBE Vector Shape - Group");`);
  lines.push(`var ${shapePathVar} = new Shape();`);

  const from = action.from ?? [0, 0];
  const to = action.to ?? [100, 100];
  lines.push(
    `${shapePathVar}.vertices = [[${from[0]}, ${from[1]}], [${to[0]}, ${to[1]}]];`
  );
  lines.push(`${shapePathVar}.closed = false;`);
  lines.push(`${pathPropVar}.property("Path").setValue(${shapePathVar});`);

  return lines;
}
