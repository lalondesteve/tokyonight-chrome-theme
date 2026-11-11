import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gradientPng } from "./gradient.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) =>
  JSON.parse(await readFile(path.join(root, file), "utf8"));

const palettes = await readJson("src/palettes.json");
const { version } = await readJson("package.json");
const iconSizes = [16, 48, 128];

// Remove folders for variants that no longer exist, but leave current ones in
// place: Chrome keeps a loaded unpacked theme pointed at its folder.
const distDir = path.join(root, "dist");
await mkdir(distDir, { recursive: true });
for (const entry of await readdir(distDir, { withFileTypes: true })) {
  if (entry.isDirectory() && !(entry.name in palettes)) {
    await rm(path.join(distDir, entry.name), { recursive: true, force: true });
  }
}

for (const [slug, palette] of Object.entries(palettes)) {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error(`Invalid theme folder name: ${slug}`);
  }

  const colors = {};
  for (const [key, hex] of Object.entries(palette.colors)) {
    if (!/^#[\da-fA-F]{6}$/.test(hex)) {
      throw new Error(`${slug}.${key} must be a six-digit hex color, got ${hex}`);
    }
    colors[key] = hexToRgb(hex);
  }

  const manifest = {
    manifest_version: 3,
    name: palette.name,
    version,
    description: palette.description,
    icons: Object.fromEntries(
      iconSizes.map((size) => [size, `icons/icon-${size}.png`]),
    ),
    theme: { colors },
  };

  const outputDir = path.join(root, "dist", slug);
  await mkdir(path.join(outputDir, "icons"), { recursive: true });

  // Optional horizontal gradient behind the tab strip. Each frame state gets
  // its own image; without them Chrome tints the active image for the others.
  await rm(path.join(outputDir, "images"), { recursive: true, force: true });
  if (palette.frame_gradient) {
    const { stops, span, ...fades } = palette.frame_gradient;
    await mkdir(path.join(outputDir, "images"), { recursive: true });
    const images = {};
    const addImage = async (key, png) => {
      const file = `images/${key}.png`;
      await writeFile(path.join(outputDir, file), png);
      images[key] = file;
    };
    for (const [state, fade] of [["", undefined], ...Object.entries(fades)]) {
      await addImage(state ? `theme_frame_${state}` : "theme_frame", gradientPng(stops, fade, span));
    }
    // With a frame image, Chrome paints inactive tabs from that image and
    // ignores background_tab. Solid tab images keep the inactive tab colour.
    for (const [key, color] of [
      ["theme_tab_background", palette.colors.background_tab],
      ["theme_tab_background_incognito", palette.colors.background_tab_incognito],
    ]) {
      if (color) await addImage(key, gradientPng([color, color]));
    }
    manifest.theme.images = images;
  }
  for (const size of iconSizes) {
    const icon = `icons/icon-${size}.png`;
    await copyFile(path.join(root, "assets", icon), path.join(outputDir, icon));
  }
  await writeFile(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Built ${slug}: dist/${slug}`);
}

function hexToRgb(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}
