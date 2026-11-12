import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { THEME } from '@/constants/theme';

export interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showAlert('Email Diperlukan', 'Silakan masukkan alamat email akun Anda.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'hometik://reset-password',
      });

      if (error) {
        showAlert('Permintaan Gagal', error.message || 'Gagal mengirim instruksi reset kata sandi.');
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Forgot password error:', error);
      showAlert(
        'Terjadi Kesalahan',
        'Gagal mengirim email reset. Pastikan koneksi internet stabil.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    if (onNavigateLogin) {
      onNavigateLogin();
    } else {
      router.push('/login');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        {isSent ? (
          <View style={styles.successState}>
            <View style={styles.successIconWrap}>
              <Ionicons
                name="mail-unread-outline"
                size={40}
                color={THEME.colors.secondary}
              />
            </View>
            <Text style={styles.title}>Email Terkirim!</Text>
            <Text style={styles.subtitle}>
              Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke{' '}
              <Text style={styles.boldEmail}>{email}</Text>. Silakan periksa kotak masuk atau folder spam Anda.
            </Text>

            <TouchableOpacity
              onPress={handleGoToLogin}
              activeOpacity={0.8}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Kembali ke Masuk</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={THEME.colors.textInverse}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSent(false)}
              activeOpacity={0.7}
              style={styles.resendBtn}
            >
              <Text style={styles.resendText}>Kirim ulang ke email lain</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.headerIconWrap}>
                <Ionicons
                  name="key-outline"
                  size={28}
                  color={THEME.colors.primary}
                />
              </View>
              <Text style={styles.title}>Lupa Kata Sandi?</Text>
              <Text style={styles.subtitle}>
                Masukkan alamat email yang terdaftar pada akun HomeTik Anda untuk menerima instruksi pemulihan.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Akun</Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={THEME.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="nama@email.com"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.8}
                style={styles.submitButton}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={THEME.colors.textInverse} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Kirim Instruksi</Text>
                    <Ionicons
                      name="paper-plane-outline"
                      size={16}
                      color={THEME.colors.textInverse}
                    />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Ingat kata sandi Anda?</Text>
                <TouchableOpacity onPress={handleGoToLogin} activeOpacity={0.7}>
                  <Text style={styles.loginLink}>Masuk</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xxl,
    padding: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  header: {
    marginBottom: THEME.spacing.lg,
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  boldEmail: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  form: {
    gap: THEME.spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    paddingVertical: 0,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    height: 50,
    borderRadius: THEME.borderRadius.lg,
    gap: 8,
    marginTop: THEME.spacing.xs,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textInverse,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: THEME.spacing.sm,
  },
  footerText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.secondary,
  },
  successState: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  resendBtn: {
    marginTop: THEME.spacing.md,
    padding: 6,
  },
  resendText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textDecorationLine: 'underline',
  },
});
