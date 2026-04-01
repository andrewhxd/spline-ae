import type { CreateTextAction } from "../schema/types.js";
import { generateInlineAnimation } from "./inline-animation.js";
import { comment } from "./utils.js";

/**
 * Generate ExtendScript code to create a text layer and optionally animate it.
 */
export function generateCreateText(action: CreateTextAction, actionIndex: number): string {
  const layerVar = `textLayer${actionIndex}`;
  const docVar = `textDoc${actionIndex}`;
  const lines: string[] = [];

  lines.push(comment(`Create Text: "${action.name}"`));

  // Escape quotes in text content
  const escapedText = action.text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.push(`var ${layerVar} = comp.layers.addText("${escapedText}");`);
  lines.push(`${layerVar}.name = "${action.name}";`);

  // Position
  if (action.position) {
    lines.push(
      `${layerVar}.property("Transform").property("Position").setValue([${action.position[0]}, ${action.position[1]}]);`
    );
  }

  // Text styling
  if (action.style) {
    lines.push(`var ${docVar} = ${layerVar}.property("Source Text").value;`);

    if (action.style.fontSize !== undefined) {
      lines.push(`${docVar}.fontSize = ${action.style.fontSize};`);
    }
    if (action.style.fontFamily !== undefined) {
      lines.push(`${docVar}.font = "${action.style.fontFamily}";`);
    }
    if (action.style.fillColor !== undefined) {
      const [r, g, b] = action.style.fillColor;
      lines.push(`${docVar}.fillColor = [${r}, ${g}, ${b}];`);
    }
    if (action.style.justification !== undefined) {
      const justMap: Record<string, string> = {
        left: "ParagraphJustification.LEFT_JUSTIFY",
        center: "ParagraphJustification.CENTER_JUSTIFY",
        right: "ParagraphJustification.RIGHT_JUSTIFY",
      };
      lines.push(`${docVar}.justification = ${justMap[action.style.justification]};`);
    }

    lines.push(`${layerVar}.property("Source Text").setValue(${docVar});`);

    // Set layer opacity if specified in style
    if (action.style.opacity !== undefined) {
      lines.push(
        `${layerVar}.property("Transform").property("Opacity").setValue(${action.style.opacity});`
      );
    }
  }

  // Inline animation
  if (action.animate) {
    lines.push("");
    lines.push(
      generateInlineAnimation({
        animate: action.animate,
        layerVar,
        actionIndex,
      })
    );
  }

  return lines.join("\n");
}
