import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CertificateStatus } from '../types/certificate';
import { colors } from '../styles/theme';

/** Ordered steps matching the real API status progression. */
const STEPS: CertificateStatus[] = ['New', 'Pending', 'Under Review', 'Done'];

interface Props {
  status: CertificateStatus;
}

export function StatusStepper({ status }: Props) {
  const currentIndex = STEPS.indexOf(status);

  return (
    <View style={styles.container} accessibilityLabel={`Progress: ${status}`}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <React.Fragment key={step}>
            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isCurrent && styles.circleTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  isCompleted && styles.stepLabelDone,
                ]}
                numberOfLines={2}
              >
                {step}
              </Text>
            </View>

            {!isLast && (
              <View
                style={[
                  styles.connector,
                  index < currentIndex && styles.connectorDone,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 60,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: colors.statusDone,
    borderColor: colors.statusDone,
  },
  circleCurrent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  circleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  circleTextActive: {
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 13,
    marginHorizontal: -2,
  },
  connectorDone: {
    backgroundColor: colors.statusDone,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  stepLabelCurrent: {
    color: colors.accent,
    fontWeight: '700',
  },
  stepLabelDone: {
    color: colors.statusDone,
    fontWeight: '600',
  },
});
