// Writes dist/palette.html listing every colour in the built Dusk manifest.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const variant = process.argv[2] ?? "dusk";
const manifest = JSON.parse(
  await readFile(path.join(root, "dist", variant, "manifest.json"), "utf8"),
);
const colors = Object.entries(manifest.theme.colors);

const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
function hsl([r, g, b]) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

const rows = colors
  .map(([key, rgb], i) => `<tr${i % 2 ? ' class="alt"' : ""}><td><span class="dot" style="background:${hex(rgb)}"></span><span class="key">${key}</span></td><td class="hex">${hex(rgb)}</td><td>rgb(${rgb.join(", ")})</td><td>${hsl(rgb)}</td></tr>`)
  .join("\n");

await writeFile(path.join(root, "dist", "palette.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${manifest.name} palette</title>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Inter:wght@400;700&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#1a1b26;color:#c0caf5;font-family:Inter,system-ui,sans-serif;font-size:16px}
main{max-width:1100px;margin:0 auto;padding:40px 16px 80px}
h1{color:#f7768e;font-size:40px;margin:0 0 12px}
.lead{font-size:20px;margin:0 0 48px;color:#a9b1d6}
h2{color:#9ece6a;font-size:24px;margin:0;padding:24px 0;border-bottom:1px solid #414868;width:max-content;min-width:200px}
table{width:100%;border-collapse:collapse;margin-bottom:64px;font-family:"Fira Code",monospace;font-size:15px}
th{text-align:left;font-family:Inter,sans-serif;font-weight:400;font-size:19px;color:#7aa2f7;padding:0 16px 16px 0;border-bottom:1px solid #c0caf5}
td{padding:14px 16px 14px 0;vertical-align:middle;white-space:nowrap}
tr.alt td{background:rgba(65,72,104,.5)}
.dot{display:inline-block;width:20px;height:20px;border-radius:50%;vertical-align:middle;margin-right:14px}
.key{color:#9aa5ce}
.hex{cursor:pointer}.hex:hover{color:#7dcfff}
@media (max-width:700px){td,th{white-space:normal}.key{display:block;margin-left:34px}}
</style></head><body><main>
<h1>${manifest.name}</h1>
<p class="lead">Every colour in <code>dist/${variant}/manifest.json</code>. Click a hex value to copy it.</p>
<h2>Theme colours (${colors.length})</h2>
<table><thead><tr><th>Chrome key</th><th>Hex</th><th>RGB</th><th>HSL</th></tr></thead><tbody>
${rows}
</tbody></table>
</main>
<script>
document.querySelectorAll(".hex").forEach((c) => c.addEventListener("click", () => {
  try { navigator.clipboard.writeText(c.textContent); } catch {}
}));
</script>
</body></html>
`);
console.log(`Built palette: dist/palette.html (${colors.length} ${variant} colours)`);
