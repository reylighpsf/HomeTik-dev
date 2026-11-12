import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { THEME } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>HomeTik</Text>
          <Text style={styles.brandSubtitle}>
            Pusat Bantuan & Pemulihan Akun
          </Text>
        </View>

        <View style={styles.formArea}>
          <ForgotPasswordForm
            onNavigateLogin={() => router.push('/login')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: THEME.colors.textMuted,
  },
  formArea: {
    width: '100%',
  },
});
