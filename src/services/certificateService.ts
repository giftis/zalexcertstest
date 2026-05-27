import { formatApiDate } from '../domain/date';
import { normalizeStatus } from '../domain/requestRules';
import {
  ApiCreatePayload,
  ApiCreateResponse,
  ApiListRecord,
  ApiListResponse,
  CertificateRequest,
} from '../types/certificate';
import { getJson, postJson } from './apiClient';

/** Map a raw API record to the domain model. index is used to guarantee a unique id. */
function mapRecord(r: ApiListRecord, index: number): CertificateRequest {
  return {
    id: `${r.reference_no}-${index}`,
    referenceNo: `REF-${r.reference_no}`,
    status: normalizeStatus(r.status),
    addressTo: r.address_to,
    issuedOn: r.issued_on,
    purpose: r.purpose,
  };
}

/**
 * F01 — Fetch certificate requests from the API.
 *
 * Real API returns { value: [...], Count: N }.
 * The plain-array shape shown in the spec examples does NOT match the live API.
 */
export async function fetchRequests(): Promise<CertificateRequest[]> {
  const data = await getJson<ApiListResponse | ApiListRecord[]>('/request-list');
  // Azure returns a plain array when Accept: application/json is sent by the browser,
  // but wraps it in { value: [...], Count: N } for other clients (e.g. PowerShell).
  const records: ApiListRecord[] = Array.isArray(data)
    ? data
    : (data as ApiListResponse).value;
  return records.map((r, i) => mapRecord(r, i));
}

/** Payload type for the create function. */
export interface CreateRequestInput {
  addressTo: string;
  purpose: string;
  issuedOn: Date;
  employeeId: string;
}

/**
 * F02 — Submit a new certificate request.
 *
 * Returns true if the API accepted the request.
 * The real API POST response uses the key "responce" (typo) not "response".
 */
export async function createRequest(
  input: CreateRequestInput,
): Promise<boolean> {
  const payload: ApiCreatePayload = {
    address_to: input.addressTo,
    purpose: input.purpose,
    issued_on: formatApiDate(input.issuedOn),
    employee_id: input.employeeId,
  };
  const res = await postJson<ApiCreatePayload, ApiCreateResponse>(
    '/request-certificate',
    payload,
  );
  // Accept both spec-documented "response" and the live API's typo'd "responce".
  const result = (res.responce ?? res.response ?? '').toLowerCase();
  return result === 'ok';
}
