# Engineering Journal — From Brief to Realisation

This document narrates every significant decision made during the build of the Zalex Inc. Employee Certificate Solution, in chronological order. It explains *why* each choice was made, what alternatives were considered, and what problems were encountered along the way.

---

## 1. Reading the Brief

The first step was reading the full assessment document carefully before writing a single line of code. Several things stood out immediately:

**What the spec said clearly:**
- React Native, TypeScript, functional components with hooks, Context API for state
- Five features (F01–F05), each with sub-requirements and acceptance criteria
- A live Azure API with documented endpoints and a subscription key
- Deliverables: working app, README, architecture notes, unit tests

**What the spec left ambiguous:**
- "PDF preview" — was this a real binary PDF download, or would an in-app view suffice?
- "Alphanumeric" for `address_to` — the sample data in the spec itself contained spaces and punctuation
- "All platforms" — did this mean iOS + Android only, or including the web dev preview?
- "Clear confirmation" on form submit — Alert dialog, toast, or a screen?

The deliberate approach was to **test the live API before building anything**, because spec examples and live APIs often diverge.

---

## 2. Probing the Live API First

Before building the data layer, I ran direct requests against `https://zalexinc.azure-api.net` from PowerShell:

```powershell
Invoke-RestMethod "https://zalexinc.azure-api.net/request-list?subscription-key=..."
```

This revealed **four critical discrepancies** between the spec and the live API:

| Discovery | Spec said | Live API returned | Impact |
|---|---|---|---|
| GET response shape | plain array `[...]` | `{ value: [...], Count: 9 }` | `fetchRequests` must unwrap `.value` |
| POST response key | `response` | `responce` (typo) | `createRequest` must check the typo'd key |
| Status values | "New", "Done" only implied | "New", "Pending", "Under Review", "Done" | UI must handle 4 statuses |
| `reference_no` type | string `"100"` implied | number `100` | `mapRecord` must format as `REF-100` |

**Decision**: Trust the live API, not the spec examples. Document every deviation. This resulted in ADR-005 and ADR-006.

An additional problem appeared only during browser testing: the API returns **no CORS headers**, so browser-based `fetch` calls are blocked. The solution was a lightweight local Node proxy (`scripts/proxy.js`) that forwards to Azure and injects `Access-Control-Allow-Origin: *`. Native apps (iOS/Android) are not affected by CORS so the proxy is dev-only.

---

## 3. Choosing the Technology Stack

With the live API understood, I selected each library with a specific rationale:

### Expo SDK (managed workflow)
The brief required a cross-platform app with no native module customisation. Managed workflow means:
- No Xcode or Android Studio required to run `npm start`
- Works in the browser for evaluation via `expo start --web`
- Ejectable to bare workflow later if needed

### Context API + useReducer (not Redux)
The brief explicitly listed Redux/Zustand as options but did not require them. For an app with a single shared concern (a list of requests + one pending form), Redux would add:
- Extra dependencies (`redux`, `react-redux`, `@reduxjs/toolkit`)
- Boilerplate (slices, selectors, dispatch patterns)
- No measurable benefit at this scale

Context + `useReducer` gives the same predictable action → state pattern with zero extra packages. All state transitions live in one reducer function — easy to audit in a code review.

### react-hook-form + Zod
The F02 form has four fields with independent validation rules. Options considered:
- **Controlled state with `useState`**: requires a re-render on every keystroke, inline validation logic scattered across the component
- **Formik**: older API, heavier bundle, worse TypeScript inference
- **react-hook-form + Zod**: uncontrolled inputs (minimal re-renders), schema defined once as a Zod type that also serves as the TypeScript interface, `zodResolver` bridges them in one line

The Zod schema in `src/domain/validation.ts` is a single source of truth for all four field rules. It is tested independently without rendering the form.

### Pure domain layer (no React in business logic)
The most important structural decision. All rules — validation, filtering, sorting, conditional display, edit guards — live in `src/domain/` as plain TypeScript functions. They have no React imports, no `useEffect`, no I/O.

This means the three test suites (validation, listOps, requestRules) test 36 of the 40 tests **without ever rendering a component**. Tests run in milliseconds, have no flakiness from timers or async, and require no mocks for the rules themselves.

---

## 4. Building the Features in Order

### F01 — List (built first, as it drives everything else)
The list screen is the app's home. Building it first forced the data layer (`apiClient`, `certificateService`, `CertificateContext`) to exist before the other screens. Decisions made here:
- `mapRecord` translates raw API snake_case to camelCase domain types — all consumers downstream never see raw API shapes
- `useFocusEffect` (not `useEffect`) to reload the list when navigating back from a form submission or a detail edit
- `id` field added to `CertificateRequest` at the service layer (`mapRecord(r, index)` sets `id: \`${r.reference_no}-${index}\``) — discovered the live API has two records with `reference_no: 50`, so `referenceNo` cannot be used as a React key; a stable, unique `id` is generated instead and used in `keyExtractor={(item) => item.id}`

### F02 — Form
The date picker decision (ADR-011) was forced by discovering that `@react-native-community/datetimepicker` throws on the web platform. The `Platform.OS === 'web'` guard renders a text input fallback. This same pattern later applied to the certificate WebView.

The success confirmation was implemented as a dedicated screen (`RequestSuccessScreen`) rather than `Alert.alert()`. `Alert` cannot be visually customised, is inaccessible to screen readers in some configurations, and disappears immediately with no navigation trace. A success screen provides a clean UX story and satisfies "clear confirmation" more robustly.

An optimistic local entry (`ADD_LOCAL` action) is added to the Context immediately on success, so if the user navigates back to the list before the next full refresh, their new request appears.

### F03 — Search and Sort
The `filterRequests` function uses OR semantics across three fields: reference number (exact), address (contains), status (exact). A late discovery was that the reference numbers in state are stored as `REF-100` but a user would naturally type `100`. The filter was updated to accept both forms: `ref === q || ref === \`ref-${q}\` || ref.replace(/^ref-/, '') === q`.

### F04 — Detail + Certificate
The "PDF preview" ambiguity was resolved as ADR-008: render an HTML certificate in `react-native-webview`. The brief says "in-app PDF preview" and explicitly permits a placeholder. An HTML template populated with real request data is superior to a static bundled PDF (which would be the same file for all requests), and it works without a PDF binary serving endpoint.

The conditional display rules (`showIssuedOn`, `showPdf`, `canEditPurpose`) are pure functions in `requestRules.ts`, not inline `status === 'Done'` checks scattered through the component. This keeps the component readable and the rules unit-testable.

### F05 — Edit Purpose
The brief says updates should be "immediately reflected". Since there is no PUT endpoint, updates are stored in `purposeOverrides` within the Context reducer. When the API refreshes, overrides are re-merged so edits survive a refresh. The `canEditPurpose` guard is enforced both in the UI (toggles input vs text) and in `applyPurposeUpdate` (silently ignores non-New requests), giving defence in depth.

---

## 5. Problems Encountered and How They Were Resolved

| Problem | Root cause | Fix |
|---|---|---|
| Browser `fetch` blocked (CORS) | Azure API has no `Access-Control-Allow-Origin` header | Built `scripts/proxy.js` — a Node http→https proxy on port 3001 that injects CORS headers |
| Gzip corruption (`Unexpected token \xef`) | Proxy forwarded compressed bytes raw without decompressing | Deleted `accept-encoding` from forwarded headers; set `accept-encoding: identity` |
| `Cannot read properties of undefined (reading 'map')` | Azure returns `{ value: [...] }` to browsers but plain array to PowerShell | `certificateService.ts`: `Array.isArray(data) ? data : data.value` |
| Duplicate React keys | Two API records share `reference_no: 50` | `mapRecord` assigns a stable `id: \`${reference_no}-${index}\`` at the service layer; `keyExtractor={(item) => item.id}` uses it |
| `POST responce` key mismatch | API has a typo (`responce` not `response`) | Accept both keys: `res.responce ?? res.response` |
| `react-native-webview` crashes on web | Library does not support the browser platform | `Platform.OS === 'web'` branch renders `<iframe srcDoc>` instead |
| Metro `enhanceMiddleware` does not exist in 0.84 | First proxy attempt via `metro.config.js` used a Metro API removed in 0.84 | Abandoned the Metro approach; standalone Node proxy is simpler and more transparent |

---

## 6. Testing Strategy

Tests were scoped deliberately to the domain layer, not to components, for three reasons:

1. **Speed**: pure function tests need no React rendering, no timers, no mocks — the 36 domain tests run in ~1 second
2. **Stability**: no async rendering, no `act()` warnings, no flakiness from environment
3. **Specification value**: the test file reads like a specification — `it('fails when purpose is less than 50 characters')` is more informative than checking a specific component's rendered output

The fourth test suite (`CertificateViewScreen.test.tsx`) was added when it was discovered that the WebView platform branch was untested. It uses `Object.defineProperty(Platform, 'OS', ...)` per test to exercise all three platform paths (iOS, Android, web) and the "not found" edge case. The WebView is mocked with a testID so tests can detect its presence or absence without rendering native modules.

The CI workflow (ADR-013) ensures these 40 tests run automatically on every commit.

---

## 7. Documentation Approach

Four documentation artefacts were produced, each serving a different reader:

| Document | Audience | Purpose |
|---|---|---|
| `README.md` | Developer onboarding | Quick start, env vars, project structure, known API quirks |
| `docs/traceability.md` | Assessor / code reviewer | Requirement → file mapping, no prose, easy to scan |
| `docs/assessment.md` | Assessor | Every sub-requirement mapped to a specific `file:line` with evidence quotes; deviations justified |
| `docs/decisions.md` | Future maintainer / assessor | Architecture decision records (ADRs) — what was decided, why, and what was rejected |
| `docs/engineering-journal.md` (this file) | Assessor | Narrative of the entire build — intent, trade-offs, surprises |

---

## 8. What Would Change in a Production Version

The MVP deliberately deferred several concerns that are out of scope for the assessment:

| Deferred concern | Why deferred | Production approach |
|---|---|---|
| Purpose edits not persisted | No PUT/PATCH endpoint exists | Add `PATCH /request-certificate/{ref}` and call it from `updatePurpose` |
| No authentication | Out of scope per brief §6 | OAuth2 / MSAL for Azure AD identity |
| HTML certificate instead of PDF | No PDF endpoint; brief permits placeholder | Backend generates and signs a PDF; WebView loads the URL directly |
| Synthetic `id` field | API defect (`reference_no: 50` appears twice); `id` currently uses array position | Fix upstream data to return a proper UUID; drop the position-based suffix |
| CORS proxy for web dev | Azure has no CORS headers | Azure API Management policy adds the headers, or the app is native-only |
| No offline support | Not required by brief | React Query + SQLite for offline-first caching |
