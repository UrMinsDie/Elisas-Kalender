import { describe, expect, it } from 'vitest';
import { hasOverlap, isValidEmail, publicTitleFor, validateBookingForm } from '../src/lib/validation';

describe('validation', () => {
  it('validates email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('kaputt@example')).toBe(false);
  });

  it('detects date overlaps', () => {
    expect(hasOverlap(new Date('2026-07-11T10:30:00.000Z'), new Date('2026-07-11T11:30:00.000Z'), [
      { start_at: '2026-07-11T10:00:00.000Z', end_at: '2026-07-11T11:00:00.000Z' },
    ])).toBe(true);
  });

  it('maps anonymous public status titles', () => {
    expect(publicTitleFor({ id: '1', start_at: '', end_at: '', public_status: 'busy', public_title: null })).toBe('Belegt');
    expect(publicTitleFor({ id: '2', start_at: '', end_at: '', public_status: 'pending', public_title: null })).toBe('Vorläufig angefragt');
  });

  it('rejects invalid form data and short durations', () => {
    const errors = validateBookingForm({
      guestName: '',
      guestEmail: 'nope',
      activityType: 'Treffen',
      customTitle: '',
      description: '',
      startDate: '2026-07-11',
      endDate: '2026-07-11',
      startTime: '10:00',
      endTime: '10:10',
      privacyAccepted: false,
      website: '',
    });
    expect(errors.guestName).toBeTruthy();
    expect(errors.guestEmail).toBeTruthy();
    expect(errors.endTime).toBeTruthy();
    expect(errors.privacyAccepted).toBeTruthy();
  });

  it('accepts multi-day booking ranges', () => {
    const errors = validateBookingForm({
      guestName: 'Nikita',
      guestEmail: 'nikita@example.com',
      activityType: 'Treffen',
      customTitle: '',
      description: '',
      startDate: '2026-07-11',
      endDate: '2026-07-12',
      startTime: '14:00',
      endTime: '11:00',
      privacyAccepted: true,
      website: '',
    });
    expect(errors.endTime).toBeUndefined();
  });
});
