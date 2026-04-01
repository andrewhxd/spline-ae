import { execSync } from "node:child_process";
import { writeFileSync, mkdtempSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export interface RunResult {
  success: boolean;
  output: string;
  error?: string;
}

const TIMEOUT_MS = 30_000;

/**
 * Detect the After Effects application name via System Events.
 * Falls back to "Adobe After Effects 2025" if detection fails.
 */
function detectAEAppName(): string {
  try {
    const appleScript = [
      'tell application "System Events"',
      '  set appList to name of every application process whose name starts with "Adobe After Effects"',
      "  if (count of appList) > 0 then",
      "    return item 1 of appList",
      "  else",
      '    return "Adobe After Effects 2025"',
      "  end if",
      "end tell",
    ].join("\n");

    const tmpDir = mkdtempSync(join(tmpdir(), "spline-detect-"));
    const scptPath = join(tmpDir, "detect.scpt");
    writeFileSync(scptPath, appleScript, "utf-8");

    try {
      const result = execSync(`osascript "${scptPath}"`, {
        timeout: 5000,
        encoding: "utf-8",
      }).trim();
      return result || "Adobe After Effects 2025";
    } finally {
      try { unlinkSync(scptPath); } catch {}
    }
  } catch {
    return "Adobe After Effects 2025";
  }
}

/**
 * Execute an ExtendScript string in After Effects via osascript.
 * Writes both the JSX and the AppleScript to temp files to avoid escaping issues.
 */
export function executeInAE(script: string): RunResult {
  const tmpDir = mkdtempSync(join(tmpdir(), "spline-"));
  const scriptPath = join(tmpDir, "spline-script.jsx");
  const scptPath = join(tmpDir, "run.scpt");

  writeFileSync(scriptPath, script, "utf-8");

  try {
    const appName = detectAEAppName();
    const appleScript = [
      `tell application "${appName}"`,
      `  DoScriptFile "${scriptPath}"`,
      `end tell`,
    ].join("\n");

    writeFileSync(scptPath, appleScript, "utf-8");

    const output = execSync(`osascript "${scptPath}"`, {
      timeout: TIMEOUT_MS,
      encoding: "utf-8",
    });

    return { success: true, output: output.trim() };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error };
  } finally {
    try { unlinkSync(scriptPath); } catch {}
    try { unlinkSync(scptPath); } catch {}
  }
}

/**
 * Save an ExtendScript to a file without executing it.
 */
export function saveScript(script: string, outputPath: string): void {
  writeFileSync(outputPath, script, "utf-8");
}
