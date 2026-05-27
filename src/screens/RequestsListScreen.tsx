import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SortFilterModal } from '../components/SortFilterModal';
import { StatusBadge } from '../components/StatusBadge';
import { formatDisplayDate } from '../domain/date';
import { filterRequests, sortRequests, SortBy, SortOrder } from '../domain/listOps';
import type { RequestsStackParamList } from '../navigation/types';
import { useCertificates } from '../state/CertificateContext';
import { colors, radius, shadow, spacing } from '../styles/theme';
import type { CertificateRequest, CertificateStatus } from '../types/certificate';

type Navigation = NativeStackNavigationProp<RequestsStackParamList>;

const TRACKED_STATUSES: CertificateStatus[] = [
  'New',
  'Pending',
  'Under Review',
  'Done',
];

// ─── Status summary card ──────────────────────────────────────────────────────

interface SummaryCardProps {
  status: CertificateStatus;
  count: number;
}

const STATUS_COLORS: Record<CertificateStatus, string> = {
  New: colors.statusNew,
  Pending: colors.statusPending,
  'Under Review': colors.statusUnderReview,
  Done: colors.statusDone,
};

function SummaryCard({ status, count }: SummaryCardProps) {
  const color = STATUS_COLORS[status];
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={styles.summaryLabel}>{status}</Text>
    </View>
  );
}

// ─── Request list card ────────────────────────────────────────────────────────

interface CardProps {
  item: CertificateRequest;
  onPress: () => void;
}

function RequestCard({ item, onPress }: CardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Certificate request ${item.referenceNo}, status ${item.status}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardRef}>{item.referenceNo}</Text>
        <StatusBadge status={item.status} size="sm" />
      </View>
      <Text style={styles.cardAddress} numberOfLines={1}>
        {item.addressTo}
      </Text>
      <Text style={styles.cardPurpose} numberOfLines={2}>
        {item.purpose}
      </Text>
      {item.issuedOn ? (
        <Text style={styles.cardDate}>
          Issued: {formatDisplayDate(item.issuedOn)}
        </Text>
      ) : null}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RequestsListScreen() {
  const navigation = useNavigation<Navigation>();
  const { requests, isLoading, error, loadRequests } = useCertificates();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('issuedOn');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [showSortModal, setShowSortModal] = useState(false);

  // Load data every time the tab gains focus (F01)
  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  // F03 — filter then sort
  const displayed = useMemo(
    () => sortRequests(filterRequests(requests, searchQuery), sortBy, order),
    [requests, searchQuery, sortBy, order],
  );

  // Counts per status for the summary row
  const statusCounts = useMemo(
    () =>
      TRACKED_STATUSES.reduce<Record<CertificateStatus, number>>(
        (acc, s) => {
          acc[s] = requests.filter((r) => r.status === s).length;
          return acc;
        },
        { New: 0, Pending: 0, 'Under Review': 0, Done: 0 },
      ),
    [requests],
  );

  const renderItem = ({ item }: { item: CertificateRequest }) => (
    <RequestCard
      item={item}
      onPress={() =>
        navigation.navigate('RequestDetail', { referenceNo: item.referenceNo })
      }
    />
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Certificate Requests</Text>
          <Text style={styles.headerSub}>
            {requests.length === 0
              ? 'No requests yet'
              : `${requests.length} request${requests.length === 1 ? '' : 's'}`}
          </Text>
        </View>
      </View>

      {/* ── Status summary ── */}
      {requests.length > 0 && (
        <View style={styles.summaryRow}>
          {TRACKED_STATUSES.filter((s) => statusCounts[s] > 0).map((s) => (
            <SummaryCard key={s} status={s} count={statusCounts[s]} />
          ))}
        </View>
      )}

      {/* ── Search + Sort bar ── */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by reference, address or status"
          placeholderTextColor={colors.textMuted}
          clearButtonMode="while-editing"
          returnKeyType="search"
          accessibilityLabel="Search certificate requests"
        />
        <Pressable
          style={({ pressed }) => [
            styles.sortButton,
            pressed && styles.sortButtonPressed,
          ]}
          onPress={() => setShowSortModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Sort options"
        >
          <Text style={styles.sortButtonText}>⇅ Sort</Text>
        </Pressable>
      </View>

      {/* ── Error banner ── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadRequests}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── List ── */}
      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadRequests}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centred}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <View style={styles.centred}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching requests' : 'No requests yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {searchQuery
                  ? 'Try a different reference, address or status.'
                  : 'Tap "New Request" to submit your first certificate request.'}
              </Text>
            </View>
          )
        }
      />

      {/* ── Sort / filter modal ── */}
      <SortFilterModal
        visible={showSortModal}
        sortBy={sortBy}
        order={order}
        onApply={(by, ord) => {
          setSortBy(by);
          setOrder(ord);
          setShowSortModal(false);
        }}
        onClose={() => setShowSortModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  summaryCard: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 2,
    minWidth: 56,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textPrimary,
    ...shadow.card,
  },
  sortButton: {
    height: 42,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  sortButtonPressed: {
    opacity: 0.7,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 24,
    gap: 10,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardRef: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  cardAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardPurpose: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
