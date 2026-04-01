import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validatePlan } from "./schema/validation.js";
import { generate } from "./generator/index.js";
import { executeInAE, saveScript } from "./runner/index.js";

function usage(): never {
  console.error("Usage: npm run apply <plan.json> [--dry-run] [--output file.jsx]");
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  let planPath: string | undefined;
  let dryRun = false;
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--output") {
      i++;
      outputPath = args[i];
      if (!outputPath) {
        console.error("Error: --output requires a file path");
        process.exit(1);
      }
    } else if (!planPath) {
      planPath = arg;
    } else {
      console.error(`Unknown argument: ${arg}`);
      usage();
    }
  }

  if (!planPath) usage();

  // Read and parse JSON
  let rawPlan: unknown;
  try {
    const content = readFileSync(resolve(planPath), "utf-8");
    rawPlan = JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error reading plan file: ${msg}`);
    process.exit(1);
  }

  // Validate
  const validation = validatePlan(rawPlan);
  if (!validation.success || !validation.plan) {
    console.error("Validation errors:");
    for (const error of validation.errors ?? []) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Generate ExtendScript
  const script = generate(validation.plan);

  // Output mode
  if (outputPath) {
    saveScript(script, resolve(outputPath));
    console.log(`Script saved to: ${outputPath}`);
    return;
  }

  if (dryRun) {
    console.log(script);
    return;
  }

  // Execute in After Effects
  console.log("Executing in After Effects...");
  const result = executeInAE(script);
  if (result.success) {
    console.log("Success!");
    if (result.output) console.log(result.output);
  } else {
    console.error(`Execution failed: ${result.error}`);
    process.exit(1);
  }
}

main();
