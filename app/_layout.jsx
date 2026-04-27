import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { 
  useFonts, 
  Roboto_400Regular, 
  Roboto_700Bold, 
  Roboto_900Black 
} from '@expo-google-fonts/roboto';

import { Colors, registerThemeListener } from '../constants/Colors';

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthScreen = segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthScreen) {
      // If not logged in and NOT on an auth screen, force login
      router.replace('/login');
    } else if (user && inAuthScreen) {
      // If logged in and ON an auth screen, go to home
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg.primary }}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
      </View>
    );
  }

  return children;
}

function RootLayoutNav({ themeKey }) {
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

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [themeKey, setThemeKey] = useState(0);

  const [fontsLoaded] = useFonts({
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Bold': Roboto_700Bold,
    'Roboto-Black': Roboto_900Black,
  });

  useEffect(() => {
    const unsubscribe = registerThemeListener(() => {
        setThemeKey(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg.primary }}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider key={`auth-${themeKey}`}>
          <AuthGuard>
            <StatusBar style="dark" />
            <RootLayoutNav themeKey={themeKey} />
          </AuthGuard>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
