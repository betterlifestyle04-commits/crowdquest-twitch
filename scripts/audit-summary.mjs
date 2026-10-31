#!/usr/bin/env node
/**
 * Human-readable summary of npm audit JSON.
 * Pipe npm audit --json to a file, then run node scripts/audit-summary.mjs <file>.
 * Uses only Node built-ins; prints no tokens, environment variables or credentials.
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/audit-summary.mjs <npm-audit-json-file>");
  process.exitCode = 2;
} else {
  try {
    const report = JSON.parse(readFileSync(file, "utf8"));
    const vulnerabilities = report.vulnerabilities ?? {};
    const counts = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
    for (const [name, item] of Object.entries(vulnerabilities)) {
      const severity = item.severity;
      if (severity in counts) counts[severity] += 1;
      const advisories = (item.via ?? [])
        .filter((via) => via && typeof via === "object")
        .map((via) => ({
          title: String(via.title ?? "Unknown").slice(0, 150),
          url: String(via.url ?? ""),
          range: String(via.range ?? "")
        }));
      const fixed = item.fixAvailable === false ? "none reported"
        : item.fixAvailable === true ? "compatible npm fix may exist"
        : typeof item.fixAvailable === "object"
          ? item.fixAvailable.name + "@" + item.fixAvailable.version + (item.fixAvailable.isSemVerMajor ? " (breaking)" : "")
          : "unknown";
      console.log(JSON.stringify({
        dependency: name,
        severity: severity ?? "unknown",
        isDirect: Boolean(item.isDirect),
        range: String(item.range ?? ""),
        fix: fixed,
        advisories
      }));
    }
    console.log("AUDIT SUMMARY:", JSON.stringify(counts));
    console.log("TOTAL:", Object.values(counts).reduce((a, b) => a + b, 0));
    // Diagnostic script intentionally doesn't fail CI yet; reports vulnerabilities honestly.
  } catch (error) {
    console.error("Unable to parse npm audit report:", error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
