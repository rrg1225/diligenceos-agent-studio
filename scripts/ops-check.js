import { readFileSync } from "node:fs";

const checks = [
  {
    name: "security headers",
    ok: readFileSync("server/runtime.js", "utf8").includes("content-security-policy")
  },
  {
    name: "request correlation",
    ok: readFileSync("server/runtime.js", "utf8").includes("x-request-id")
  },
  {
    name: "guardrail classifier",
    ok: readFileSync("server/agent/policies.js", "utf8").includes("classifyRequest")
  },
  {
    name: "eval suite",
    ok: readFileSync("package.json", "utf8").includes("\"eval\"")
  }
];

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(failed.map((check) => `[ops] failed: ${check.name}`).join("\n"));
  process.exit(1);
}

console.log(`[ops] ${checks.length} operational checks passed`);
