# Traceability Matrix

Maps every assessment requirement to the file(s) that implement it.

---

## F01 — Display List of Certificate Requests

| Requirement | Implementation |
|---|---|
| Fetch from `GET /request-list` | `src/services/certificateService.ts` → `fetchRequests()` |
| Parse `{ value: [...] }` wrapper | `src/services/certificateService.ts` → `Array.isArray(data) ? data : data.value` then `records.map((r, i) => mapRecord(r, i))` |
| Map `reference_no` → `REF-{N}` | `src/services/certificateService.ts` → `mapRecord()` |
| Normalise status strings | `src/domain/requestRules.ts` → `normalizeStatus()` |
| Display as list | `src/screens/RequestsListScreen.tsx` → `<FlatList>` |
| Pull-to-refresh | `src/screens/RequestsListScreen.tsx` → `<RefreshControl>` |
| Reload on tab focus | `src/screens/RequestsListScreen.tsx` → `useFocusEffect` |
| Status badge colours | `src/components/StatusBadge.tsx` |
| Status summary row | `src/screens/RequestsListScreen.tsx` → `SummaryCard` |

---

## F02 — Request a Certificate

| Requirement | Implementation |
|---|---|
| Form with 4 fields | `src/screens/RequestCertificateScreen.tsx` |
| `address_to` required | `src/domain/validation.ts` → `addressTo: z.string().min(1)` |
| `purpose` min 50 chars | `src/domain/validation.ts` → `purpose: z.string().min(50)` |
| `issued_on` must be future | `src/domain/validation.ts` → `.refine(isFutureDate)` |
| `employee_id` digits only | `src/domain/validation.ts` → `.regex(/^\d+$/)` |
| Inline validation errors | `src/components/FieldError.tsx` |
| Character counter on purpose | `src/screens/RequestCertificateScreen.tsx` → counter text |
| POST to `/request-certificate` | `src/services/certificateService.ts` → `createRequest()` |
| Handle `responce` typo in response | `src/services/certificateService.ts` → `(res.responce ?? res.response ?? '').toLowerCase() === 'ok'` |
| Success screen (not Alert) | `src/screens/RequestSuccessScreen.tsx` |
| Optimistic local entry | `src/state/CertificateContext.tsx` → `ADD_LOCAL` reducer |
| DateTimePicker (iOS/Android) | `src/screens/RequestCertificateScreen.tsx` → `Platform.OS !== 'web'` |
| Text-input fallback (web) | `src/screens/RequestCertificateScreen.tsx` → `Platform.OS === 'web'` |

---

## F03 — Search & Filter

| Requirement | Implementation |
|---|---|
| Search by reference (exact) | `src/domain/listOps.ts` → `filterRequests()` |
| Search by address (contains) | `src/domain/listOps.ts` → `filterRequests()` |
| Search by status (exact) | `src/domain/listOps.ts` → `filterRequests()` |
| Sort by issued date | `src/domain/listOps.ts` → `sortRequests()` with `sortBy=issuedOn` |
| Sort by status | `src/domain/listOps.ts` → `sortRequests()` with `sortBy=status` |
| Sort order (asc/desc) | `src/domain/listOps.ts` → `SortOrder` + `reverse()` |
| Sort bottom sheet modal | `src/components/SortFilterModal.tsx` |
| Search bar in list screen | `src/screens/RequestsListScreen.tsx` → `<TextInput>` |

---

## F04 — View Request Details

| Requirement | Implementation |
|---|---|
| Show reference number | `src/screens/RequestDetailScreen.tsx` |
| Show status with badge | `src/screens/RequestDetailScreen.tsx` + `src/components/StatusBadge.tsx` |
| Status progress stepper | `src/components/StatusStepper.tsx` |
| Show address (read-only) | `src/screens/RequestDetailScreen.tsx` → `detailCard` |
| Show issued date (Done only) | `src/domain/requestRules.ts` → `showIssuedOn()` + screen conditional |
| Show purpose | `src/screens/RequestDetailScreen.tsx` |
| Show PDF for Done only | `src/domain/requestRules.ts` → `showPdf()` + screen conditional |
| "Yet to be issued" for non-Done | `src/screens/RequestDetailScreen.tsx` → `pendingCard` |
| In-app certificate preview (iOS/Android) | `src/screens/CertificateViewScreen.tsx` → `react-native-webview` when `Platform.OS !== 'web'` |
| In-app certificate preview (web browser) | `src/screens/CertificateViewScreen.tsx` → `<iframe srcDoc>` when `Platform.OS === 'web'` |

---

## F05 — Edit Purpose (Local Only)

| Requirement | Implementation |
|---|---|
| Edit allowed only for New status | `src/domain/requestRules.ts` → `canEditPurpose()` |
| Edit blocked for Pending/Under Review/Done | `canEditPurpose()` returns false |
| "Edit allowed" / "Read only" badge | `src/screens/RequestDetailScreen.tsx` → `editBadge` |
| Character counter (min 50) | `src/screens/RequestDetailScreen.tsx` |
| Validation on save | `src/screens/RequestDetailScreen.tsx` → `handleSavePurpose()` |
| Local state only (no PUT to API) | `src/state/CertificateContext.tsx` → `UPDATE_PURPOSE` reducer |
| Purpose persists on navigation | `src/state/CertificateContext.tsx` → `purposeOverrides` survives refresh |

---

## Tests Traceability

| Test file | Domain | Tests |
|---|---|---|
| `__tests__/validation.test.ts` | F02 | 13 |
| `__tests__/listOps.test.ts` | F03 | 10 |
| `__tests__/requestRules.test.ts` | F04, F05 | 13 |
| `__tests__/CertificateViewScreen.test.tsx` | F04 (platform rendering) | 4 |
| **Total** | | **40** |
