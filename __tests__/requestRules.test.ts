/**
 * F04 / F05 business rule tests — requestRules
 */
import {
  applyPurposeUpdate,
  canEditPurpose,
  normalizeStatus,
  showIssuedOn,
  showPdf,
  statusSortWeight,
} from '../src/domain/requestRules';
import { CertificateRequest, CertificateStatus } from '../src/types/certificate';

const ALL_STATUSES: CertificateStatus[] = [
  'New',
  'Pending',
  'Under Review',
  'Done',
];

describe('normalizeStatus', () => {
  it('returns known statuses unchanged', () => {
    for (const s of ALL_STATUSES) {
      expect(normalizeStatus(s)).toBe(s);
    }
  });

  it('returns "New" for unknown values', () => {
    expect(normalizeStatus('InProgress')).toBe('New');
    expect(normalizeStatus('')).toBe('New');
    expect(normalizeStatus('Cancelled')).toBe('New');
  });
});

describe('statusSortWeight', () => {
  it('assigns New < Pending < Under Review < Done', () => {
    expect(statusSortWeight('New')).toBeLessThan(statusSortWeight('Pending'));
    expect(statusSortWeight('Pending')).toBeLessThan(
      statusSortWeight('Under Review'),
    );
    expect(statusSortWeight('Under Review')).toBeLessThan(
      statusSortWeight('Done'),
    );
  });
});

describe('canEditPurpose (F05)', () => {
  it('returns true only for "New" status', () => {
    expect(canEditPurpose('New')).toBe(true);
    expect(canEditPurpose('Pending')).toBe(false);
    expect(canEditPurpose('Under Review')).toBe(false);
    expect(canEditPurpose('Done')).toBe(false);
  });
});

describe('showIssuedOn (F04)', () => {
  it('returns true only for "Done" status', () => {
    expect(showIssuedOn('Done')).toBe(true);
    expect(showIssuedOn('New')).toBe(false);
    expect(showIssuedOn('Pending')).toBe(false);
    expect(showIssuedOn('Under Review')).toBe(false);
  });
});

describe('showPdf (F04)', () => {
  it('returns true only for "Done" status', () => {
    expect(showPdf('Done')).toBe(true);
    expect(showPdf('New')).toBe(false);
    expect(showPdf('Pending')).toBe(false);
    expect(showPdf('Under Review')).toBe(false);
  });
});

describe('applyPurposeUpdate (F05)', () => {
  const base: CertificateRequest = {
    id: '1-0',
    referenceNo: 'REF-1',
    status: 'New',
    addressTo: 'Test Corp',
    issuedOn: '9/1/2027',
    purpose: 'Original purpose text here',
  };

  it('updates purpose when status is New', () => {
    const updated = applyPurposeUpdate([base], 'REF-1', 'New purpose text here');
    expect(updated[0].purpose).toBe('New purpose text here');
  });

  it('does not update purpose when status is Pending', () => {
    const pending = { ...base, status: 'Pending' as CertificateStatus };
    const updated = applyPurposeUpdate([pending], 'REF-1', 'Attempted edit');
    expect(updated[0].purpose).toBe(base.purpose);
  });

  it('does not update purpose when status is Done', () => {
    const done = { ...base, status: 'Done' as CertificateStatus };
    const updated = applyPurposeUpdate([done], 'REF-1', 'Attempted edit');
    expect(updated[0].purpose).toBe(base.purpose);
  });

  it('does not affect other records', () => {
    const other: CertificateRequest = {
      id: '2-1',
      referenceNo: 'REF-2',
      status: 'New',
      addressTo: 'Other Corp',
      issuedOn: '9/2/2027',
      purpose: 'Should not change',
    };
    const updated = applyPurposeUpdate([base, other], 'REF-1', 'New text here');
    expect(updated[1].purpose).toBe('Should not change');
  });

  it('returns original list when referenceNo not found', () => {
    const updated = applyPurposeUpdate([base], 'REF-999', 'No match');
    expect(updated).toEqual([base]);
  });
});
