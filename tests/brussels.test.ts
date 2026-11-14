import { describe, expect, it } from 'vitest';
import { dayAndMonth, dayKey, isoWithOffset, longDate, midnight, midnightOf, offsetMinutes, sameDay, shortDate, wallTime } from '../src/hub/brussels.js';

describe('Brussels time', () => {
  it('reads the clocks in Brussels, whatever zone the moment was written in', () => {
    expect(wallTime(new Date('2026-12-09T23:00:00Z'))).toEqual({ year: 2026, month: 12, day: 10, hour: 0, minute: 0, second: 0 });
    expect(wallTime(new Date('2026-12-10T08:15:30+09:00'))).toEqual({ year: 2026, month: 12, day: 10, hour: 0, minute: 15, second: 30 });
  });

  it('is an hour ahead of UTC in winter and two in summer', () => {
    expect(offsetMinutes(new Date('2026-12-10T12:00:00Z'))).toBe(60);
    expect(offsetMinutes(new Date('2026-07-01T12:00:00Z'))).toBe(120);
  });

  it('finds midnight in winter and in summer', () => {
    expect(midnight(2026, 12, 10).toISOString()).toBe('2026-12-09T23:00:00.000Z');
    expect(midnight(2026, 7, 1).toISOString()).toBe('2026-06-30T22:00:00.000Z');
  });

  it('finds midnight on the days the clocks change', () => {
    // 29 March 2026: clocks go forward at 02:00. 25 October 2026: back at 03:00.
    expect(midnight(2026, 3, 29).toISOString()).toBe('2026-03-28T23:00:00.000Z');
    expect(midnight(2026, 3, 30).toISOString()).toBe('2026-03-29T22:00:00.000Z');
    expect(midnight(2026, 10, 25).toISOString()).toBe('2026-10-24T22:00:00.000Z');
    expect(midnight(2026, 10, 26).toISOString()).toBe('2026-10-25T23:00:00.000Z');
  });

  it('rolls a day past the end of the month into the next', () => {
    expect(midnight(2026, 12, 32).toISOString()).toBe('2026-12-31T23:00:00.000Z');
    expect(dayKey(midnight(2026, 12, 32))).toBe('2027-01-01');
  });

  it('names the Brussels day, not the UTC day', () => {
    const justAfter = new Date('2026-12-13T23:00:00Z');
    const justBefore = new Date('2026-12-13T22:59:59Z');
    expect(dayKey(justAfter)).toBe('2026-12-14');
    expect(dayKey(justBefore)).toBe('2026-12-13');
    expect(sameDay(justAfter, justBefore)).toBe(false);
    expect(sameDay(justAfter, new Date('2026-12-14T22:59:59Z'))).toBe(true);
  });

  it('writes dates the way the doors do', () => {
    const opens = new Date('2026-12-14T00:00:00+01:00');
    expect(shortDate(opens)).toBe('14 Dec');
    expect(dayAndMonth(opens)).toBe('14 December');
    expect(longDate(opens)).toBe('14 December 2026');
    expect(shortDate(new Date('2026-09-09T00:00:00+02:00'))).toBe('9 Sep');
  });

  it('writes a moment with its Brussels offset', () => {
    expect(isoWithOffset(new Date('2026-12-09T23:00:00Z'))).toBe('2026-12-10T00:00:00+01:00');
    expect(isoWithOffset(new Date('2026-06-30T22:00:00Z'))).toBe('2026-07-01T00:00:00+02:00');
    expect(new Date(isoWithOffset(new Date('2026-12-13T14:45:12Z'))).toISOString()).toBe('2026-12-13T14:45:12.000Z');
  });

  it('turns a day into its midnight and back', () => {
    expect(midnightOf('2026-12-10').toISOString()).toBe('2026-12-09T23:00:00.000Z');
    expect(dayKey(midnightOf('2026-12-25'))).toBe('2026-12-25');
  });

  it('turns away what is not a day or a time', () => {
    expect(() => midnightOf('10 December')).toThrow();
    expect(() => midnightOf('2026-02-30')).toThrow();
    expect(() => wallTime(new Date('nonsense'))).toThrow();
  });
});
