import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/** Params for the Requests tab stack navigator. */
export type RequestsStackParamList = {
  RequestsList: undefined;
  RequestDetail: { referenceNo: string };
  CertificateView: { referenceNo: string };
};

/** Params for the New Request tab stack navigator. */
export type NewRequestStackParamList = {
  RequestCertificate: undefined;
  RequestSuccess: undefined;
};

/** Root tab navigator params. */
export type RootTabParamList = {
  RequestsTab: undefined;
  NewRequestTab: undefined;
};

// Convenience screen prop types
export type RequestsListScreenProps = NativeStackScreenProps<
  RequestsStackParamList,
  'RequestsList'
>;
export type RequestDetailScreenProps = NativeStackScreenProps<
  RequestsStackParamList,
  'RequestDetail'
>;
export type CertificateViewScreenProps = NativeStackScreenProps<
  RequestsStackParamList,
  'CertificateView'
>;
export type RequestCertificateScreenProps = NativeStackScreenProps<
  NewRequestStackParamList,
  'RequestCertificate'
>;
export type RequestSuccessScreenProps = NativeStackScreenProps<
  NewRequestStackParamList,
  'RequestSuccess'
>;
