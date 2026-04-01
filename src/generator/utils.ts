// ES3 code-generation helpers for ExtendScript output

/**
 * Wrap code in an Immediately Invoked Function Expression.
 * All generated scripts use this to avoid polluting AE global scope.
 */
export function wrapIIFE(body: string): string {
  return `(function() {\n${body}\n})();`;
}

/**
 * Generate an ES3 var declaration.
 */
export function varDecl(name: string, value: string): string {
  return `var ${name} = ${value};`;
}

/**
 * Generate an ES3 array literal from items.
 */
export function arrayLiteral(items: string[]): string {
  if (items.length === 0) return "[]";
  return `[${items.join(", ")}]`;
}

/**
 * Indent each line of code by a given number of spaces.
 */
export function indent(code: string, spaces: number = 4): string {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n");
}

/**
 * Generate a comment line.
 */
export function comment(text: string): string {
  return `// ${text}`;
}

/**
 * Join multiple code fragments with newlines, filtering out empty strings.
 */
export function joinCode(fragments: string[]): string {
  return fragments.filter((f) => f.length > 0).join("\n");
}
