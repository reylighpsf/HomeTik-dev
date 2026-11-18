import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const hasMinLength = password.length >= 6;
  const hasNumber = /[0-9]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const isMatch = password && password === confirmPassword;

  const handleUpdatePassword = async () => {
    if (!password) {
      showAlert('Password Kosong', 'Silakan masukkan kata sandi baru Anda.');
      return;
    }
    if (!hasMinLength) {
      showAlert('Password Terlalu Pendek', 'Kata sandi minimal harus 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Tidak Cocok', 'Konfirmasi kata sandi tidak sama dengan kata sandi baru.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        showAlert('Gagal Memperbarui', error.message || 'Gagal mengubah kata sandi.');
        setIsSubmitting(false);
        return;
      }

      showAlert(
        'Kata Sandi Berhasil Diperbarui! 🎉',
        'Kata sandi baru Anda telah aktif. Silakan masuk kembali dengan kata sandi yang baru.'
      );
      router.replace('/login');
    } catch (err: any) {
      console.error('[ResetPassword] Error:', err);
      showAlert('Kesalahan Sistem', 'Terjadi kendala saat memperbarui kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/login')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
            <Text style={styles.backBtnText}>Ke Login</Text>
          </TouchableOpacity>

          {/* Hero Header */}
          <View style={styles.heroBox}>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={32} color={THEME.colors.secondary} />
            </View>
            <Text style={styles.title}>Atur Kata Sandi Baru</Text>
            <Text style={styles.subtitle}>
              Buat kata sandi yang kuat dan aman untuk melindungi akun HomeTik Anda.
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            {/* Input Password Baru */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi Baru</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Input Konfirmasi Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konfirmasi Kata Sandi Baru</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ulangi kata sandi baru"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Checklist Syarat Password */}
            <View style={styles.checklistCard}>
              <View style={styles.checkItem}>
                <Ionicons
                  name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasMinLength ? THEME.colors.secondary : '#94A3B8'}
                />
                <Text style={[styles.checkText, hasMinLength && styles.checkTextActive]}>
                  Minimal 6 karakter
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons
                  name={hasLetter ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasLetter ? THEME.colors.secondary : '#94A3B8'}
                />
                <Text style={[styles.checkText, hasLetter && styles.checkTextActive]}>
                  Mengandung huruf (a-z / A-Z)
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons
                  name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasNumber ? THEME.colors.secondary : '#94A3B8'}
                />
                <Text style={[styles.checkText, hasNumber && styles.checkTextActive]}>
                  Mengandung angka (0-9)
                </Text>
              </View>
              {confirmPassword.length > 0 && (
                <View style={styles.checkItem}>
                  <Ionicons
                    name={isMatch ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={isMatch ? THEME.colors.secondary : '#EF4444'}
                  />
                  <Text style={[styles.checkText, isMatch && styles.checkTextActive]}>
                    Konfirmasi kata sandi cocok
                  </Text>
                </View>
              )}
            </View>

            {/* Action Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!hasMinLength || !isMatch || isSubmitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleUpdatePassword}
              disabled={!hasMinLength || !isMatch || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Simpan Kata Sandi Baru</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    width: 120,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  checklistCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  checkTextActive: {
    color: '#334155',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: THEME.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
