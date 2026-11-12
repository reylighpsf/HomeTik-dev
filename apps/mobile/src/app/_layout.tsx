import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/app-providers';
import { SplashLoadingScreen } from '@/components/splash';

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);

  return (
    <AppProviders>
      <StatusBar style={isAppReady ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F7F9FB' },
        }}
      />
      {!isAppReady && (
        <SplashLoadingScreen onFinish={() => setIsAppReady(true)} />
      )}
    </AppProviders>
  );
}