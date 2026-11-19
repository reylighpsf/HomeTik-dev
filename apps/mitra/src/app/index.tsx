import React from 'react';
import { Redirect } from 'expo-router';
import { useMitraAuth } from '@/context/MitraAuthContext';

export default function IndexScreen() {
  const { isAuthenticated } = useMitraAuth();
  return <Redirect href={isAuthenticated ? '/(tabs)/dashboard' : '/login'} />;
}
