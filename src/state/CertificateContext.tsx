import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import { formatApiDate } from '../domain/date';
import { applyPurposeUpdate, canEditPurpose } from '../domain/requestRules';
import {
  createRequest as apiCreateRequest,
  CreateRequestInput,
  fetchRequests,
} from '../services/certificateService';
import { CertificateRequest } from '../types/certificate';

// ─── State shape ──────────────────────────────────────────────────────────────

interface State {
  /** All requests visible to the UI (remote + local, with overrides applied). */
  requests: CertificateRequest[];
  isLoading: boolean;
  error: string | null;
  /** Local-only purpose edits (F05 — never sent to backend). */
  purposeOverrides: Record<string, string>;
  /** Requests created locally that haven't been confirmed by a refresh yet. */
  localRequests: CertificateRequest[];
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: CertificateRequest[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'ADD_LOCAL'; payload: CertificateRequest }
  | { type: 'UPDATE_PURPOSE'; payload: { referenceNo: string; purpose: string } };

const initialState: State = {
  requests: [],
  isLoading: false,
  error: null,
  purposeOverrides: {},
  localRequests: [],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function applyOverrides(
  requests: CertificateRequest[],
  overrides: Record<string, string>,
): CertificateRequest[] {
  return requests.map((r) => {
    const override = overrides[r.referenceNo];
    return override !== undefined ? { ...r, purpose: override } : r;
  });
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };

    case 'FETCH_SUCCESS': {
      const remote = applyOverrides(action.payload, state.purposeOverrides);
      // Keep locally-created requests that haven't appeared in the backend yet.
      const remoteRefs = new Set(remote.map((r) => r.referenceNo));
      const pendingLocal = state.localRequests.filter(
        (r) => !remoteRefs.has(r.referenceNo),
      );
      return {
        ...state,
        isLoading: false,
        error: null,
        requests: [...pendingLocal, ...remote],
      };
    }

    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };

    case 'ADD_LOCAL':
      return {
        ...state,
        localRequests: [action.payload, ...state.localRequests],
        requests: [action.payload, ...state.requests],
      };

    case 'UPDATE_PURPOSE': {
      const { referenceNo, purpose } = action.payload;
      const newOverrides = { ...state.purposeOverrides, [referenceNo]: purpose };
      return {
        ...state,
        purposeOverrides: newOverrides,
        requests: applyPurposeUpdate(state.requests, referenceNo, purpose),
        localRequests: applyPurposeUpdate(
          state.localRequests,
          referenceNo,
          purpose,
        ),
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CertificateContextValue {
  requests: CertificateRequest[];
  isLoading: boolean;
  error: string | null;
  /** Trigger a fresh fetch from the API. */
  loadRequests: () => Promise<void>;
  /** Submit a new certificate request to the API. Returns true on success. */
  submitRequest: (input: CreateRequestInput) => Promise<boolean>;
  /**
   * F05 — Save a local-only purpose edit.
   * Returns false if the request is not found or is not in 'New' status.
   */
  updatePurpose: (referenceNo: string, purpose: string) => boolean;
  /** Look up a single request by its referenceNo. */
  getRequest: (referenceNo: string) => CertificateRequest | undefined;
}

const CertificateContext = createContext<CertificateContextValue | undefined>(
  undefined,
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CertificateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadRequests = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await fetchRequests();
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({
        type: 'FETCH_ERROR',
        payload:
          err instanceof Error ? err.message : 'Failed to load requests.',
      });
    }
  }, []);

  const submitRequest = useCallback(
    async (input: CreateRequestInput): Promise<boolean> => {
      const ok = await apiCreateRequest(input);
      if (!ok) return false;
      // Add an optimistic local entry so the list reflects the new request
      // immediately without waiting for a refresh.
      const localId = `LOCAL-${Date.now()}`;
      const local: CertificateRequest = {
        id: localId,
        referenceNo: localId,
        status: 'New',
        addressTo: input.addressTo,
        purpose: input.purpose,
        issuedOn: formatApiDate(input.issuedOn),
      };
      dispatch({ type: 'ADD_LOCAL', payload: local });
      return true;
    },
    [],
  );

  const updatePurpose = useCallback(
    (referenceNo: string, purpose: string): boolean => {
      const target = state.requests.find((r) => r.referenceNo === referenceNo);
      if (!target || !canEditPurpose(target.status)) return false;
      dispatch({ type: 'UPDATE_PURPOSE', payload: { referenceNo, purpose } });
      return true;
    },
    [state.requests],
  );

  const getRequest = useCallback(
    (referenceNo: string) =>
      state.requests.find((r) => r.referenceNo === referenceNo),
    [state.requests],
  );

  const value = useMemo<CertificateContextValue>(
    () => ({
      requests: state.requests,
      isLoading: state.isLoading,
      error: state.error,
      loadRequests,
      submitRequest,
      updatePurpose,
      getRequest,
    }),
    [
      state.requests,
      state.isLoading,
      state.error,
      loadRequests,
      submitRequest,
      updatePurpose,
      getRequest,
    ],
  );

  return (
    <CertificateContext.Provider value={value}>
      {children}
    </CertificateContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCertificates(): CertificateContextValue {
  const ctx = useContext(CertificateContext);
  if (!ctx) {
    throw new Error('useCertificates must be used within a CertificateProvider');
  }
  return ctx;
}
