<img src="assets/icon.svg" width="64" height="64" alt="">

# tokyonight-chrome-theme

Four Chrome themes based on TokyoNight: Night, Storm, Moon, and Dusk. Dusk uses the color overrides from `~/.config/nvim/lua/plugins/colorscheme.lua` as its custom accent palette.

## Build

Requires Node.js. Run:

```sh
npm run build
```

The build writes a separate unpacked Chrome theme to each folder under `dist/`.

## Try a theme in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Choose **Load unpacked** and select a folder such as `dist/dusk`.
4. To switch variants, or to pick up a rebuild, choose **Load unpacked** again.

Chrome applies one theme at a time. To go back to the default, open `chrome://settings/appearance` and choose **Reset to default**.

The manifest icons are PNGs in `assets/icons/`, rendered from `assets/icon.svg`. After editing the SVG, run `npm run icons` (requires `rsvg-convert`).

Edit the hex colors in `src/palettes.json`, then run the build again. Chrome themes use RGB values in their generated manifests.

A variant can also set `frame_gradient` in `src/palettes.json` to put a horizontal gradient behind the tab strip. `stops` lists the colours from left to right. `inactive`, `incognito` and `incognito_inactive` fade those stops toward another colour for each window state. The build writes the PNGs to `dist/<variant>/images/`.

## Palette page

The build also writes `dist/palette.html`, which lists every Dusk colour with its hex, RGB and HSL values. To view it in a browser, run `npm run serve` and open <http://127.0.0.1:8765/palette.html>.

## Package for the Chrome Web Store

```sh
npm run package
```

This builds the themes and writes one zip per variant to `packages/`, such as `packages/tokyonight-dusk-1.0.0.zip`. Each variant is a separate store item. Bump `version` in `package.json` before uploading an update.

## Credits

TokyoNight was created by [enkia](https://github.com/enkia) as the [Tokyo Night VS Code theme](https://github.com/enkia/tokyo-night-vscode-theme) (MIT). [folke](https://github.com/folke) ported it to Neovim as [tokyonight.nvim](https://github.com/folke/tokyonight.nvim) (Apache-2.0), which added the Moon variant. The Night, Storm and Moon colours here come from tokyonight.nvim. Dusk is a custom variant built on Night.

This project contains no code from either theme, only their colour values.

## License

[MIT](LICENSE)
