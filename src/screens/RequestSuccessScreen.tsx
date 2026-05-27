import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NewRequestStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing } from '../styles/theme';

type Navigation = NativeStackNavigationProp<NewRequestStackParamList>;

export function RequestSuccessScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        {/* Illustration */}
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>✅</Text>
        </View>

        <Text style={styles.title}>Request Submitted!</Text>
        <Text style={styles.body}>
          Your certificate request has been created and is now being reviewed by
          the HR team. You will be notified when it is ready.
        </Text>

        {/* Primary action */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => {
            // Navigate back to the Requests tab list
            navigation.getParent()?.navigate('RequestsTab');
          }}
          accessibilityRole="button"
          accessibilityLabel="View my requests"
        >
          <Text style={styles.primaryButtonText}>View Requests</Text>
        </Pressable>

        {/* Secondary action */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('RequestCertificate')}
          accessibilityRole="button"
          accessibilityLabel="Create another request"
        >
          <Text style={styles.secondaryButtonText}>Create Another</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.statusDoneBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.accentText,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
