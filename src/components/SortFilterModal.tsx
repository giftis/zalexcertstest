import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SortBy, SortOrder } from '../domain/listOps';
import { colors, radius, shadow } from '../styles/theme';

interface Props {
  visible: boolean;
  sortBy: SortBy;
  order: SortOrder;
  onApply: (sortBy: SortBy, order: SortOrder) => void;
  onClose: () => void;
}

export function SortFilterModal({
  visible,
  sortBy,
  order,
  onApply,
  onClose,
}: Props) {
  const [localSortBy, setLocalSortBy] = useState<SortBy>(sortBy);
  const [localOrder, setLocalOrder] = useState<SortOrder>(order);

  // Sync local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSortBy(sortBy);
      setLocalOrder(order);
    }
  }, [visible, sortBy, order]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessibilityLabel="Close sort options"
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.sectionTitle}>Sort by</Text>
        <RadioRow
          label="Issued on date"
          selected={localSortBy === 'issuedOn'}
          onPress={() => setLocalSortBy('issuedOn')}
        />
        <RadioRow
          label="Status"
          selected={localSortBy === 'status'}
          onPress={() => setLocalSortBy('status')}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Order</Text>
        <RadioRow
          label="Newest first"
          selected={localOrder === 'desc'}
          onPress={() => setLocalOrder('desc')}
        />
        <RadioRow
          label="Oldest first"
          selected={localOrder === 'asc'}
          onPress={() => setLocalOrder('asc')}
        />

        <Pressable
          style={({ pressed }) => [
            styles.applyButton,
            pressed && styles.applyButtonPressed,
          ]}
          onPress={() => onApply(localSortBy, localOrder)}
          accessibilityRole="button"
          accessibilityLabel="Apply sort"
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

interface RadioRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function RadioRow({ label, selected, onPress }: RadioRowProps) {
  return (
    <Pressable
      style={styles.radioRow}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    paddingBottom: 40,
    ...shadow.modal,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  radioLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  applyButton: {
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyButtonPressed: {
    opacity: 0.85,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
