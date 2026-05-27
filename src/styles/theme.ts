/** Design tokens — single source of truth for all colours, spacing, radius. */

export const colors = {
  // Backgrounds
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',

  // Borders & dividers
  border: '#E2E8F0',
  divider: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Brand accent (teal)
  accent: '#0F766E',
  accentLight: '#CCFBF1',
  accentText: '#134E4A',

  // Status — New (blue)
  statusNew: '#2563EB',
  statusNewBg: '#EFF6FF',
  statusNewBorder: '#BFDBFE',

  // Status — Pending (amber)
  statusPending: '#D97706',
  statusPendingBg: '#FFFBEB',
  statusPendingBorder: '#FDE68A',

  // Status — Under Review (orange)
  statusUnderReview: '#EA580C',
  statusUnderReviewBg: '#FFF7ED',
  statusUnderReviewBorder: '#FED7AA',

  // Status — Done (green)
  statusDone: '#16A34A',
  statusDoneBg: '#F0FDF4',
  statusDoneBorder: '#BBF7D0',

  // Danger
  danger: '#DC2626',
  dangerLight: '#FEF2F2',

  // Overlay
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  modal: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
