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

export interface RegisterFormProps {
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'BARBER'>('USER');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      showAlert('Input Tidak Lengkap', 'Silakan masukkan nama lengkap Anda.');
      return;
    }
    if (!email.trim()) {
      showAlert('Input Tidak Lengkap', 'Silakan masukkan alamat email Anda.');
      return;
    }
    if (!password) {
      showAlert('Input Tidak Lengkap', 'Silakan masukkan kata sandi Anda.');
      return;
    }
    if (password.length < 6) {
      showAlert('Kata Sandi Lemah', 'Kata sandi minimal harus 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Kata Sandi Tidak Cocok', 'Konfirmasi kata sandi tidak sesuai.');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = `${getApiBaseUrl()}/api/auth/register`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          role,
          specialties: role === 'BARBER' ? ['Haircut', 'Styling', 'Beard Grooming'] : undefined,
          turnstileToken: 'dev-bypass-token',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        showAlert('Registrasi Gagal', data.error || 'Terjadi kesalahan saat mendaftar.');
        setIsLoading(false);
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      showAlert(
        'Pendaftaran Berhasil!',
        role === 'BARBER'
          ? 'Akun mitra barber Anda telah siap. Mengarahkan ke aplikasi...'
          : 'Akun Anda berhasil dibuat. Mengarahkan ke aplikasi...'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      showAlert(
        'Koneksi Gagal',
        `Gagal terhubung ke backend (${getApiBaseUrl()}). Pastikan server backend sedang berjalan.`
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
        <View style={styles.header}>
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>
            Pesan layanan cukur rambut terbaik langsung ke tempat Anda
          </Text>
        </View>

        {/* Role Selector Tabs */}
        <View style={styles.roleTabs}>
          <TouchableOpacity
            onPress={() => setRole('USER')}
            activeOpacity={0.8}
            style={[styles.roleTab, role === 'USER' && styles.roleTabActive]}
          >
            <Ionicons
              name="person"
              size={16}
              color={role === 'USER' ? THEME.colors.textInverse : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.roleTabText,
                role === 'USER' && styles.roleTabTextActive,
              ]}
            >
              Pelanggan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRole('BARBER')}
            activeOpacity={0.8}
            style={[styles.roleTab, role === 'BARBER' && styles.roleTabActive]}
          >
            <Ionicons
              name="cut"
              size={16}
              color={role === 'BARBER' ? THEME.colors.textInverse : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.roleTabText,
                role === 'BARBER' && styles.roleTabTextActive,
              ]}
            >
              Mitra Barber
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="person-outline"
                size={18}
                color={THEME.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Fathur Rachman"
                placeholderTextColor={THEME.colors.textMuted}
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>
          </View>

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

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor WhatsApp / HP</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="call-outline"
                size={18}
                color={THEME.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="081234567890"
                placeholderTextColor={THEME.colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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
                placeholder="Minimal 6 karakter"
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

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konfirmasi Kata Sandi</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={THEME.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Ulangi kata sandi"
                placeholderTextColor={THEME.colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={THEME.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
            style={styles.submitButton}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={THEME.colors.textInverse} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {role === 'BARBER' ? 'Daftar Sebagai Mitra' : 'Daftar Sekarang'}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={THEME.colors.textInverse}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Sudah memiliki akun?</Text>
            <TouchableOpacity onPress={handleGoToLogin} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Masuk di Sini</Text>
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
    marginBottom: THEME.spacing.md,
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
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.borderRadius.lg,
    padding: 4,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: THEME.colors.primary,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  roleTabTextActive: {
    color: THEME.colors.textInverse,
    fontWeight: '700',
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
  eyeBtn: {
    padding: 6,
  },
  turnstileContainer: {
    alignItems: 'center',
    marginVertical: THEME.spacing.xs,
  },
  turnstile: {
    width: '100%',
    height: 65,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: THEME.colors.secondary,
    fontWeight: '600',
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
});
