import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OtpInput } from '@/components/auth/OtpInput';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    email?: string;
    channel?: 'whatsapp' | 'sms' | 'email';
    purpose?: 'signup' | 'forgot_password' | 'change_password';
    otpType?: 'signup' | 'email' | 'sms';
    name?: string;
    password?: string;
    role?: 'USER' | 'BARBER';
  }>();

  const phone = params.phone || '';
  const email = params.email || '';
  const channel = params.channel || (email ? 'email' : 'whatsapp');
  const purpose = params.purpose || 'signup';
  const otpType = params.otpType || (purpose === 'signup' ? 'signup' : 'email');
  const name = params.name || '';
  const password = params.password || '';
  const role = params.role || 'USER';

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const verifyingRef = useRef(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const displayDestination = channel === 'email' ? email : phone || email;
  const otpLength = channel === 'email' ? 8 : 6;

  const handleVerify = async (tokenToVerify?: string) => {
    if (verifyingRef.current) return;

    const code = (tokenToVerify || otp).trim();
    if (code.length < otpLength) {
      showAlert('Kode Tidak Lengkap', `Silakan masukkan ${otpLength} digit kode OTP Anda.`);
      return;
    }

    verifyingRef.current = true;
    setIsVerifying(true);

    try {
      // 1. Panggil API Verifikasi OTP Backend
      const isEmailChannel = channel === 'email';
      const apiUrl = `${getApiBaseUrl()}/api/auth/otp/verify`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: !isEmailChannel ? phone || undefined : undefined,
          email: isEmailChannel ? email || undefined : undefined,
          token: code,
          type: isEmailChannel ? (otpType === 'signup' ? 'signup' : 'email') : 'sms',
        }),
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        showAlert(
          'Verifikasi Gagal',
          resData.error || 'Kode OTP salah atau telah kadaluarsa. Silakan periksa kembali.'
        );
        setIsVerifying(false);
        return;
      }

      // 2. Simpan session token jika didapatkan
      if (resData.session) {
        await supabase.auth.setSession({
          access_token: resData.session.access_token,
          refresh_token: resData.session.refresh_token,
        });
      }

      // 3. Tangani alur berdasarkan purpose
      if (purpose === 'signup') {
        // Simpan kata sandi yang dipilih saat registrasi agar bisa login dengan Email + Password
        if (password) {
          const { error: pwErr } = await supabase.auth.updateUser({ password });
          if (pwErr) {
            console.warn('[VerifyOTP] Update password warning:', pwErr.message);
          }
        }

        // Pastikan profil memiliki nama, nomor telepon, email, dan role tanpa menimpa data yang sudah ada
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('name, phone, role')
            .eq('id', user.id)
            .maybeSingle();

          await supabase.from('profiles').upsert({
            id: user.id,
            name: name || existingProfile?.name || user.user_metadata?.name || 'Pengguna HomeTik',
            phone: phone || existingProfile?.phone || user.user_metadata?.phone || user.phone || null,
            email: email || user.email || null,
            role: existingProfile?.role || user.user_metadata?.role || role || 'USER',
            updated_at: new Date().toISOString(),
          });
        }

        showAlert(
          'Verifikasi Berhasil!',
          'Selamat datang di HomeTik! Akun Anda telah aktif dan siap digunakan.'
        );
        router.replace('/(tabs)/home');
      } else if (purpose === 'forgot_password') {
        showAlert(
          'Verifikasi Berhasil',
          'Identitas Anda terverifikasi. Silakan buat kata sandi baru untuk akun Anda.'
        );
        router.replace({
          pathname: '/reset-password',
          params: { email, phone },
        });
      } else {
        showAlert('Sukses', 'Verifikasi berhasil diselesaikan.');
        router.back();
      }
    } catch (err: any) {
      console.error('[VerifyOTP] Error:', err);
      showAlert(
        'Koneksi Bermasalah',
        'Gagal memverifikasi OTP. Pastikan koneksi internet Anda aktif.'
      );
    } finally {
      verifyingRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const isEmailChannel = channel === 'email';
      const apiUrl = `${getApiBaseUrl()}/api/auth/otp/send`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: !isEmailChannel ? phone || undefined : undefined,
          email: isEmailChannel ? email || undefined : undefined,
          channel: isEmailChannel ? 'email' : channel === 'whatsapp' ? 'whatsapp' : 'sms',
          purpose: purpose === 'forgot_password' ? 'forgot_password' : 'signup',
          isResend: true,
          name: name || undefined,
          role: role || 'USER',
        }),
      });

      const resData = await response.json();
      if (!response.ok || resData.error) {
        showAlert('Gagal Kirim Ulang', resData.error || 'Gagal mengirim ulang OTP.');
      } else {
        showAlert(
          'Kode Baru Terkirim!',
          `Kode verifikasi baru telah dikirimkan ke ${displayDestination} via ${
            isEmailChannel ? 'Email' : channel.toUpperCase()
          }.`
        );
      }
    } catch (e: any) {
      showAlert('Koneksi Gagal', 'Gagal mengirim ulang kode OTP.');
    } finally {
      setIsResending(false);
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
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
            <Text style={styles.backBtnText}>Kembali</Text>
          </TouchableOpacity>

          {/* Hero Header */}
          <View style={styles.heroBox}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={
                  channel === 'whatsapp'
                    ? 'logo-whatsapp'
                    : channel === 'email'
                    ? 'mail-unread-outline'
                    : 'shield-checkmark'
                }
                size={32}
                color={channel === 'whatsapp' ? '#25D366' : THEME.colors.primary}
              />
            </View>
            <Text style={styles.title}>Verifikasi Kode OTP</Text>
            <Text style={styles.subtitle}>
              {channel === 'email'
                ? `Kami telah mengirimkan ${otpLength} digit kode rahasia ke alamat email:`
                : `Kami telah mengirimkan ${otpLength} digit kode rahasia ke nomor:`}
            </Text>
            <View style={styles.destinationPill}>
              <Text style={styles.destinationText}>
                {displayDestination || (channel === 'email' ? 'Email Anda' : 'Nomor Anda')}
              </Text>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <Text style={styles.changeLink}>Ubah</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            <Text style={styles.inputPrompt}>Masukkan {otpLength}-Digit Kode Verifikasi</Text>

            <OtpInput
              length={otpLength}
              value={otp}
              onChange={setOtp}
              onComplete={(completedCode) => handleVerify(completedCode)}
              onResend={handleResend}
              isResending={isResending}
              channel={channel}
            />

            {/* Confirm CTA */}
            <TouchableOpacity
              style={[
                styles.verifyBtn,
                (otp.length < otpLength || isVerifying) && styles.verifyBtnDisabled,
              ]}
              onPress={() => handleVerify()}
              disabled={otp.length < otpLength || isVerifying}
              activeOpacity={0.85}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.verifyBtnText}>Verifikasi & Lanjutkan</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Security Tip */}
            <View style={styles.securityBox}>
              <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
              <Text style={styles.securityText}>
                Jangan pernah membagikan kode OTP ini kepada siapa pun, termasuk pihak yang mengaku tim HomeTik.
              </Text>
            </View>
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
    width: 100,
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
  destinationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  destinationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.secondary,
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
  inputPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 12,
    shadowColor: THEME.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
