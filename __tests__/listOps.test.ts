/**
 * F03 list operations tests — filterRequests / sortRequests
 */
import { filterRequests, sortRequests } from '../src/domain/listOps';
import { CertificateRequest } from '../src/types/certificate';

const FIXTURES: CertificateRequest[] = [
  {
    id: '100-0',
    referenceNo: 'REF-100',
    status: 'Done',
    addressTo: 'Bank of Cyprus',
    issuedOn: '9/1/2027',
    purpose: 'Visa application for work permit renewal',
  },
  {
    id: '101-1',
    referenceNo: 'REF-101',
    status: 'New',
    addressTo: 'Embassy of France',
    issuedOn: '9/15/2027',
    purpose: 'Tourist visa proof of employment',
  },
  {
    id: '102-2',
    referenceNo: 'REF-102',
    status: 'Under Review',
    addressTo: 'Bank of Cyprus',
    issuedOn: '9/5/2027',
    purpose: 'Loan application supporting document',
  },
  {
    id: '103-3',
    referenceNo: 'REF-103',
    status: 'Pending',
    addressTo: 'Embassy of Germany',
    issuedOn: '8/20/2027',
    purpose: 'Schengen visa income verification',
  },
];

describe('filterRequests', () => {
  it('returns all when query is empty', () => {
    expect(filterRequests(FIXTURES, '')).toHaveLength(4);
  });

  it('matches by exact referenceNo (case-insensitive)', () => {
    const result = filterRequests(FIXTURES, 'ref-100');
    expect(result).toHaveLength(1);
    expect(result[0].referenceNo).toBe('REF-100');
  });

  it('matches by partial addressTo (contains)', () => {
    const result = filterRequests(FIXTURES, 'bank of cyprus');
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.referenceNo)).toContain('REF-100');
    expect(result.map((r) => r.referenceNo)).toContain('REF-102');
  });

  it('matches by exact status (case-insensitive)', () => {
    const result = filterRequests(FIXTURES, 'new');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('New');
  });

  it('returns empty array when no match', () => {
    expect(filterRequests(FIXTURES, 'zzz-no-match')).toHaveLength(0);
  });
});

describe('sortRequests', () => {
  it('sorts by issuedOn ascending (oldest first)', () => {
    const sorted = sortRequests(FIXTURES, 'issuedOn', 'asc');
    // REF-103: 8/20/2027 → REF-100: 9/1/2027 → REF-102: 9/5/2027 → REF-101: 9/15/2027
    expect(sorted[0].referenceNo).toBe('REF-103');
    expect(sorted[sorted.length - 1].referenceNo).toBe('REF-101');
  });

  it('sorts by issuedOn descending (newest first)', () => {
    const sorted = sortRequests(FIXTURES, 'issuedOn', 'desc');
    expect(sorted[0].referenceNo).toBe('REF-101');
    expect(sorted[sorted.length - 1].referenceNo).toBe('REF-103');
  });

  it('sorts by status ascending (New < Pending < Under Review < Done)', () => {
    const sorted = sortRequests(FIXTURES, 'status', 'asc');
    expect(sorted[0].status).toBe('New');
    expect(sorted[1].status).toBe('Pending');
    expect(sorted[2].status).toBe('Under Review');
    expect(sorted[3].status).toBe('Done');
  });

  it('sorts by status descending (Done first)', () => {
    const sorted = sortRequests(FIXTURES, 'status', 'desc');
    expect(sorted[0].status).toBe('Done');
    expect(sorted[sorted.length - 1].status).toBe('New');
  });

  it('does not mutate the input array', () => {
    const input = [...FIXTURES];
    sortRequests(input, 'issuedOn', 'asc');
    expect(input).toEqual(FIXTURES);
  });
});
