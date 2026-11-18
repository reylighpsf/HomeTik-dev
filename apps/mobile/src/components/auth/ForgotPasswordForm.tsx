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
import { getApiBaseUrl } from '@/lib/api';
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
  const [resetMethod, setResetMethod] = useState<'email' | 'whatsapp'>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSendResetCode = async () => {
    if (resetMethod === 'whatsapp' && !phone.trim()) {
      showAlert('Nomor HP Diperlukan', 'Silakan masukkan nomor WhatsApp Anda.');
      return;
    }
    if (resetMethod === 'email' && !email.trim()) {
      showAlert('Email Diperlukan', 'Silakan masukkan alamat email akun Anda.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Panggil Endpoint Kirim OTP Backend
      const apiUrl = `${getApiBaseUrl()}/api/auth/otp/send`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: resetMethod === 'whatsapp' ? phone.trim() : undefined,
          email: resetMethod === 'email' ? email.trim() : undefined,
          channel: resetMethod,
          purpose: 'forgot_password',
        }),
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        showAlert(
          'Gagal Mengirim OTP',
          resData.error ||
            (resetMethod === 'email'
              ? 'Pastikan alamat email Anda valid dan sudah terdaftar.'
              : 'Layanan WhatsApp OTP belum aktif. Silakan gunakan metode Via Email.')
        );
        setIsLoading(false);
        return;
      }

      showAlert(
        resetMethod === 'email' ? 'Kode OTP Terkirim! 📧' : 'Kode OTP Terkirim! 📲',
        `Kode verifikasi ${resetMethod === 'email' ? '8-digit' : '6-digit'} telah dikirimkan ke ${
          resetMethod === 'whatsapp' ? phone : email
        }. Silakan periksa ${resetMethod === 'email' ? 'kotak masuk / folder spam email' : 'pesan WhatsApp'} Anda.`
      );

      // 2. Navigasi ke Layar Verifikasi OTP Reset Password
      router.push({
        pathname: '/verify-otp',
        params: {
          phone: resetMethod === 'whatsapp' ? phone.trim() : '',
          email: resetMethod === 'email' ? email.trim() : '',
          channel: resetMethod,
          purpose: 'forgot_password',
        },
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Forgot password error:', error);
      showAlert(
        'Terjadi Kesalahan',
        'Gagal mengirim kode reset. Pastikan koneksi internet Anda stabil.'
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
          <Text style={styles.title}>Lupa Kata Sandi?</Text>
          <Text style={styles.subtitle}>
            Pilih metode pengiriman kode verifikasi untuk mengatur ulang kata sandi akun Anda.
          </Text>
        </View>

        {/* Method Toggle: Email vs WhatsApp */}
        <View style={styles.methodTabs}>
          <TouchableOpacity
            style={[
              styles.methodTab,
              resetMethod === 'email' && styles.methodTabActive,
            ]}
            onPress={() => setResetMethod('email')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="mail-outline"
              size={16}
              color={resetMethod === 'email' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.methodTabText,
                resetMethod === 'email' && styles.methodTabTextActive,
              ]}
            >
              Via Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodTab,
              resetMethod === 'whatsapp' && styles.methodTabActive,
            ]}
            onPress={() => setResetMethod('whatsapp')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="logo-whatsapp"
              size={16}
              color={resetMethod === 'whatsapp' ? '#25D366' : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.methodTabText,
                resetMethod === 'whatsapp' && styles.methodTabTextActive,
              ]}
            >
              Via WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {resetMethod === 'whatsapp' ? (
            /* WhatsApp Number Input */
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor WhatsApp Terdaftar</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={THEME.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Contoh: 081234567890"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              <Text style={styles.inputHint}>
                Kode verifikasi 6 digit akan dikirimkan langsung ke chat WhatsApp Anda.
              </Text>
            </View>
          ) : (
            /* Email Input */
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Email Terdaftar</Text>
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
              <Text style={styles.inputHint}>
                Kode verifikasi akan dikirimkan ke kotak masuk atau folder spam email Anda.
              </Text>
            </View>
          )}

          {/* Submit Action */}
          <TouchableOpacity
            onPress={handleSendResetCode}
            disabled={isLoading}
            activeOpacity={0.85}
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color={THEME.colors.textInverse} size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Kirim Kode Verifikasi OTP</Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={THEME.colors.textInverse}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <TouchableOpacity
            onPress={handleGoToLogin}
            activeOpacity={0.7}
            style={styles.backToLoginButton}
          >
            <Ionicons
              name="arrow-back"
              size={14}
              color={THEME.colors.secondary}
            />
            <Text style={styles.backToLoginText}>Kembali ke Halaman Masuk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: THEME.spacing.md,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: THEME.colors.textMuted,
    lineHeight: 18,
  },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  methodTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  form: {
    gap: THEME.spacing.sm,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.sm,
  },
  inputIcon: {
    marginRight: THEME.spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  inputHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.secondary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 14,
    marginTop: 10,
    gap: 8,
    shadowColor: THEME.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: THEME.colors.border,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textInverse,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
    gap: 6,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.secondary,
  },
});
