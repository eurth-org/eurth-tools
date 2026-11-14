// Makes the pictures that aren't drawn by hand, with the Chrome on this machine: the favicon,
// the home-screen icons and the sharing image. Run it after changing the sharing image, and
// commit what it writes to public/:  npm run images
//
// The sharing image shows the yurt, "Free worldbuilding tools" and the calendar's fifteen
// numbered doors, all closed. It is the same picture on every day of advent and after: it is
// drawn from numbers alone and never reads the list of tools, so it can't give a door away.
import { makeImages, sharingImage } from '@eurth/style/images';
import { resolveColors } from '@eurth/style';
import tokens from '@eurth/style/tokens.json' with { type: 'json' };
import { site } from '../eurth.config.mjs';

const night = resolveColors(tokens, 'dark');
const DOORS = 15;
const COLUMNS = 3;
const [WIDTH, HEIGHT, GAP] = [128, 92, 12];

/** Fifteen closed doors, three across: a number, a frame and a doorknob each. */
function doors() {
  const rows = Math.ceil(DOORS / COLUMNS);
  const width = COLUMNS * WIDTH + (COLUMNS - 1) * GAP;
  const height = rows * HEIGHT + (rows - 1) * GAP;
  const drawn = Array.from({ length: DOORS }, (_, i) => {
    const x = (i % COLUMNS) * (WIDTH + GAP);
    const y = Math.floor(i / COLUMNS) * (HEIGHT + GAP);
    return `<g transform="translate(${x} ${y})">
      <rect x="1.5" y="1.5" width="${WIDTH - 3}" height="${HEIGHT - 3}" rx="12" fill="${night['surface-raised']}" stroke="${night['line-strong']}" stroke-width="3"/>
      <circle cx="${WIDTH - 20}" cy="${HEIGHT / 2}" r="5" fill="${night['accent-fill']}"/>
      <text x="${WIDTH / 2 - 6}" y="${HEIGHT / 2 + 15}" text-anchor="middle" font-size="42" font-weight="700" fill="${night.ink}">${i + 1}</text>
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="${tokens.type.families.sans.replace(/"/g, "'")}">${drawn}</svg>`;
}

const made = await makeImages({
  sharing: [{ file: 'og.png', html: sharingImage({ site, art: doors(), title: 'Free worldbuilding tools', line: 'Flags, governments, maps and more, from a community that builds worlds' }) }],
});
console.log(`Made ${made.map((file) => `public/${file}`).join(', ')}`);
