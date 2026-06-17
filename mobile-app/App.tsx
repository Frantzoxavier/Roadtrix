import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/auth.store';

import LoginScreen from '../src/screens/auth/LoginScreen';
import HomeScreen from '../src/screens/main/HomeScreen';
import LoadDetailScreen from '../src/screens/main/LoadDetailScreen';
import TripScreen from '../src/screens/main/TripScreen';
import ProofOfDeliveryScreen from '../src/screens/main/ProofOfDeliveryScreen';
import EarningsScreen from '../src/screens/main/EarningsScreen';
import ProfileScreen from '../src/screens/main/ProfileScreen';

import { Colors } from '../src/utils/theme';
import { View, ActivityIndicator } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30 * 1000, retry: 1 },
  },
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingTop: 4,
          paddingBottom: 8,
          height: 72,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            Earnings: ['cash', 'cash-outline'],
            Profile: ['person-circle', 'person-circle-outline'],
          };
          const [active, inactive] = icons[route.name] || ['help', 'help-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="LoadDetail"
            component={LoadDetailScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="Trip"
            component={TripScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="ProofOfDelivery"
            component={ProofOfDeliveryScreen}
            options={{ presentation: 'card' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
