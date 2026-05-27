import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBadge } from '../components/StatusBadge';
import { StatusStepper } from '../components/StatusStepper';
import { FieldError } from '../components/FieldError';
import { formatDisplayDate } from '../domain/date';
import { canEditPurpose, showIssuedOn, showPdf } from '../domain/requestRules';
import type {
  RequestDetailScreenProps,
  RequestsStackParamList,
} from '../navigation/types';
import { useCertificates } from '../state/CertificateContext';
import { colors, radius, shadow, spacing } from '../styles/theme';

type Navigation = NativeStackNavigationProp<RequestsStackParamList>;

const PURPOSE_MIN = 50;

export function RequestDetailScreen() {
  const route = useRoute<RequestDetailScreenProps['route']>();
  const navigation = useNavigation<Navigation>();
  const { referenceNo } = route.params;

  const { getRequest, updatePurpose } = useCertificates();
  const request = getRequest(referenceNo);

  const [editedPurpose, setEditedPurpose] = useState('');
  const [purposeError, setPurposeError] = useState<string | undefined>();
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (request) {
      setEditedPurpose(request.purpose);
    }
  }, [request?.purpose]);

  if (!request) {
    return (
      <View style={styles.centred}>
        <Text style={styles.notFoundText}>Request not found.</Text>
      </View>
    );
  }

  const editable = canEditPurpose(request.status);
  const showDate = showIssuedOn(request.status);
  const showCert = showPdf(request.status);

  const handleSavePurpose = () => {
    if (editedPurpose.trim().length < PURPOSE_MIN) {
      setPurposeError(`Purpose must be at least ${PURPOSE_MIN} characters.`);
      return;
    }
    setPurposeError(undefined);
    const ok = updatePurpose(referenceNo, editedPurpose.trim());
    if (ok) {
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header card ── */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.refNo}>{request.referenceNo}</Text>
          <StatusBadge status={request.status} />
        </View>
        <View style={styles.stepperWrapper}>
          <StatusStepper status={request.status} />
        </View>
      </View>

      {/* ── Address to ── */}
      <View style={styles.detailCard}>
        <Text style={styles.fieldLabel}>Addressed to</Text>
        <Text style={styles.fieldValue}>{request.addressTo}</Text>
      </View>

      {/* ── Issued on (Done only) ── */}
      {showDate && request.issuedOn ? (
        <View style={styles.detailCard}>
          <Text style={styles.fieldLabel}>Issued on</Text>
          <Text style={styles.fieldValue}>
            {formatDisplayDate(request.issuedOn)}
          </Text>
        </View>
      ) : null}

      {/* ── Purpose ── */}
      <View style={styles.detailCard}>
        <View style={styles.purposeHeader}>
          <Text style={styles.fieldLabel}>Purpose</Text>
          <View
            style={[
              styles.editBadge,
              !editable && styles.editBadgeReadonly,
            ]}
          >
            <Text
              style={[
                styles.editBadgeText,
                !editable && styles.editBadgeTextReadonly,
              ]}
            >
              {editable ? 'Edit allowed' : 'Read only'}
            </Text>
          </View>
        </View>

        {editable ? (
          <>
            <TextInput
              style={[
                styles.purposeInput,
                purposeError && styles.purposeInputError,
              ]}
              value={editedPurpose}
              onChangeText={(text) => {
                setEditedPurpose(text);
                if (purposeError) setPurposeError(undefined);
              }}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              accessibilityLabel="Edit purpose"
            />
            <View style={styles.purposeFooter}>
              <FieldError message={purposeError} />
              <Text
                style={[
                  styles.counter,
                  editedPurpose.length < PURPOSE_MIN && styles.counterWarning,
                ]}
              >
                {editedPurpose.length}/{PURPOSE_MIN} min
              </Text>
            </View>

            {savedMessage ? (
              <Text style={styles.savedMessage}>✓ Changes saved locally</Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
              ]}
              onPress={handleSavePurpose}
              accessibilityRole="button"
              accessibilityLabel="Save purpose changes"
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.fieldValue}>{request.purpose}</Text>
        )}
      </View>

      {/* ── Certificate section ── */}
      {showCert ? (
        <View style={styles.certCard}>
          <Text style={styles.fieldLabel}>Certificate</Text>
          <View style={styles.certRow}>
            <View style={styles.certFileIcon}>
              <Text style={styles.certFileIconText}>PDF</Text>
            </View>
            <View style={styles.certFileInfo}>
              <Text style={styles.certFileName}>
                Employment_Certificate_{request.referenceNo}.pdf
              </Text>
              <Text style={styles.certFileSize}>Certificate document</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.viewCertButton,
              pressed && styles.viewCertButtonPressed,
            ]}
            onPress={() =>
              navigation.navigate('CertificateView', {
                referenceNo: request.referenceNo,
              })
            }
            accessibilityRole="button"
            accessibilityLabel="View certificate"
          >
            <Text style={styles.viewCertButtonText}>View Certificate</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingIcon}>🕐</Text>
          <Text style={styles.pendingText}>
            Certificate is yet to be issued.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: 12,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  refNo: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  stepperWrapper: {
    paddingTop: 4,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  purposeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  editBadgeReadonly: {
    backgroundColor: colors.surfaceAlt,
  },
  editBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentText,
  },
  editBadgeTextReadonly: {
    color: colors.textMuted,
  },
  purposeInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  purposeInputError: {
    borderColor: colors.danger,
  },
  purposeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  counter: {
    fontSize: 11,
    color: colors.textMuted,
  },
  counterWarning: {
    color: colors.statusPending,
    fontWeight: '600',
  },
  savedMessage: {
    fontSize: 13,
    color: colors.statusDone,
    fontWeight: '600',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonPressed: {
    opacity: 0.8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  certCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.statusDoneBorder,
    ...shadow.card,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 12,
  },
  certFileIcon: {
    width: 44,
    height: 52,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certFileIconText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.danger,
    letterSpacing: 0.5,
  },
  certFileInfo: {
    flex: 1,
  },
  certFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  certFileSize: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewCertButton: {
    backgroundColor: colors.statusDoneBg,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.statusDoneBorder,
  },
  viewCertButtonPressed: {
    opacity: 0.8,
  },
  viewCertButtonText: {
    color: colors.statusDone,
    fontSize: 14,
    fontWeight: '700',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  pendingIcon: {
    fontSize: 22,
  },
  pendingText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
});
