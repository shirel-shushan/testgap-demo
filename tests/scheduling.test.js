import { describe, it, expect } from 'vitest';
import { isWorkingDay, slotDurationMinutes, slotsOverlap } from '../src/scheduling.js';

const utc = (iso) => new Date(`${iso}Z`);

describe('isWorkingDay', () => {
  it('treats Sunday–Thursday as working days by default', () => {
    // 2026-10-04 is a Sunday
    expect(isWorkingDay(utc('2026-10-04T09:00:00'))).toBe(true);
    expect(isWorkingDay(utc('2026-10-08T09:00:00'))).toBe(true);
  });

  it('treats Friday and Saturday as weekend by default', () => {
    expect(isWorkingDay(utc('2026-10-09T09:00:00'))).toBe(false);
    expect(isWorkingDay(utc('2026-10-10T09:00:00'))).toBe(false);
  });

  it('supports a custom weekend', () => {
    const options = { weekend: [0, 6] };
    expect(isWorkingDay(utc('2026-10-09T09:00:00'), options)).toBe(true);
    expect(isWorkingDay(utc('2026-10-04T09:00:00'), options)).toBe(false);
  });

  it('excludes holidays', () => {
    const options = { holidays: ['2026-10-05'] };
    expect(isWorkingDay(utc('2026-10-05T09:00:00'), options)).toBe(false);
    expect(isWorkingDay(utc('2026-10-06T09:00:00'), options)).toBe(true);
  });
});

describe('slotDurationMinutes', () => {
  it('returns the length of a slot in minutes', () => {
    const slot = { start: utc('2026-10-04T09:00:00'), end: utc('2026-10-04T10:30:00') };
    expect(slotDurationMinutes(slot)).toBe(90);
  });

  it('throws when end is not after start', () => {
    const t = utc('2026-10-04T09:00:00');
    expect(() => slotDurationMinutes({ start: t, end: t })).toThrow(RangeError);
    expect(() =>
      slotDurationMinutes({ start: t, end: utc('2026-10-04T08:00:00') }),
    ).toThrow(RangeError);
  });
});

describe('slotsOverlap', () => {
  const slot = (from, to) => ({
    start: utc(`2026-10-04T${from}:00`),
    end: utc(`2026-10-04T${to}:00`),
  });

  it('detects partial overlap', () => {
    expect(slotsOverlap(slot('09:00', '10:00'), slot('09:30', '11:00'))).toBe(true);
  });

  it('detects containment', () => {
    expect(slotsOverlap(slot('09:00', '12:00'), slot('10:00', '11:00'))).toBe(true);
  });

  it('does not treat back-to-back slots as overlapping', () => {
    expect(slotsOverlap(slot('09:00', '10:00'), slot('10:00', '11:00'))).toBe(false);
  });

  it('returns false for disjoint slots in either order', () => {
    expect(slotsOverlap(slot('09:00', '10:00'), slot('13:00', '14:00'))).toBe(false);
    expect(slotsOverlap(slot('13:00', '14:00'), slot('09:00', '10:00'))).toBe(false);
  });
});
