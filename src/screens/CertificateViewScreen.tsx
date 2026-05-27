import { useRoute } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import { formatDisplayDate } from '../domain/date';
import type { CertificateViewScreenProps } from '../navigation/types';
import { useCertificates } from '../state/CertificateContext';
import { colors } from '../styles/theme';

/** Generates the HTML content for the certificate preview. */
function buildCertificateHtml(params: {
  referenceNo: string;
  addressTo: string;
  purpose: string;
  issuedOn: string;
}): string {
  const { referenceNo, addressTo, purpose, issuedOn } = params;
  const displayDate = formatDisplayDate(issuedOn);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Employment</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #f0ede8;
      padding: 24px;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .page {
      background: #fff;
      border: 10px double #0F766E;
      padding: 48px 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      position: relative;
    }
    .corner {
      position: absolute;
      width: 30px;
      height: 30px;
      border-color: #0F766E;
      border-style: solid;
      opacity: 0.5;
    }
    .corner.tl { top: 8px; left: 8px; border-width: 3px 0 0 3px; }
    .corner.tr { top: 8px; right: 8px; border-width: 3px 3px 0 0; }
    .corner.bl { bottom: 8px; left: 8px; border-width: 0 0 3px 3px; }
    .corner.br { bottom: 8px; right: 8px; border-width: 0 3px 3px 0; }
    .ref {
      text-align: right;
      font-size: 11px;
      color: #888;
      margin-bottom: 24px;
      letter-spacing: 0.5px;
    }
    .org {
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      color: #0F766E;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .badge {
      text-align: center;
      font-size: 11px;
      color: #888;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .title {
      text-align: center;
      font-size: 16px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #333;
      margin: 24px 0 8px;
    }
    .divider {
      border: none;
      border-top: 1.5px solid #0F766E;
      opacity: 0.4;
      margin: 16px 0;
    }
    .seal {
      text-align: center;
      font-size: 56px;
      margin: 8px 0 20px;
      line-height: 1;
    }
    .body {
      font-size: 13px;
      line-height: 1.9;
      color: #333;
    }
    .body p { margin-bottom: 14px; }
    .body strong { color: #0F172A; }
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: flex-end;
    }
    .sig {
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #0F172A;
      width: 160px;
      margin-bottom: 6px;
    }
    .sig-name {
      font-size: 12px;
      color: #333;
      font-weight: bold;
    }
    .sig-role {
      font-size: 11px;
      color: #888;
    }
    .issued-date {
      font-size: 11px;
      color: #888;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <div class="ref">Ref: ${escapeHtml(referenceNo)}</div>

    <div class="org">Zalex Inc.</div>
    <div class="badge">Human Resources Department</div>

    <div class="title">Certificate of Employment</div>
    <hr class="divider">

    <div class="seal">🏢</div>

    <div class="body">
      <p>
        This is to certify that the bearer of this document is a <strong>bona fide employee</strong>
        of <strong>Zalex Inc.</strong>, and this certificate has been issued upon their request.
      </p>
      <p>
        <strong>Addressed to:</strong><br>
        ${escapeHtml(addressTo)}
      </p>
      <p>
        <strong>Purpose:</strong><br>
        ${escapeHtml(purpose)}
      </p>
      <p>
        This certificate is issued in good faith and is valid as of the date shown below.
        Zalex Inc. shall not be liable for any misuse of this document.
      </p>
    </div>

    <hr class="divider">

    <div class="footer">
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-name">HR Director</div>
        <div class="sig-role">Zalex Inc.</div>
      </div>
    </div>

    <div class="issued-date">Issued on: ${escapeHtml(displayDate)}</div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function CertificateViewScreen() {
  const route = useRoute<CertificateViewScreenProps['route']>();
  const { getRequest } = useCertificates();
  const request = getRequest(route.params.referenceNo);

  if (!request) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorText}>Request not found.</Text>
      </View>
    );
  }

  const html = buildCertificateHtml({
    referenceNo: request.referenceNo,
    addressTo: request.addressTo,
    purpose: request.purpose,
    issuedOn: request.issuedOn,
  });

  // react-native-webview does not support the web (browser) platform.
  // Use a plain iframe with inline HTML on web; WebView on native.
  if (Platform.OS === 'web') {
    return (
      <View style={styles.root}>
        {React.createElement('iframe', {
          srcDoc: html,
          title: 'Certificate preview',
          sandbox: 'allow-same-origin',
          style: {
            flex: 1,
            border: 'none',
            width: '100%',
            height: '100%',
            display: 'block',
          },
        })}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <WebView
        source={{ html, baseUrl: '' }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}
        accessibilityLabel="Certificate preview"
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0ede8',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
