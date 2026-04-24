import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Colors, registerThemeListener } from '../constants/Colors';

function RootLayoutNav({ themeKey }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg.primary }}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
      </View>
    );
  }

  return (
    <Stack
      key={themeKey}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="logic-test" />
      <Stack.Screen name="mental-math" />
      <Stack.Screen name="memory-flip" />
      <Stack.Screen name="spatial-vision" />
      <Stack.Screen name="rapid-fire" />
    </Stack>
  );
}

export default function RootLayout() {
  const [themeKey, setThemeKey] = useState(0);

  useEffect(() => {
    const unsubscribe = registerThemeListener(() => {
        setThemeKey(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthProvider key={`auth-${themeKey}`}>
      <StatusBar style={Colors.statusBarStyle || 'light'} />
      <RootLayoutNav themeKey={themeKey} />
    </AuthProvider>
  );
}
