# Assessment Coverage & Justification

This document maps every requirement in the Zalex Inc. Employee Certification Solution brief to the code that implements it, with `file:line` citations. Every claim below was verified against the actual source.

---

## Summary

| Feature | Status | Notes |
|---|---|---|
| F01 — React Native architecture | ✅ Complete | Expo SDK 56, TS, Context+useReducer, fetch, layered architecture |
| F02 — Request certificate | ✅ Complete | All 4 fields, validation, POST, success screen |
| F03 — List + sort + filter | ✅ Complete | All 5 list fields, sort by date/status, filter by ref/address/status |
| F04 — Detail + PDF preview | ✅ Complete | All conditional rules + in-app HTML certificate viewer |
| F05 — Update (local-only) | ✅ Complete | Editable only when New, list reflects immediately |
| Deliverables — README | ✅ | [README.md](../README.md) |
| Deliverables — Architecture notes | ✅ | This document + [decisions.md](decisions.md) |
| Deliverables — Unit tests | ✅ | 40 tests across 4 suites — validation, listOps, requestRules, CertificateViewScreen |
| Optional — CI pipeline | ✅ | `.github/workflows/ci.yml` — runs tsc + tests on every push/PR |
| Optional — TestFlight build | ❌ | Requires paid Apple Developer account — not implemented |

---

## F01 — React Native application

| Requirement | Implementation | Evidence |
|---|---|---|
| R01: Built with React Native (TS) | Expo managed workflow, TypeScript | [package.json](../package.json#L4), [tsconfig.json](../tsconfig.json) |
| RN components / no third-party UI lib needed | Pure RN primitives + 2 third-party widgets | [src/screens](../src/screens/) — uses `View`, `Text`, `TextInput`, `Pressable`, `FlatList`, `ScrollView`, `Modal`, `RefreshControl` |
| Hooks / Context API | Context + `useReducer` for global state | [CertificateContext.tsx](../src/state/CertificateContext.tsx#L60) |
| Separation: UI / state / network | 4 layers: `screens`, `state`, `services`, `domain` | [src/](../src/) directory structure |
| Networking: `fetch` | Plain `fetch` wrapped in `getJson` / `postJson` | [apiClient.ts](../src/services/apiClient.ts#L23) |
| README explains setup | Node version, deps, API key, run instructions | [README.md](../README.md) |

**Architecture (1-paragraph summary)**

The app uses a strict 4-layer architecture: **screens** render UI and dispatch actions; **state** (a single `CertificateContext` backed by `useReducer`) owns all application state and exposes intent-style methods (`loadRequests`, `submitRequest`, `updatePurpose`); **services** wrap the REST API and translate raw API shapes to domain types; **domain** contains pure functions for validation, sorting, filtering, and conditional display rules. The domain layer has zero React or I/O dependencies — it is fully unit-tested without mocks. This separation makes business rules (F02 validation, F03 search/sort, F04 conditional display, F05 edit guard) trivially testable and easy to reason about.

---

## F02 — Request certificate

### R01 — Form fields

| Field | Control | Restriction | Required | Evidence |
|---|---|---|---|---|
| Address to | Multiline text | min 1 char (200 max for UX) | Yes | [RequestCertificateScreen.tsx](../src/screens/RequestCertificateScreen.tsx#L112), [validation.ts](../src/domain/validation.ts#L15) |
| Purpose | Multiline text | min 50 chars | Yes | [RequestCertificateScreen.tsx](../src/screens/RequestCertificateScreen.tsx#L141), [validation.ts](../src/domain/validation.ts#L17) |
| Issued on | Date picker | future dates only | Yes | [RequestCertificateScreen.tsx](../src/screens/RequestCertificateScreen.tsx#L189), [validation.ts](../src/domain/validation.ts#L21) |
| Employee ID | Numeric keypad | digits only | Yes | [RequestCertificateScreen.tsx](../src/screens/RequestCertificateScreen.tsx#L260), [validation.ts](../src/domain/validation.ts#L25) |

> **Note on "Alphanumeric" for Address to**: The brief says `Alphanumeric` but the sample data in the live API contains spaces, commas, and other punctuation (`"Director General of Social Security Service"`). We interpret "alphanumeric" as "free text" (min length 1) — a strict regex would reject the API's own sample data.

### R02 — Inline validation

- Errors rendered under the input via [FieldError.tsx](../src/components/FieldError.tsx) which uses `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` for screen-reader announcement.
- Validation is run on every change via `zodResolver` ([RequestCertificateScreen.tsx#L45](../src/screens/RequestCertificateScreen.tsx#L45)).
- Character counters for `purpose` (turns orange if below 50) and `addressTo` ([RequestCertificateScreen.tsx#L135](../src/screens/RequestCertificateScreen.tsx#L135)).

### R03 — POST to backend

- Endpoint and key injection: [apiClient.ts#L19](../src/services/apiClient.ts#L19) builds the URL with `subscription-key` query param.
- Payload mapping (camelCase → snake_case): [certificateService.ts#L57](../src/services/certificateService.ts#L57).
- `issued_on` formatted as `M/D/YYYY` to match spec example: [date.ts](../src/domain/date.ts) → `formatApiDate`.

### R04 — Confirmation on success

- A dedicated [RequestSuccessScreen.tsx](../src/screens/RequestSuccessScreen.tsx) is navigated to on success (chosen over `Alert` for better UX consistency and accessibility).
- The handler accepts both spec-documented `response` and the live API's typo'd `responce` keys: [certificateService.ts#L68](../src/services/certificateService.ts#L68).

---

## F03 — Requests list

### R01 — List item fields

[RequestsListScreen.tsx#L64](../src/screens/RequestsListScreen.tsx#L64) renders every required field:

| Required | Rendered as |
|---|---|
| Reference No. | `cardRef` text |
| Address to | `cardAddress` text |
| Status | `<StatusBadge>` with colour pill |
| Issued on (if available) | `cardDate` text — only shown if `item.issuedOn` |
| Purpose snippet (optional) | `cardPurpose` text, `numberOfLines={2}` |

### R02 — Sorting

- Sort by `Issued on`: [listOps.ts#L36](../src/domain/listOps.ts#L36) → `asTimestamp` comparison.
- Sort by `Status`: [listOps.ts#L39](../src/domain/listOps.ts#L39) → `statusSortWeight` (New < Pending < Under Review < Done).
- Sort order toggle (asc/desc): [listOps.ts#L41](../src/domain/listOps.ts#L41).
- UI: bottom-sheet modal [SortFilterModal.tsx](../src/components/SortFilterModal.tsx).

### R03 — Filtering / search

[listOps.ts#L17-L32](../src/domain/listOps.ts#L17):

| Field | Rule | Implementation |
|---|---|---|
| Reference No. | full match | `ref === q \|\| ref === \`ref-${q}\` \|\| ref.replace(/^ref-/, '') === q` — accepts both `REF-100` and `100` |
| Address to | contains | `r.addressTo.toLowerCase().includes(q)` |
| Status | full match | `r.status.toLowerCase() === q` |

OR semantics across the three fields (one query box, matches any field).

### R04 — GET from backend

- Endpoint with key: [apiClient.ts#L24](../src/services/apiClient.ts#L24).
- Triggered on tab focus: [RequestsListScreen.tsx#L106](../src/screens/RequestsListScreen.tsx#L106) via `useFocusEffect`.
- Pull-to-refresh: [RequestsListScreen.tsx#L205](../src/screens/RequestsListScreen.tsx#L205) via `RefreshControl`.
- Handles both response shapes from the live API (plain array AND `{ value: [...] }` wrapper): [certificateService.ts#L34](../src/services/certificateService.ts#L34). The wrapper is what Azure sends when content negotiation prefers OData; the bare array is what it sends to browsers. We tolerate both.

---

## F04 — View individual request + PDF preview

### R01 — Detail screen

- Navigation push from list → detail: [RequestsListScreen.tsx#L135](../src/screens/RequestsListScreen.tsx#L135) → `navigation.navigate('RequestDetail', { referenceNo })`.
- Detail layout: [RequestDetailScreen.tsx](../src/screens/RequestDetailScreen.tsx).
- Includes a 4-step progress stepper for status context: [StatusStepper.tsx](../src/components/StatusStepper.tsx).

### R02 — PDF preview

- For `status === 'Done'`: a "View Certificate" button opens [CertificateViewScreen.tsx](../src/screens/CertificateViewScreen.tsx), which renders an in-app HTML certificate via `react-native-webview`, populated with the request's actual data (reference, address, purpose, issued date).
- For other statuses: "Certificate is yet to be issued." message ([RequestDetailScreen.tsx](../src/screens/RequestDetailScreen.tsx) `pendingCard`).
- **Justification for HTML over binary PDF**: The brief explicitly permits a "reasonable approach" including a bundled sample for Done. An HTML certificate in WebView:
  - Works identically on iOS, Android, and Web (a bundled PDF requires platform-specific viewers and `expo-file-system` URI tricks on Android).
  - Is populated with real data per-request (not a static placeholder).
  - Looks like a real certificate (border, seal-style typography, signature line).
  - Sanitises all interpolated values via `escapeHtml` to prevent injection.

### Conditional display rules

| Field | Spec rule | Implementation |
|---|---|---|
| Reference No. | always | [RequestDetailScreen.tsx#L81](../src/screens/RequestDetailScreen.tsx#L81) |
| Address to | always | [RequestDetailScreen.tsx#L92](../src/screens/RequestDetailScreen.tsx#L92) |
| Purpose | always | [RequestDetailScreen.tsx#L106](../src/screens/RequestDetailScreen.tsx#L106) |
| Issued on | only if Done | [requestRules.ts#L42](../src/domain/requestRules.ts#L42) → `showIssuedOn`, used at [RequestDetailScreen.tsx#L96](../src/screens/RequestDetailScreen.tsx#L96) |
| Status | always | [RequestDetailScreen.tsx#L82](../src/screens/RequestDetailScreen.tsx#L82) |

---

## F05 — Update request (local-only)

### R01 — Editable only when "New"

- [requestRules.ts#L35](../src/domain/requestRules.ts#L35) → `canEditPurpose(status) === (status === 'New')`.
- UI toggles between editable TextInput and read-only Text: [RequestDetailScreen.tsx#L126](../src/screens/RequestDetailScreen.tsx#L126).
- Explicit "Save Changes" button: [RequestDetailScreen.tsx#L164](../src/screens/RequestDetailScreen.tsx#L164).
- Defence-in-depth: even if the UI is bypassed, [requestRules.ts#L57](../src/domain/requestRules.ts#L57) `applyPurposeUpdate` filters out non-`New` requests before mutating state.

### R02 — Reflect updates immediately

- The save handler dispatches `UPDATE_PURPOSE` to the reducer: [CertificateContext.tsx#L88](../src/state/CertificateContext.tsx#L88).
- The reducer updates `state.requests` directly AND stores the change in `purposeOverrides` so it survives a subsequent refresh: [CertificateContext.tsx#L90](../src/state/CertificateContext.tsx#L90).
- Because the list screen subscribes to the same Context, the change appears immediately on navigation back — no refresh needed.
- **No backend call** — `updatePurpose` is synchronous and only mutates local state, per assessment constraint.

---

## Tests

| Suite | File | Tests | Coverage |
|---|---|---|---|
| Validation (F02) | [validation.test.ts](../__tests__/validation.test.ts) | 13 | All 4 fields, all rules (empty, whitespace, min length, future date, regex) |
| List operations (F03) | [listOps.test.ts](../__tests__/listOps.test.ts) | 10 | Filter by ref/address/status/no-match; sort by issued/status × asc/desc; immutability |
| Request rules (F04, F05) | [requestRules.test.ts](../__tests__/requestRules.test.ts) | 13 | normalizeStatus, statusSortWeight, canEditPurpose, showIssuedOn, showPdf, applyPurposeUpdate (5 scenarios) |
| Certificate screen (F04) | [CertificateViewScreen.test.tsx](../__tests__/CertificateViewScreen.test.tsx) | 4 | Renders WebView on iOS/Android; renders iframe on web; "not found" edge case |
| **Total** | | **40** | All passing — `npm test` |

---

## Known constraints / non-goals

- **CORS for web dev**: The Azure API does not return `Access-Control-Allow-Origin` headers. For browser-based development we provide a tiny Node proxy ([scripts/proxy.js](../scripts/proxy.js)) on port 3001. `npm run dev` starts both Expo and the proxy. **Native iOS/Android builds talk to Azure directly** (no CORS restriction on mobile) — the proxy is only for the web preview.
- **CI pipeline**: Implemented in [.github/workflows/ci.yml](../.github/workflows/ci.yml). Runs `tsc --noEmit` + `npm test` on every push and pull request to `main`/`master`. The API key is set to a placeholder in CI (tests make no real network calls).
- **TestFlight build**: Not implemented — requires a paid Apple Developer account ($99/yr). EAS Build command would be `eas build --platform ios`.
- **Authentication beyond API key**: Explicitly out-of-scope per brief §6.
