import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CertificateViewScreen } from '../screens/CertificateViewScreen';
import { RequestCertificateScreen } from '../screens/RequestCertificateScreen';
import { RequestDetailScreen } from '../screens/RequestDetailScreen';
import { RequestSuccessScreen } from '../screens/RequestSuccessScreen';
import { RequestsListScreen } from '../screens/RequestsListScreen';
import { colors } from '../styles/theme';
import type {
  NewRequestStackParamList,
  RequestsStackParamList,
  RootTabParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const RequestsStack = createNativeStackNavigator<RequestsStackParamList>();
const NewRequestStack = createNativeStackNavigator<NewRequestStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  headerTintColor: colors.accent,
  contentStyle: { backgroundColor: colors.background },
};

function RequestsNavigator() {
  return (
    <RequestsStack.Navigator screenOptions={stackScreenOptions}>
      <RequestsStack.Screen
        name="RequestsList"
        component={RequestsListScreen}
        options={{ headerShown: false }}
      />
      <RequestsStack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{ title: 'Request Details' }}
      />
      <RequestsStack.Screen
        name="CertificateView"
        component={CertificateViewScreen}
        options={{ title: 'Certificate' }}
      />
    </RequestsStack.Navigator>
  );
}

function NewRequestNavigator() {
  return (
    <NewRequestStack.Navigator screenOptions={stackScreenOptions}>
      <NewRequestStack.Screen
        name="RequestCertificate"
        component={RequestCertificateScreen}
        options={{ title: 'New Request' }}
      />
      <NewRequestStack.Screen
        name="RequestSuccess"
        component={RequestSuccessScreen}
        options={{ headerShown: false }}
      />
    </NewRequestStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 6,
            paddingTop: 4,
            height: 62,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 2,
          },
          tabBarIcon: ({ color, size, focused }) => {
            if (route.name === 'RequestsTab') {
              return (
                <Ionicons
                  name={focused ? 'document-text' : 'document-text-outline'}
                  size={size}
                  color={color}
                />
              );
            }
            return (
              <Ionicons
                name={focused ? 'add-circle' : 'add-circle-outline'}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen
          name="RequestsTab"
          component={RequestsNavigator}
          options={{ tabBarLabel: 'Requests' }}
        />
        <Tab.Screen
          name="NewRequestTab"
          component={NewRequestNavigator}
          options={{ tabBarLabel: 'New Request' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
