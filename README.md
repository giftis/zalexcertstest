# Zalex Inc. — Employee Certificate Request App

React Native MVP built with **Expo SDK** (managed workflow) to satisfy the Zalex Inc. Employee Certification Solution assessment.

> **For evaluators**: see [docs/assessment.md](docs/assessment.md) for the full requirement-to-code coverage matrix with `file:line` citations, [docs/decisions.md](docs/decisions.md) for architecture decision records, and [docs/engineering-journal.md](docs/engineering-journal.md) for the full narrative of the build from brief to realisation.

---

## Quick Start

```bash
# 1. Ensure .env.local exists with the API key
cp .env.example .env.local
# edit .env.local and add your subscription key

# 2. Install dependencies
npm install

# 3. Start development server (web + CORS proxy together)
npm run dev

# 4. Run tests
npm test
```

> **Web only:** `npm run dev` starts both the Expo web server (`localhost:8081`) and the CORS proxy (`localhost:3001`) together. The proxy is required because the Azure API has no `Access-Control-Allow-Origin` header. For native (iOS/Android) you can use `npx expo start` directly — native apps bypass CORS.

---

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_ZALEX_API_BASE_URL` | API base URL (default: `https://zalexinc.azure-api.net`) |
| `EXPO_PUBLIC_ZALEX_API_KEY` | Subscription key for Azure API Management |

Copy `.env.example` to `.env.local` and fill in your key. The `.env.local` file is git-ignored.

---

## Features (F01–F05)

| ID | Feature | Screen | Status |
|---|---|---|---|
| F01 | View list of certificate requests (live from API) | Requests tab | ✅ |
| F02 | Submit a new certificate request with validation | New Request tab | ✅ |
| F03 | Search by reference / address / status; sort by date or status | Requests list | ✅ |
| F04 | View request details with conditional display (Issued on, PDF for Done only) | Detail screen | ✅ |
| F05 | Edit purpose field (local, New status only) | Detail screen | ✅ |

---

## Project Structure

```
src/
  config/          # env vars (apiKey, apiBaseUrl)
  types/           # TypeScript types (domain + raw API shapes)
  domain/          # Pure business logic — no React, no I/O
    date.ts        # parseApiDate, formatApiDate, isFutureDate
    validation.ts  # Zod schema for F02 form
    requestRules.ts# F04/F05 conditional rules + normalizeStatus
    listOps.ts     # F03 filter + sort
  services/
    apiClient.ts   # fetch wrappers (getJson, postJson)
    certificateService.ts  # fetchRequests, createRequest
  state/
    CertificateContext.tsx  # Context + useReducer state
  navigation/      # React Navigation (bottom tabs + stack)
  styles/          # Design tokens (colors, radius, shadow)
  components/      # StatusBadge, StatusStepper, FieldError, SortFilterModal
  screens/
    RequestsListScreen.tsx
    RequestCertificateScreen.tsx
    RequestSuccessScreen.tsx
    RequestDetailScreen.tsx
    CertificateViewScreen.tsx  # in-app HTML certificate preview
__tests__/
  validation.test.ts          # F02 validation rules (13 tests)
  listOps.test.ts             # F03 filter/sort (10 tests)
  requestRules.test.ts        # F04/F05 business rules (13 tests)
  CertificateViewScreen.test.tsx  # F04 platform rendering (4 tests)
docs/
  traceability.md  # requirement ↔ code mapping
  decisions.md     # architecture decision records
```

---

## API Notes (Critical — deviates from spec examples)

The live API at `https://zalexinc.azure-api.net` differs from the spec document examples in several ways:

| Difference | Spec says | Live API returns |
|---|---|---|
| GET response shape | plain array | `{ value: [...], Count: N }` |
| POST success key | `response` | `responce` (typo in API) |
| Status values | "New" / "Done" | "New", "Pending", "Under Review", "Done" |
| `reference_no` type | string | number (formatted as `REF-{N}`) |
| `employee_id` in list | present | absent (only used in POST) |

All of these are handled in [`src/services/certificateService.ts`](src/services/certificateService.ts).

---

## Navigation

```
Tab Bar
├── Requests Tab (Stack)
│   ├── RequestsList        ← F01, F03
│   ├── RequestDetail       ← F04, F05
│   └── CertificateView     ← F04 (HTML certificate in WebView)
└── New Request Tab (Stack)
    ├── RequestCertificate  ← F02
    └── RequestSuccess      ← F02 (success screen, no Alert)
```

---

## Certificate Preview (F04)

For requests with `status === "Done"`, the detail screen shows a "View Certificate" button that opens an in-app HTML certificate rendered via `react-native-webview`. The HTML template is populated with the request's live data (reference, address, purpose, issued date).

> In production, the backend would serve a real PDF. The WebView approach renders an equivalent in-app certificate view without requiring a backend PDF endpoint.

---

## DateTimePicker (Platform note)

`@react-native-community/datetimepicker` is not supported on web. The form uses `Platform.OS === 'web'` to render a text-input fallback when running in a browser. On iOS and Android, the native date picker is used.

---

## Running Tests

```bash
npm test
# 4 suites, 40 tests, all passing
```
