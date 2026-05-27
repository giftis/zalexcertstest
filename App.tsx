import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { CertificateProvider } from './src/state/CertificateContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <CertificateProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </CertificateProvider>
    </SafeAreaProvider>
  );
}
