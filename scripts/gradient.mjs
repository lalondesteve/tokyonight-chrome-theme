// Writes horizontal-gradient PNGs for a theme's frame images, without
// external dependencies.
import { deflateSync } from "node:zlib";

const WIDTH = 3840; // wide enough that the gradient doesn't repeat on large displays
const HEIGHT = 128; // taller than Chrome's tab strip

const parse = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// stops: array of hex colours, evenly spaced from left to right.
// fade: optional { toward: hex, amount: 0..1 } to blend every stop toward a colour.
// span: pixels the gradient covers before holding its last colour. Chrome maps
// one image pixel to one screen pixel, so on a Retina display a 1,000pt-wide
// window shows the first 2,000 pixels.
export function gradientPng(stops, fade, span = WIDTH) {
  let colors = stops.map(parse);
  if (fade) colors = colors.map((c) => mix(c, parse(fade.toward), fade.amount));

  const row = Buffer.alloc(1 + WIDTH * 3); // filter byte + RGB pixels
  for (let x = 0; x < WIDTH; x++) {
    const pos = (Math.min(x, span - 1) / (span - 1)) * (colors.length - 1);
    const i = Math.min(Math.floor(pos), colors.length - 2);
    const [r, g, b] = mix(colors[i], colors[i + 1], pos - i);
    row.set([Math.round(r), Math.round(g), Math.round(b)], 1 + x * 3);
  }
  const raw = Buffer.concat(Array.from({ length: HEIGHT }, () => row));

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit, truecolour, no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
