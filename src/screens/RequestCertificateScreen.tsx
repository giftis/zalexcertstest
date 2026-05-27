import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FieldError } from '../components/FieldError';
import { formatApiDate, formatDisplayDate } from '../domain/date';
import {
  requestCertificateSchema,
  RequestCertificateFormValues,
} from '../domain/validation';
import type { NewRequestStackParamList } from '../navigation/types';
import { useCertificates } from '../state/CertificateContext';
import { colors, radius, shadow, spacing } from '../styles/theme';

type Navigation = NativeStackNavigationProp<NewRequestStackParamList>;

const PURPOSE_MIN = 50;
const ADDRESS_MAX = 200;

export function RequestCertificateScreen() {
  const navigation = useNavigation<Navigation>();
  const { submitRequest } = useCertificates();
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RequestCertificateFormValues>({
    resolver: zodResolver(requestCertificateSchema),
    defaultValues: {
      addressTo: '',
      purpose: '',
      issuedOn: undefined,
      employeeId: '',
    },
  });

  const purposeValue = watch('purpose') ?? '';
  const addressValue = watch('addressTo') ?? '';
  const issuedOnValue = watch('issuedOn');

  const onSubmit = async (data: RequestCertificateFormValues) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      const ok = await submitRequest({
        addressTo: data.addressTo,
        purpose: data.purpose,
        issuedOn: data.issuedOn,
        employeeId: data.employeeId,
      });
      if (ok) {
        navigation.navigate('RequestSuccess');
      } else {
        setSubmitError('The server did not confirm the request. Please try again.');
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Minimum date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section header ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          <Text style={styles.sectionSub}>
            Fill in all fields to submit your certificate request.
          </Text>
        </View>

        {/* ── Address to ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Address to <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            control={control}
            name="addressTo"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  errors.addressTo && styles.inputError,
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Bank of Cyprus, Visa Application Centre…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={ADDRESS_MAX}
                accessibilityLabel="Address to"
                accessibilityHint="Organisation or person the certificate is addressed to"
              />
            )}
          />
          <View style={styles.fieldFooter}>
            <FieldError message={errors.addressTo?.message} />
            <Text style={styles.counter}>
              {addressValue.length}/{ADDRESS_MAX}
            </Text>
          </View>
        </View>

        {/* ── Purpose ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Purpose <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            control={control}
            name="purpose"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  styles.purposeInput,
                  errors.purpose && styles.inputError,
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={`Describe the purpose of this certificate (min ${PURPOSE_MIN} characters)…`}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                accessibilityLabel="Purpose"
              />
            )}
          />
          <View style={styles.fieldFooter}>
            <FieldError message={errors.purpose?.message} />
            <Text
              style={[
                styles.counter,
                purposeValue.length < PURPOSE_MIN && styles.counterWarning,
              ]}
            >
              {purposeValue.length}/{PURPOSE_MIN} min
            </Text>
          </View>
        </View>

        {/* ── Issued on ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Issued on <Text style={styles.required}>*</Text>
          </Text>

          <Controller
            control={control}
            name="issuedOn"
            render={({ field: { onChange, value } }) => (
              <>
                {Platform.OS === 'web' ? (
                  /* Web fallback — native date picker not supported on web */
                  <TextInput
                    style={[
                      styles.input,
                      errors.issuedOn && styles.inputError,
                    ]}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.textMuted}
                    onChangeText={(text) => {
                      const parts = text.split('/').map(Number);
                      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
                        const [m, d, y] = parts;
                        onChange(new Date(y, m - 1, d));
                      }
                    }}
                    defaultValue={value ? formatApiDate(value) : ''}
                    accessibilityLabel="Issued on date"
                  />
                ) : (
                  <>
                    <Pressable
                      style={[
                        styles.input,
                        styles.dateButton,
                        errors.issuedOn && styles.inputError,
                      ]}
                      onPress={() => setShowDatePicker(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Select issued on date"
                    >
                      <Text
                        style={
                          value ? styles.dateButtonText : styles.dateButtonPlaceholder
                        }
                      >
                        {value
                          ? formatDisplayDate(formatApiDate(value))
                          : 'Select a future date…'}
                      </Text>
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={value ?? tomorrow}
                        mode="date"
                        minimumDate={tomorrow}
                        onChange={(_event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) onChange(selectedDate);
                        }}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      />
                    )}
                  </>
                )}
              </>
            )}
          />
          <FieldError message={errors.issuedOn?.message} />
        </View>

        {/* ── Employee ID ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Employee ID <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            control={control}
            name="employeeId"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  errors.employeeId && styles.inputError,
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. 123456"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                accessibilityLabel="Employee ID"
              />
            )}
          />
          <FieldError message={errors.employeeId?.message} />
        </View>

        {/* ── Submit error ── */}
        {submitError ? (
          <View style={styles.submitError}>
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : null}

        {/* ── Submit button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            (submitting || pressed) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit certificate request"
          accessibilityState={{ disabled: submitting }}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  required: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    ...shadow.card,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  purposeInput: {
    minHeight: 120,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  dateButton: {
    justifyContent: 'center',
    minHeight: 48,
  },
  dateButtonText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  dateButtonPlaceholder: {
    fontSize: 15,
    color: colors.textMuted,
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  counter: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 8,
    flexShrink: 0,
  },
  counterWarning: {
    color: colors.statusPending,
    fontWeight: '600',
  },
  submitError: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: spacing.md,
  },
  submitErrorText: {
    fontSize: 13,
    color: colors.danger,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadow.card,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
