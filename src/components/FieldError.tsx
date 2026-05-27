import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../styles/theme';

interface Props {
  message?: string;
}

/**
 * Inline accessible error message displayed below form fields.
 * Renders nothing when `message` is undefined or empty.
 */
export function FieldError({ message }: Props) {
  if (!message) return null;
  return (
    <Text
      style={styles.text}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
  },
});
