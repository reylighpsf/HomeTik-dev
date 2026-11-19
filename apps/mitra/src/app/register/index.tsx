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

const SPECIALTY_OPTIONS = [
  'Haircut Pria',
  'Fade & Taper',
  'Beard Grooming',
  'Haircut Anak',
  'Head Spa',
  'Hair Coloring',
];

export default function MitraRegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [specialties, setSpecialties] = useState<string[]>(['Haircut Pria', 'Fade & Taper']);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const toggleSpecialty = (item: string) => {
    setSpecialties((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || password.length < 6) {
      showAlert(
        'Data Belum Lengkap',
        'Lengkapi nama, email, nomor WhatsApp aktif, dan kata sandi minimal 6 karakter.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role: 'BARBER',
          specialties: specialties.length > 0 ? specialties : ['Haircut Pria'],
          turnstileToken: 'dev-bypass-token',
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        showAlert('Pendaftaran Gagal', data.error || 'Terjadi kesalahan saat mendaftar Mitra.');
        setIsLoading(false);
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        showAlert('Selamat Bergabung! ✂️', 'Akun Mitra Barber Anda telah aktif.');
        router.replace('/(tabs)/dashboard');
      } else {
        showAlert(
          'Pendaftaran Terkirim 📧',
          'Akun Mitra berhasil dibuat. Silakan cek email Anda untuk verifikasi sebelum login.'
        );
        router.replace('/login');
      }
    } catch (err: any) {
      showAlert(
        'Koneksi Gagal',
        `Tidak dapat menghubungi backend (${getApiBaseUrl()}). Pastikan server backend berjalan.`
      );
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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.backText}>Kembali ke Login</Text>
          </TouchableOpacity>

          <View style={styles.headerBox}>
            <Text style={styles.title}>Daftar Mitra Barber</Text>
            <Text style={styles.subtitle}>
              Dapatkan 85% bagi hasil langsung dan fleksibilitas jam kerja Anda sendiri.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Rian Pratama"
                placeholderTextColor={MITRA_THEME.colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Email</Text>
              <TextInput
                style={styles.input}
                placeholder="rian.barber@email.com"
                placeholderTextColor={MITRA_THEME.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor WhatsApp Aktif</Text>
              <TextInput
                style={styles.input}
                placeholder="081234567890"
                placeholderTextColor={MITRA_THEME.colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi (Min. 6 karakter)</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={MITRA_THEME.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Spesialisasi Keahlian</Text>
              <View style={styles.chipsWrap}>
                {SPECIALTY_OPTIONS.map((item) => {
                  const active = specialties.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleSpecialty(item)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && { opacity: 0.65 }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Daftar Sebagai Mitra Barber</Text>
              )}
            </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    color: MITRA_THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  headerBox: {
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  card: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    ...MITRA_THEME.shadows.card,
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
  input: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: MITRA_THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: MITRA_THEME.colors.textPrimary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MITRA_THEME.colors.border,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
  },
  chipActive: {
    backgroundColor: MITRA_THEME.colors.primaryLight,
    borderColor: MITRA_THEME.colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: MITRA_THEME.colors.textSecondary,
  },
  chipTextActive: {
    color: MITRA_THEME.colors.primary,
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: MITRA_THEME.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...MITRA_THEME.shadows.card,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
