import { CertificateRequest, CertificateStatus } from '../types/certificate';

/** Order used for sort-by-status: New < Pending < Under Review < Done. */
const STATUS_ORDER: Record<CertificateStatus, number> = {
  New: 1,
  Pending: 2,
  'Under Review': 3,
  Done: 4,
};

/**
 * Normalise an arbitrary status string from the API into a CertificateStatus.
 * Falls back to 'New' for unknown values so the UI never crashes.
 */
export function normalizeStatus(value: string): CertificateStatus {
  if (
    value === 'New' ||
    value === 'Pending' ||
    value === 'Under Review' ||
    value === 'Done'
  ) {
    return value;
  }
  return 'New';
}

/** Numeric weight for sorting by status. */
export function statusSortWeight(status: CertificateStatus): number {
  return STATUS_ORDER[status];
}

/**
 * F05 rule: purpose is editable only when the request is in "New" status.
 */
export function canEditPurpose(status: CertificateStatus): boolean {
  return status === 'New';
}

/**
 * F04 rule: "Issued on" date is displayed only when the request is "Done".
 */
export function showIssuedOn(status: CertificateStatus): boolean {
  return status === 'Done';
}

/**
 * F04 rule: PDF preview is shown only when the request is "Done".
 */
export function showPdf(status: CertificateStatus): boolean {
  return status === 'Done';
}

/**
 * Apply a local purpose update to a list of requests.
 * Silently ignores non-'New' requests (double safety for F05).
 */
export function applyPurposeUpdate(
  requests: CertificateRequest[],
  referenceNo: string,
  purpose: string,
): CertificateRequest[] {
  return requests.map((r) => {
    if (r.referenceNo !== referenceNo || !canEditPurpose(r.status)) return r;
    return { ...r, purpose };
  });
}
