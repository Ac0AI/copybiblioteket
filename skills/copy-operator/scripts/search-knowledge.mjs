import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

try {
  const config = new URL("../copy-brains.local.json", import.meta.url);
  let configured, sourceDirectory;
  if (existsSync(config)) {
    const local = JSON.parse(readFileSync(config, "utf8"));
    configured = local.repoPath; sourceDirectory = local.sourceDirectory;
  }
  const repo = resolve(process.env.COPY_BRAINS_REPO ?? configured ?? fileURLToPath(new URL("../../../", import.meta.url)));
  const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  if (!["copybiblioteket", "copy-brains"].includes(pkg.name)) throw new Error("The configured directory is not Copy Brains.");
  const launcher = join(repo, "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(launcher)) throw new Error("Run npm ci in the Copy Brains checkout first.");
  const args = process.argv.slice(2);
  if (!["list", "search", "get", "sources", "guide", "people", "person"].includes(args[0] ?? "list")) {
    throw new Error("Use list, search, get, sources, guide, people or person.");
  }
  const result = spawnSync(process.execPath, [launcher, join(repo, "copy", "cli.ts"), ...args], {
    cwd: repo, stdio: "inherit", timeout: 30000,
    env: { ...process.env, ...(sourceDirectory ? { COPY_BRAINS_SOURCE_DIR: sourceDirectory } : {}) },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error("Copy Brains unavailable: " + error.message);
  process.exitCode = 1;
}
