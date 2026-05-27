import { CertificateRequest } from '../types/certificate';
import { asTimestamp } from './date';
import { statusSortWeight } from './requestRules';

export type SortBy = 'issuedOn' | 'status';
export type SortOrder = 'asc' | 'desc';

/**
 * F03 filter rules (spec §3.3):
 * - Reference No.: exact match (case-insensitive)
 * - Address to:   contains query (case-insensitive)
 * - Status:       exact match (case-insensitive)
 *
 * A single search query is matched as OR across the three fields.
 */
export function filterRequests(
  requests: CertificateRequest[],
  query: string,
): CertificateRequest[] {
  const q = query.trim().toLowerCase();
  if (!q) return requests;
  return requests.filter((r) => {
    const ref = r.referenceNo.toLowerCase();
    // Reference No.: full match — accept both prefixed ("ref-100") and bare ("100") forms.
    const refMatch = ref === q || ref === `ref-${q}` || ref.replace(/^ref-/, '') === q;
    return (
      refMatch ||
      r.addressTo.toLowerCase().includes(q) ||
      r.status.toLowerCase() === q
    );
  });
}

/** Sort requests by the given field and order. */
export function sortRequests(
  requests: CertificateRequest[],
  sortBy: SortBy,
  order: SortOrder,
): CertificateRequest[] {
  const copy = [...requests].sort((a, b) => {
    if (sortBy === 'issuedOn') {
      return asTimestamp(a.issuedOn) - asTimestamp(b.issuedOn);
    }
    return statusSortWeight(a.status) - statusSortWeight(b.status);
  });
  return order === 'desc' ? copy.reverse() : copy;
}

/** Convenience: filter then sort. */
export function queryRequests(
  requests: CertificateRequest[],
  query: string,
  sortBy: SortBy,
  order: SortOrder,
): CertificateRequest[] {
  return sortRequests(filterRequests(requests, query), sortBy, order);
}
