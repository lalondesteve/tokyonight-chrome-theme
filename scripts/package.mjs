// Zips each built variant in dist/ for upload to the Chrome Web Store.
// The manifest sits at the root of each zip, and Chrome's local
// "Cached Theme.pak" is left out.
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const out = path.join(root, "packages");
const { version } = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const entry of await readdir(dist, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const zip = path.join(out, `tokyonight-${entry.name}-${version}.zip`);
  execFileSync("zip", ["-r", "-X", "-q", zip, ".", "-x", "Cached Theme.pak", "-x", ".*"], {
    cwd: path.join(dist, entry.name),
  });
  console.log(`Packaged ${entry.name}: ${path.relative(root, zip)}`);
}
