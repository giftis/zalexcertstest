/**
 * CertificateViewScreen tests
 *
 * Verifies that the certificate preview renders correctly on all three
 * platforms (web => iframe, ios => WebView, android => WebView) and handles
 * the "request not found" edge case.
 */
import React from 'react';
import { Platform } from 'react-native';
import { render, screen } from '@testing-library/react-native';

// -- WebView mock --------------------------------------------------------------
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  const MockWebView = (props: unknown) => (
    <View testID="native-webview" {...(props as object)} />
  );
  return { __esModule: true, default: MockWebView };
});

// -- Navigation mock -----------------------------------------------------------
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { referenceNo: 'REF-100' } }),
}));

// -- Context mock --------------------------------------------------------------
const mockGetRequest = jest.fn();
jest.mock('../src/state/CertificateContext', () => ({
  useCertificates: () => ({ getRequest: mockGetRequest }),
}));

import { CertificateViewScreen } from '../src/screens/CertificateViewScreen';

const DONE_REQUEST = {
  id: '100-0',
  referenceNo: 'REF-100',
  addressTo: 'Director General',
  purpose: 'A'.repeat(60),
  issuedOn: '12/1/2026',
  status: 'Done' as const,
};

/** Patch Platform.OS for the duration of a single test, then restore. */
function withPlatform(os: string, fn: () => void) {
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  try {
    fn();
  } finally {
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
  }
}

describe('CertificateViewScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows error text when request is not found', () => {
    mockGetRequest.mockReturnValue(undefined);
    render(<CertificateViewScreen />);
    expect(screen.getByText('Request not found.')).toBeTruthy();
  });

  it('renders the native WebView on iOS', () => {
    withPlatform('ios', () => {
      mockGetRequest.mockReturnValue(DONE_REQUEST);
      render(<CertificateViewScreen />);
      expect(screen.getByTestId('native-webview')).toBeTruthy();
    });
  });

  it('renders the native WebView on Android', () => {
    withPlatform('android', () => {
      mockGetRequest.mockReturnValue(DONE_REQUEST);
      render(<CertificateViewScreen />);
      expect(screen.getByTestId('native-webview')).toBeTruthy();
    });
  });

  it('does NOT render the native WebView on web (uses iframe instead)', () => {
    withPlatform('web', () => {
      mockGetRequest.mockReturnValue(DONE_REQUEST);
      render(<CertificateViewScreen />);
      expect(screen.queryByTestId('native-webview')).toBeNull();
    });
  });
});
