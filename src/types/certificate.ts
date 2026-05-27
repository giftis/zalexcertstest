/**
 * All certificate status values as returned by the real API.
 * The API uses exactly these four strings — no normalisation needed.
 */
export type CertificateStatus = 'New' | 'Pending' | 'Under Review' | 'Done';

/** Domain model — the shape the app works with internally. */
export interface CertificateRequest {
  /** Stable unique key for React lists. Distinct from referenceNo which can be shared. */
  id: string;
  /** Formatted as "REF-{reference_no}", e.g. "REF-100" */
  referenceNo: string;
  status: CertificateStatus;
  addressTo: string;
  /** As returned by the API: "M/D/YYYY" */
  issuedOn: string;
  purpose: string;
}

// --------------- Raw API shapes ---------------

/** One record in GET /request-list → { value: ApiListRecord[] } */
export interface ApiListRecord {
  reference_no: number;
  status: string;
  address_to: string;
  issued_on: string;
  purpose: string;
}

/** Full response envelope from GET /request-list */
export interface ApiListResponse {
  value: ApiListRecord[];
  Count: number;
}

/** POST /request-certificate body */
export interface ApiCreatePayload {
  address_to: string;
  purpose: string;
  issued_on: string;
  employee_id: string;
}

/**
 * POST /request-certificate response.
 * IMPORTANT: the API has a typo — the key is "responce", not "response".
 */
export interface ApiCreateResponse {
  /** Live API uses the typo'd key 'responce'. */
  responce?: string;
  /** Spec example uses 'response'. Accepted for safety. */
  response?: string;
}
