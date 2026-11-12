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
import { getApiBaseUrl } from '@/lib/api';
import { THEME } from '@/constants/theme';

export interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Input Tidak Lengkap', 'Silakan masukkan email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = `${getApiBaseUrl()}/api/auth/login`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          turnstileToken: 'dev-bypass-token',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        showAlert('Login Gagal', data.error || 'Email atau kata sandi salah.');
        setIsLoading(false);
        return;
      }

      // Simpan session Supabase ke storage mobile lokal (MMKV/localStorage)
      if (data.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) {
          console.warn('[Auth] Failed to set session locally:', sessionError.message);
        }
      }

      showAlert('Selamat Datang!', 'Login berhasil. Mengarahkan ke beranda...');
      onSuccess?.();
    } catch (error: any) {
      console.error('Login error:', error);
      showAlert(
        'Koneksi Gagal',
        `Gagal terhubung ke backend (${getApiBaseUrl()}). Pastikan server backend sedang berjalan.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    showAlert('Mode Tamu Aktif', 'Melanjutkan penjelajahan layanan tanpa login akun.');
    onSuccess?.();
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Masuk ke Akun Anda</Text>
          <Text style={styles.subtitle}>
            Kelola pesanan dan panggil barber profesional
          </Text>
        </View>

        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
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

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kata Sandi</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={THEME.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={THEME.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={THEME.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Lupa Kata Sandi */}
          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            activeOpacity={0.7}
            style={styles.forgotPasswordBtn}
          >
            <Text style={styles.forgotPasswordText}>Lupa Kata Sandi?</Text>
          </TouchableOpacity>

          {/* Primary Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            style={styles.loginButton}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={THEME.colors.textInverse} />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Masuk</Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={THEME.colors.textInverse}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Mode CTA */}
          <TouchableOpacity
            onPress={handleGuestLogin}
            activeOpacity={0.7}
            style={styles.guestButton}
          >
            <Ionicons
              name="person-outline"
              size={16}
              color={THEME.colors.textPrimary}
            />
            <Text style={styles.guestButtonText}>Masuk sebagai Tamu</Text>
          </TouchableOpacity>

          {/* Sign Up Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Belum memiliki akun?</Text>
            <TouchableOpacity
              onPress={() => router.push('/register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
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
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  eyeBtn: {
    padding: 6,
  },
  turnstileContainer: {
    marginVertical: 4,
    alignItems: 'center',
  },
  turnstile: {
    height: 65,
    width: '100%',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.secondary,
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    height: 50,
    borderRadius: THEME.borderRadius.lg,
    gap: 8,
    marginTop: 6,
  },
  loginButtonText: {
    color: THEME.colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.borderSubtle,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginHorizontal: 12,
  },
  guestButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    height: 48,
    borderRadius: THEME.borderRadius.lg,
    gap: 8,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.secondary,
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
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.secondary,
  },
});
