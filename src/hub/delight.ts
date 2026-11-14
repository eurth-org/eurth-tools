/**
 * The hub's two small pleasures, as plain decisions the page's script acts on.
 *
 *   - Signature touch: today's door swings open on its hinge, once, the first time it is on
 *     screen in a visit.
 *   - Easter egg: typing "yurt" anywhere pitches a little yurt on the page, with sparkles.
 *
 * Nothing is stored, so "once in a visit" is worked out from how the page was reached. Safe for
 * the browser: nothing here knows about any tool.
 */

/** A listener for a word typed anywhere: feed it each key, and it answers true when the word is complete. */
export function wordListener(word: string): (key: string) => boolean {
  const target = [...word.toLowerCase()];
  if (!target.length) throw new Error('A word needs at least one letter');
  let typed: string[] = [];
  return (key: string) => {
    // Only single characters count: Shift, arrows and the like neither help nor reset.
    if ([...key].length !== 1) return false;
    typed.push(key.toLowerCase());
    if (typed.length > target.length) typed = typed.slice(-target.length);
    if (typed.length === target.length && typed.every((letter, i) => letter === target[i])) {
      typed = [];
      return true;
    }
    return false;
  };
}

/** What the script can tell about where a key was pressed. */
export interface KeyTarget {
  tagName?: string;
  isContentEditable?: boolean;
}

/** Whether a key press belongs to something the person is writing in, and so isn't for the easter egg. */
export function isTyping(target: KeyTarget | null | undefined): boolean {
  if (!target) return false;
  const tag = (target.tagName ?? '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable === true;
}

/** Whether a key press with these modifiers is a shortcut and not a letter typed. */
export function isShortcut(event: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }): boolean {
  return Boolean(event.ctrlKey || event.metaKey || event.altKey);
}

export interface Arrival {
  /** performance.getEntriesByType('navigation')[0].type: 'navigate', 'reload', 'back_forward' or 'prerender'. */
  navigation: string;
  /** document.referrer */
  referrer: string;
  /** location.origin */
  origin: string;
  /** The paths of the pages that show the calendar: ['/', '/advent/']. */
  calendarPaths: readonly string[];
  /** The device or the visit asks for less motion. */
  reducedMotion: boolean;
  /** The door has already swung since this page loaded. */
  swung: boolean;
}

/**
 * Whether today's door should swing when it comes on screen. Yes on arriving from elsewhere,
 * or from a page of the hub that has no calendar; no on a reload, on going back, on moving
 * between the two pages that show the calendar, for reduced motion, and never twice on a page.
 */
export function shouldSwing(arrival: Arrival): boolean {
  if (arrival.reducedMotion || arrival.swung) return false;
  if (arrival.navigation === 'reload' || arrival.navigation === 'back_forward') return false;
  if (!arrival.referrer) return true;
  let from: URL;
  try {
    from = new URL(arrival.referrer);
  } catch {
    return true;
  }
  if (from.origin !== arrival.origin) return true;
  const path = from.pathname.endsWith('/') ? from.pathname : `${from.pathname}/`;
  return !arrival.calendarPaths.some((known) => (known.endsWith('/') ? known : `${known}/`) === path);
}

/** The swing and the yurt must each be over in under half a second. */
export const DELIGHT_MS = 450;
