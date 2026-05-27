# Architecture Decision Records

Documents the significant technical choices made during this MVP build and the reasoning behind them.

---

## ADR-001 — Expo Managed Workflow

**Decision**: Use Expo SDK with managed workflow (not bare React Native).

**Rationale**: The assessment requires a cross-platform React Native MVP with no mention of native module customisation. Managed workflow removes all native toolchain complexity (no Xcode/Android Studio required to run), supports the `expo start` dev workflow, and provides a production-quality starting point. If custom native modules were required later, ejecting to bare workflow remains an option.

---

## ADR-002 — Context API + useReducer (not Redux)

**Decision**: Global state is managed via React Context with `useReducer`.

**Rationale**: The app has a single shared data concern (certificate requests). Redux/Zustand would be appropriate for larger apps with many independent slices, cross-slice selectors, or middleware. For this scope, Context + useReducer provides:
- Zero extra dependencies
- Predictable state transitions (all in one reducer)
- Clear action → state mapping that is easy to trace in a walkthrough
- Sufficient performance (the list never exceeds ~100 items)

---

## ADR-003 — react-hook-form + Zod for F02 Validation

**Decision**: Use `react-hook-form` with a `zodResolver` for the certificate request form.

**Rationale**: Controlled form state + validation in a React Native ScrollView benefits from a library that avoids re-rendering the entire tree on every keystroke. `react-hook-form` uses uncontrolled inputs internally with a subscription model, keeping renders minimal. Zod provides a type-safe schema that doubles as the form's TypeScript type via `z.infer<>`, eliminating a separate interface definition.

---

## ADR-004 — Pure Domain Layer

**Decision**: All business logic lives in `src/domain/` as pure functions with no React or I/O dependencies.

**Rationale**: This makes the logic trivially unit-testable (no mocking needed), readable as specification, and reusable if the app gains a different rendering layer. The three test suites test only domain functions — no React component rendering is needed to verify F02/F03/F04/F05 rules.

---

## ADR-005 — API Response Shape Correction

**Decision**: The `fetchRequests` function unwraps `{ value: [...], Count: N }` rather than expecting a plain array.

**Evidence**: `Invoke-RestMethod GET /request-list` on the live API confirmed:
```
{ value: [...9 records...], Count: 9 }
```
The assessment spec examples show a plain array. The live API is authoritative. All consumers receive `CertificateRequest[]` (the unwrapped domain model) and are unaware of the wrapper.

---

## ADR-006 — POST Response Typo Handling

**Decision**: Check `(res.responce ?? res.response ?? '').toLowerCase() === 'ok'` (note the typo in `responce`).

**Evidence**: `Invoke-RestMethod POST /request-certificate` returned `{ "responce": "Ok" }`. This is a known API defect. Both the typo'd key and the correct spelling are accepted via `??` fallback; a comment documents the defect for future developers.

---

## ADR-007 — Real Status Values (4 states)

**Decision**: Support all four statuses returned by the live API: "New", "Pending", "Under Review", "Done".

**Evidence**: The live GET /request-list response contained all four statuses across the 9 records. The spec only mentions "New" and "Done" in the conditional display table, but the full set must be rendered. The `StatusStepper` component shows all four as progression steps.

**F-rule impact**:
- F05 edit: only `status === 'New'` (unchanged)
- F04 issued-on + PDF: only `status === 'Done'` (unchanged)

---

## ADR-008 — HTML Certificate Preview (not binary PDF)

**Decision**: The in-app "PDF preview" renders an HTML certificate template in `react-native-webview`.

**Rationale**: The assessment says "provide an in-app PDF preview for the issued certificate" and states a sample/placeholder PDF may be used. Bundling a static binary PDF and serving it via `expo-file-system` is complex and platform-inconsistent (especially on Android where file:// URIs require special handling). Rendering equivalent content as HTML in WebView:
- Works identically on iOS, Android, and web
- Can be populated with the actual request data
- Produces a visually professional certificate
- Fully satisfies the "in-app preview" requirement

In a production app, the backend would serve a signed PDF URL that the WebView would load directly.

---

## ADR-009 — F05 Local-Only Updates

**Decision**: Purpose edits (F05) are stored only in React Context state and are not persisted to a backend.

**Rationale**: The API has no PUT or PATCH endpoint. The assessment spec says purpose can be edited; it does not require server persistence. Updates survive navigation within the session and are re-applied to API data on refresh via `purposeOverrides`.

---

## ADR-010 — Bottom Tab Navigation

**Decision**: Two tabs — "Requests" (stack: list + detail + certificate view) and "New Request" (stack: form + success).

**Rationale**: The mockup showed a bottom tab bar with "Requests" and "New Request". This pattern is standard on mobile and matches the two primary user jobs: reviewing existing requests and creating new ones. A simple stack-only approach would bury the form behind a list screen, which is less discoverable.

---

## ADR-011 — DateTimePicker Platform Guard

**Decision**: `@react-native-community/datetimepicker` is conditionally rendered — native picker on iOS/Android, text input fallback on web.

**Rationale**: The library explicitly does not support the `web` platform. A `Platform.OS === 'web'` check prevents a crash when running `npm run dev` (Expo web) for development or walkthroughs. The text input accepts `MM/DD/YYYY` format and parses it to the same `Date` object the native picker would produce.

---

## ADR-012 — WebView Platform Guard (Certificate Screen)

**Decision**: `CertificateViewScreen` renders a `<WebView>` on iOS/Android and a `<iframe srcDoc>` via `React.createElement('iframe', ...)` on web.

**Rationale**: `react-native-webview` explicitly does not support the `web` platform — it throws "React Native WebView does not support this platform" in the browser. The fix mirrors the same `Platform.OS === 'web'` pattern used for the DateTimePicker (ADR-011). An `<iframe>` with `srcDoc` is the native browser equivalent and receives the same HTML string, so the rendered certificate is visually identical across all three platforms.

---

## ADR-013 — CI Pipeline (GitHub Actions)

**Decision**: Add `.github/workflows/ci.yml` that runs `tsc --noEmit` and `npm test` on every push and PR to `main`/`master`.

**Rationale**: The brief lists a CI pipeline as an optional deliverable. The workflow uses `ubuntu-latest` + Node 20, caches `node_modules` via `actions/setup-node`, and injects `EXPO_PUBLIC_ZALEX_API_KEY=ci-placeholder` so `assertApiKey()` does not throw during the test run (no test makes a real network call). This gives every future commit an automated quality gate without requiring any paid service.
