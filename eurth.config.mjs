// What the hub is called and where it lives. Read at build time only: astro.config.mjs, the
// frontmatter of .astro pages, tests and tools/. Never import this from a Svelte component or a
// <script>: it pulls in the list of every Eurth tool, and browser code must not carry that
// (HANDBOOK.md, Launch). Hand a component what it needs as props instead.
import { buildTime, defineSite, launchedTools } from '@eurth/style/build';

/**
 * Extra lines for llms.txt: the tools that are live at a moment, and never one whose door is
 * still closed.
 * @param {Date} at
 */
export function llmsFor(at) {
  const live = launchedTools(at).filter((tool) => tool.kind !== 'hub');
  return ['## Tools', '', ...live.map((tool) => `- [${tool.name}](${tool.url}/): ${tool.pitch}`)].join('\n');
}

export const site = defineSite({
  // The subdomain, and the hub's id in @eurth/style's tools.json.
  id: 'tools',
  name: 'Tools',
  url: 'https://tools.eurth.org',
  // The hub isn't a maker, so its title leads with what people search for.
  title: 'Free worldbuilding tools by Eurth: flags, governments, maps and more',
  description: 'Free worldbuilding tools from the Eurth community: a flag maker, a government builder, a world map and more. In your browser, with no account, no ads and nothing tracked.',
  tagline: 'Free worldbuilding tools',
  pages: [
    { href: '/', label: 'All tools' },
    { href: '/advent/', label: 'Advent' },
    { href: '/changelog/', label: 'Changelog' },
    { href: '/about/', label: 'About' },
  ],
  repo: 'https://github.com/eurth-org/eurth-tools',
  ogAlt: 'Free worldbuilding tools, at tools.eurth.org: the Eurth yurt beside an advent calendar of fifteen numbered doors, all of them closed.',
  category: 'ReferenceApplication',
  llms: llmsFor(buildTime()),
});
