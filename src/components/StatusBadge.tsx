import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CertificateStatus } from '../types/certificate';
import { colors, radius } from '../styles/theme';

interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  label: string;
}

const CONFIG: Record<CertificateStatus, StatusConfig> = {
  New: {
    bg: colors.statusNewBg,
    text: colors.statusNew,
    dot: colors.statusNew,
    label: 'New',
  },
  Pending: {
    bg: colors.statusPendingBg,
    text: colors.statusPending,
    dot: colors.statusPending,
    label: 'Pending',
  },
  'Under Review': {
    bg: colors.statusUnderReviewBg,
    text: colors.statusUnderReview,
    dot: colors.statusUnderReview,
    label: 'Under Review',
  },
  Done: {
    bg: colors.statusDoneBg,
    text: colors.statusDone,
    dot: colors.statusDone,
    label: 'Done',
  },
};

interface Props {
  status: CertificateStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status] ?? CONFIG['New'];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg },
        size === 'sm' && styles.badgeSm,
      ]}
      accessibilityLabel={`Status: ${cfg.label}`}
    >
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text
        style={[
          styles.label,
          { color: cfg.text },
          size === 'sm' && styles.labelSm,
        ]}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
});
