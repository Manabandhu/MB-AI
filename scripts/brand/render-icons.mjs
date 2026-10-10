// Renders every raster app icon from the SVG sources in frontend/assets/brand. Run: pnpm brand:icons
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const brand = join(root, 'frontend/assets/brand');
const images = join(root, 'frontend/assets/images');
const web = join(root, 'frontend/public');
mkdirSync(web, { recursive: true });

const svg = (name) => join(brand, name);
const render = (source, size, out, options = {}) =>
  sharp(svg(source), { density: Math.max(72, Math.ceil((72 * size) / 1024) * 4) })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten(options.background ? { background: options.background } : false)
    .png({ compressionLevel: 9 })
    .toFile(out);

// iOS masks its own corners, so the store icon is the full-bleed tile (glyph over the square gradient).
async function fullBleedIcon(size, out) {
  const background = await sharp(svg('icon-background.svg'), { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer();
  const glyph = await sharp(svg('logo-glyph.svg'), { density: 300 })
    .resize(Math.round(size * 1.18), Math.round(size * 1.18))
    .extract({
      left: Math.round(size * 0.09),
      top: Math.round(size * 0.09),
      width: size,
      height: size,
    })
    .png()
    .toBuffer();
  await sharp(background)
    .composite([{ input: glyph }])
    .png({ compressionLevel: 9 })
    .toFile(out);
}

const jobs = [
  fullBleedIcon(1024, join(images, 'icon.png')),
  render('logo-glyph.svg', 1024, join(images, 'android-icon-foreground.png')),
  render('icon-background.svg', 1024, join(images, 'android-icon-background.png')),
  render('logo-mono.svg', 1024, join(images, 'android-icon-monochrome.png')),
  render('logo-mark.svg', 512, join(images, 'splash-icon.png')),
  render('logo-mark.svg', 48, join(images, 'favicon.png')),
  render('logo-mark.svg', 192, join(web, 'icon-192.png')),
  render('logo-mark.svg', 512, join(web, 'icon-512.png')),
  fullBleedIcon(180, join(web, 'apple-touch-icon.png')),
  fullBleedIcon(512, join(web, 'icon-maskable-512.png')),
];
await Promise.all(jobs);
console.log(`Rendered ${jobs.length} brand icons.`);
