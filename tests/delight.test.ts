import { describe, expect, it } from 'vitest';
import { DELIGHT_MS, isShortcut, isTyping, shouldSwing, wordListener, type Arrival } from '../src/hub/delight.js';

const type = (listener: (key: string) => boolean, keys: string[]) => keys.map((key) => listener(key));

describe('typing "yurt"', () => {
  it('answers on the last letter, and only then', () => {
    expect(type(wordListener('yurt'), ['y', 'u', 'r', 't'])).toEqual([false, false, false, true]);
  });

  it('does not mind capitals', () => {
    expect(type(wordListener('yurt'), ['Y', 'U', 'R', 'T']).at(-1)).toBe(true);
  });

  it('finds the word at the end of anything else', () => {
    expect(type(wordListener('yurt'), [...'the yyurt']).at(-1)).toBe(true);
    expect(type(wordListener('yurt'), [...'yuryurt']).at(-1)).toBe(true);
  });

  it('needs the letters in a row', () => {
    expect(type(wordListener('yurt'), ['y', 'u', 'x', 'r', 't']).includes(true)).toBe(false);
    expect(type(wordListener('yurt'), ['y', 'u', 'r', ' ', 't']).includes(true)).toBe(false);
  });

  it('ignores keys that are not characters', () => {
    expect(type(wordListener('yurt'), ['y', 'Shift', 'u', 'ArrowLeft', 'r', 'Tab', 't']).at(-1)).toBe(true);
  });

  it('starts afresh after each yurt', () => {
    const listener = wordListener('yurt');
    expect(type(listener, [...'yurt']).at(-1)).toBe(true);
    expect(listener('t')).toBe(false);
    expect(type(listener, [...'yurt']).at(-1)).toBe(true);
  });

  it('needs a word to listen for', () => {
    expect(() => wordListener('')).toThrow();
  });

  it('leaves alone what is typed into a field, and shortcuts', () => {
    expect(isTyping({ tagName: 'INPUT' })).toBe(true);
    expect(isTyping({ tagName: 'textarea' })).toBe(true);
    expect(isTyping({ tagName: 'SELECT' })).toBe(true);
    expect(isTyping({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTyping({ tagName: 'BODY' })).toBe(false);
    expect(isTyping({ tagName: 'BUTTON' })).toBe(false);
    expect(isTyping(null)).toBe(false);
    expect(isShortcut({ ctrlKey: true })).toBe(true);
    expect(isShortcut({ metaKey: true })).toBe(true);
    expect(isShortcut({ altKey: true })).toBe(true);
    expect(isShortcut({})).toBe(false);
  });
});

describe('the door\'s swing', () => {
  const arrival = (patch: Partial<Arrival> = {}): Arrival => ({
    navigation: 'navigate',
    referrer: '',
    origin: 'https://tools.eurth.org',
    calendarPaths: ['/', '/advent/'],
    reducedMotion: false,
    swung: false,
    ...patch,
  });

  it('happens on arriving from nowhere, from a search or from another Eurth site', () => {
    expect(shouldSwing(arrival())).toBe(true);
    expect(shouldSwing(arrival({ referrer: 'https://www.example.com/search?q=worldbuilding' }))).toBe(true);
    expect(shouldSwing(arrival({ referrer: 'https://flag.eurth.org/' }))).toBe(true);
    expect(shouldSwing(arrival({ referrer: 'not a url' }))).toBe(true);
  });

  it('happens on coming to the calendar from a page of the hub without one', () => {
    expect(shouldSwing(arrival({ referrer: 'https://tools.eurth.org/about/' }))).toBe(true);
    expect(shouldSwing(arrival({ referrer: 'https://tools.eurth.org/changelog/#flag-2026-11-12' }))).toBe(true);
  });

  it('does not happen again between the two pages that show the calendar', () => {
    expect(shouldSwing(arrival({ referrer: 'https://tools.eurth.org/' }))).toBe(false);
    expect(shouldSwing(arrival({ referrer: 'https://tools.eurth.org/advent/' }))).toBe(false);
    expect(shouldSwing(arrival({ referrer: 'https://tools.eurth.org/advent' }))).toBe(false);
    expect(shouldSwing(arrival({ referrer: 'https://tools.eurth.org/?ref=flag.eurth.org' }))).toBe(false);
  });

  it('does not happen on a reload or on going back', () => {
    expect(shouldSwing(arrival({ navigation: 'reload' }))).toBe(false);
    expect(shouldSwing(arrival({ navigation: 'back_forward' }))).toBe(false);
  });

  it('never happens twice on a page, and never for reduced motion', () => {
    expect(shouldSwing(arrival({ swung: true }))).toBe(false);
    expect(shouldSwing(arrival({ reducedMotion: true }))).toBe(false);
  });

  it('is over in under half a second', () => {
    expect(DELIGHT_MS).toBeLessThan(500);
  });
});
