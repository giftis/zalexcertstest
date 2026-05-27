/**
 * F02 validation tests — requestCertificateSchema
 *
 * Each test maps to a spec validation rule.
 */
import { requestCertificateSchema } from '../src/domain/validation';

// Helper: build a valid payload, allowing overrides
function valid(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return {
    addressTo: 'Bank of Cyprus',
    purpose: 'A'.repeat(50), // exactly 50 chars
    issuedOn: tomorrow,
    employeeId: '123456',
    ...overrides,
  };
}

describe('requestCertificateSchema', () => {
  describe('addressTo', () => {
    it('passes when non-empty', () => {
      const result = requestCertificateSchema.safeParse(valid());
      expect(result.success).toBe(true);
    });

    it('fails when empty string', () => {
      const result = requestCertificateSchema.safeParse(valid({ addressTo: '' }));
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages.some((m) => /required/i.test(m))).toBe(true);
      }
    });

    it('fails when whitespace-only', () => {
      const result = requestCertificateSchema.safeParse(valid({ addressTo: '   ' }));
      expect(result.success).toBe(false);
    });
  });

  describe('purpose', () => {
    it('passes with exactly 50 characters', () => {
      const result = requestCertificateSchema.safeParse(valid({ purpose: 'X'.repeat(50) }));
      expect(result.success).toBe(true);
    });

    it('passes with more than 50 characters', () => {
      const result = requestCertificateSchema.safeParse(valid({ purpose: 'X'.repeat(80) }));
      expect(result.success).toBe(true);
    });

    it('fails with 49 characters', () => {
      const result = requestCertificateSchema.safeParse(valid({ purpose: 'X'.repeat(49) }));
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages.some((m) => /50 characters/i.test(m))).toBe(true);
      }
    });

    it('fails when empty', () => {
      const result = requestCertificateSchema.safeParse(valid({ purpose: '' }));
      expect(result.success).toBe(false);
    });
  });

  describe('issuedOn', () => {
    it('passes for a date tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = requestCertificateSchema.safeParse(valid({ issuedOn: tomorrow }));
      expect(result.success).toBe(true);
    });

    it('fails for today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = requestCertificateSchema.safeParse(valid({ issuedOn: today }));
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages.some((m) => /future/i.test(m))).toBe(true);
      }
    });

    it('fails for a past date', () => {
      const past = new Date('2020-01-01');
      const result = requestCertificateSchema.safeParse(valid({ issuedOn: past }));
      expect(result.success).toBe(false);
    });

    it('fails when missing', () => {
      const result = requestCertificateSchema.safeParse(valid({ issuedOn: undefined }));
      expect(result.success).toBe(false);
    });
  });

  describe('employeeId', () => {
    it('passes with all digits', () => {
      const result = requestCertificateSchema.safeParse(valid({ employeeId: '99999' }));
      expect(result.success).toBe(true);
    });

    it('fails with letters', () => {
      const result = requestCertificateSchema.safeParse(valid({ employeeId: 'abc' }));
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages.some((m) => /numeric/i.test(m))).toBe(true);
      }
    });

    it('fails with alphanumeric', () => {
      const result = requestCertificateSchema.safeParse(valid({ employeeId: '123abc' }));
      expect(result.success).toBe(false);
    });

    it('fails when empty', () => {
      const result = requestCertificateSchema.safeParse(valid({ employeeId: '' }));
      expect(result.success).toBe(false);
    });
  });
});
