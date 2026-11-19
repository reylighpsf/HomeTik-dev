import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import { MITRA_THEME } from '@/constants/theme';

export default function MitraLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('Input Tidak Lengkap', 'Masukkan email dan kata sandi akun Mitra Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      let activeSession: { access_token: string; refresh_token: string } | null = null;
      let loggedUser: any = null;

      // 1. Coba via backend API agar sinkron dengan middleware & deteksi unverified
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            turnstileToken: 'dev-bypass-token',
          }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          showAlert('Login Mitra Gagal', data.error || 'Email atau kata sandi salah.');
          setIsLoading(false);
          return;
        }

        activeSession = data.session;
        loggedUser = data.user;
      } catch {
        // Fallback langsung ke Supabase Auth jika backend lokal tidak berjalan
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error || !data.session) {
          showAlert('Login Gagal', error?.message || 'Gagal masuk ke akun Mitra.');
          setIsLoading(false);
          return;
        }
        activeSession = data.session;
        loggedUser = data.user;
      }

      if (activeSession) {
        await supabase.auth.setSession({
          access_token: activeSession.access_token,
          refresh_token: activeSession.refresh_token,
        });
      }

      // Validasi Role: hanya BARBER atau ADMIN yang diizinkan masuk HomeTik Mitra
      const userId = loggedUser?.id;
      let role =
        loggedUser?.app_metadata?.role || loggedUser?.user_metadata?.role || null;

      if (!role && userId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        role = prof?.role;
      }

      if (role && role !== 'BARBER' && role !== 'ADMIN') {
        await supabase.auth.signOut();
        showAlert(
          'Akses Khusus Mitra Barber',
          'Akun ini terdaftar sebagai Pelanggan (USER). Silakan daftar sebagai Mitra Barber atau gunakan aplikasi HomeTik Pelanggan.'
        );
        setIsLoading(false);
        return;
      }

      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      showAlert('Terjadi Kesalahan', err?.message || 'Gagal menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandBox}>
            <View style={styles.logoBadge}>
              <Ionicons name="cut" size={30} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>HomeTik Mitra</Text>
            <Text style={styles.brandSub}>
              Aplikasi khusus Mitra Barber Profesional — terima panggilan langsung &amp; kelola pendapatan
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk Akun Mitra</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Mitra</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={MITRA_THEME.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="barber@email.com"
                  placeholderTextColor={MITRA_THEME.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={MITRA_THEME.colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={MITRA_THEME.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={MITRA_THEME.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Masuk Dashboard Mitra</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Belum bergabung sebagai Mitra?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.footerLink}>Daftar Mitra Baru</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MITRA_THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: MITRA_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...MITRA_THEME.shadows.hover,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
    letterSpacing: -0.4,
  },
  brandSub: {
    fontSize: 13,
    color: MITRA_THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },
  card: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 22,
    ...MITRA_THEME.shadows.card,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: MITRA_THEME.colors.textSecondary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: MITRA_THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: MITRA_THEME.colors.textPrimary,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: MITRA_THEME.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...MITRA_THEME.shadows.card,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: MITRA_THEME.colors.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
});
