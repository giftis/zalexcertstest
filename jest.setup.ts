// Global Jest setup — runs after the test framework is installed.
// The domain test suites (validation, listOps, requestRules) are pure function
// tests and need no additional matchers.
// The component test suite (CertificateViewScreen) uses @testing-library/react-native
// built-in queries (getByText, getByTestId) which need no extend-expect import.
