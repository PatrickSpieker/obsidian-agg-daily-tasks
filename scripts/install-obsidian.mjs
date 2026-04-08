import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const pluginId = "agg-daily-tasks";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: npm run install:obsidian -- <path-to-vault-or-plugin-dir>");
  process.exit(1);
}

const resolvedInputPath = path.resolve(process.cwd(), inputPath);

let destinationDir = resolvedInputPath;

if (!existsSync(resolvedInputPath)) {
  console.error(`Target path does not exist: ${resolvedInputPath}`);
  process.exit(1);
}

if (!statSync(resolvedInputPath).isDirectory()) {
  console.error(`Target path is not a directory: ${resolvedInputPath}`);
  process.exit(1);
}

if (path.basename(resolvedInputPath) !== pluginId) {
  destinationDir = path.join(
    resolvedInputPath,
    ".obsidian",
    "plugins",
    pluginId
  );
}

const buildResult = spawnSync(
  process.execPath,
  [path.join(repoRoot, "esbuild.config.mjs"), "production"],
  { cwd: repoRoot, stdio: "inherit" }
);

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

mkdirSync(destinationDir, { recursive: true });

const filesToCopy = ["main.js", "manifest.json"];
const optionalFiles = ["styles.css"];

for (const fileName of filesToCopy) {
  copyFileSync(
    path.join(repoRoot, fileName),
    path.join(destinationDir, fileName)
  );
}

for (const fileName of optionalFiles) {
  const sourcePath = path.join(repoRoot, fileName);
  if (existsSync(sourcePath)) {
    copyFileSync(sourcePath, path.join(destinationDir, fileName));
  }
}

console.log(`Installed plugin to ${destinationDir}`);
console.log("Reload Obsidian, then enable the plugin in Community Plugins if needed.");
