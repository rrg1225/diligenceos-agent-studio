import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { evidenceCorpus } from "./agent/evidence.js";
import { runDiligenceAgent } from "./agent/loop.js";
import { toolCatalog } from "./agent/tools.js";
import { createRuntimeState, installRuntimeControls, operationalScorecard, runtimeMetrics } from "./runtime.js";
import { asyncRoute, errorHandler, notFound, requireObjectBody } from "./http.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

export function createApp() {
  const app = express();
  const runtime = createRuntimeState("diligenceos-agent-studio");

  installRuntimeControls(app, runtime);
  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "diligenceos-agent-studio",
      mode: process.env.AGENT_MODE || "dry-run",
      provider: process.env.OPENAI_API_KEY ? "openai-compatible-ready" : "deterministic"
    });
  });

  app.get("/api/tools", (_req, res) => res.json(toolCatalog));
  app.get("/api/evidence", (_req, res) => res.json(evidenceCorpus));
  app.get("/api/metrics/runtime", (_req, res) => res.json(runtimeMetrics(runtime)));
  app.get("/api/metrics/scorecard", (_req, res) => res.json(operationalScorecard(runtime)));

  app.post("/api/runs", asyncRoute(async (req, res) => {
    const body = requireObjectBody(req.body);
    const run = await runDiligenceAgent(requireObjectBody(body.profile || body), {
      mode: body.mode,
      maxSteps: body.maxSteps
    });
    await persistTrace(run);
    res.status(run.status === "failed" ? 500 : 200).json(run);
  }));

  app.use("/api", notFound);
  app.use(express.static(join(rootDir, "dist")));
  app.get("*", (_req, res) => res.sendFile(join(rootDir, "dist", "index.html")));
  app.use(errorHandler("diligenceos-agent-studio"));
  return app;
}

async function persistTrace(run) {
  const traceDir = join(rootDir, "traces");
  await mkdir(traceDir, { recursive: true });
  await writeFile(join(traceDir, `${run.runId}.json`), JSON.stringify(run, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4620);
  createApp().listen(port, () => {
    console.log(`DiligenceOS Agent Studio running on http://localhost:${port}`);
  });
}
