# LAPORAN IMPLEMENTASI: CLOUDFLARE TURNSTILE AUTENTIKASI LOGIN
# HomeTik Monorepo - Phase 1: Mobile & Web Login Security

**Tanggal:** November 2026
**Proyek:** HomeTik - On-Demand Grooming Platform
**Modul:** Authentication & Security Enhancement

---

## 1. LAPORAN EKSEKUTIF

Laporan ini menjelaskan implementasi Cloudflare Turnstile sebagai lapisan keamanan tambahan di halaman login aplikasi HomeTik (mobile dan web). Tujuan utamanya adalah mencegah akses bot otomatis dan meningkatkan keamanan akun pengguna.

**Ringkasan Implementasi:**
- Widget Cloudflare Turnstile ditambahkan ke halaman login mobile (Expo React Native)
- Endpoint API route baru dibuat di Next.js 15 web backend
- Verifikasi token dilakukan di backend sebelum Supabase Auth
- Environment variables terkonfigurasi untuk kedua platform

**Manfaat:**
- Mencegah pendaftaran/login bot otomatis
- Menambah security layer kedua di atas Supabase Auth
- Mematuhi best practice keamanan aplikasi modern
- Pengalaman pengguna (UX) yang minimal disrupted

---

## 2. RINGKASAN TEKNIS

### 2.1 Arsitektur Implementasi

```
Login Page
    ↓
Cloudflare Turnstile Widget (CDN / Library)
    ↓
User Complete Challenge (Checkbox/Tulisan)
    ↓
Token Dihasilkan dan Dikirim ke Backend
    ↓
Backend Verify Token → Cloudflare API
    ↓
If Valid → Supabase Auth Login Proceed
If Invalid → Error Response "Verifikasi gagal"
```

### 2.2 Platform yang Ditargetkan

| Platform | Teknologi | File yang Diedit |
|----------|-----------|------------------|
| **Mobile** | React Native 0.76 + Expo 58 | `apps/mobile/src/components/sign in/[LoginForm].tsx`, `apps/mobile/.env.local` |
| **Web** | Next.js 15 + Tailwind CSS v4 | `apps/web-backend/src/app/api/auth/[...]/route.ts`, `apps/web-backend/.env.local` |

### 2.3 Alur Data Lengkap

#### Mobile Flow (POST /api/auth/login)
1. User membuka halaman login di aplikasi mobile
2. Widget Cloudflare Turnstile muncul dengan site key dari environment
3. User melakukan challenge (klik/verifikasi)
4. Token Turnstile disimpan di state lokal
5. User menekan tombol Login
6. Fetch POST ke `/api/auth/login` dengan body:
   ```json
   {
     "email": "user@example.com",
     "password": "password123",
     "turnstileToken": "token_dari_widget"
   }
   ```
7. Backend menerima request dan memverifikasi token Cloudflare
8. Jika valid → melanjutkan supabase.auth.signInWithPassword()
9. Jika invalid → return error { error: "Verifikasi robot gagal" } dengan status 400

#### Web Flow (POST /api/auth/login)
1. Request tiba ke endpoint `/api/auth/login` (route dynamic)
2. Extract: email, password, turnstileToken dari request body
3. Verify token: `await verify(turnstileToken, process.env.CLOUDFLARE_SECRET_KEY)`
4. Jika !verified.success → response error 400
5. Jika valid → createServerSupabaseClient()
6. supabase.auth.signInWithPassword({ email, password })
7. Jika error auth → response 401 dengan message error
8. Jika success → response { success: true, user: data.user } dengan status 200

---

## 3. FILE YANG DIBUAT/DIEDIT

### 3.1 Mobile Application

**File: `apps/mobile/src/components/sign in/[LoginForm].tsx`**

```typescript
import Turnstile from 'react-native-turnstile';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

// State variables
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [turnstileToken, setTurnstileToken] = useState('');
const [isLoading, setIsLoading] = useState(false);

// Turnstile Widget
<Turnstile
  siteKey={process.env.EXPO_PUBLIC_CLOUDFLARE_SITE_KEY}
  onToken={setTurnstileToken}
  theme="light"
  style={{ marginVertical: 20 }}
/>

// Form Inputs
<TextInput
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email"
  autoCapitalize="none"
/>
<TextInput
  placeholder="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
/>

<!-- Login Button -->
<TouchableOpacity
  onPress={async () => {
    if (!turnstileToken) {
      Alert.alert('Verifikasi Gagal', 'Silakan lengkapi verifikasi robot terlebih dahulu');
      return;
    }
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          turnstileToken,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        Alert.alert('Login Gagal', data.error);
      } else {
        // Simpan session atau navigate ke dashboard
        console.log('Login successful:', data.user);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat login');
      setIsLoading(false);
    }
  }}
  disabled={isLoading}
  activeOpacity={0.8}
>
  {isLoading ? (
    <ActivityIndicator size="large" />
  ) : (
    <Text style={styles.loginButtonText}>Masuk</Text>
  )}
</TouchableOpacity>
```

**Styles:**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F7F9FB',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**File: `apps/mobile/.env.local`**
```
# Cloudflare Turnstile Configuration
EXPO_PUBLIC_CLOUDFLARE_SITE_KEY=1x-your-site-key-here

# Supabase Configuration (Existing)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### 3.2 Web Backend Application

**File: `apps/web-backend/src/app/api/auth/[...]/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { verify } from 'cloudflare-turnstile';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ==========================================
// ROUTE: POST /api/auth/login
// Deskripsi: Login dengan verifikasi Turnstile + Credentials Supabase
// ==========================================
export async function POST(request: Request) {
  try {
    const { email, password, turnstileToken } = await request.json();
    
    // --- LANGKAH 1: VERIFIKASI CLOUDFLARE TURNSTILE ---
    const verified = await verify(
      turnstileToken, 
      process.env.CLOUDFLARE_SECRET_KEY!
    );
    
    if (!verified.success) {
      return NextResponse.json(
        { error: 'Verifikasi robot gagal - Silakan coba lagi' },
        { status: 400 }
      );
    }
    
    // --- LANGKAH 2: VERIFIKASI CREDENTIALS SUPABASE ---
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    // --- LANGKAH 3: RESPONSE SUKSES ---
    return NextResponse.json(
      { success: true, user: data.user },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Auth route error:', error);
    return NextResponse.json(
      { error: 'Internal server error - Silakan coba lagi nanti' },
      { status: 500 }
    );
  }
}

// ==========================================
// ROUTE: POST /api/auth/logout
// Deskripsi: Logout pengguna
// ==========================================
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
    
    return NextResponse.json(
      { success: true, message: 'Akun berhasil logout' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Logout gagal - Coba refresh halaman' },
      { status: 500 }
    );
  }
}

// ==========================================
// ROUTE: GET /api/auth/user
// Deskripsi: Ambil data user current
// ==========================================
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user} } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated - Silakan login kembali' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data user' },
      { status: 500 }
    );
  }
}

// ==========================================
// ROUTE: PUT /api/auth/refresh
// Deskripsi: Refresh session token
// ==========================================
export async function PUT(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json(
        { error: 'Session expired - Silakan login kembali' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: true, session: data.session },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Refresh session gagal' },
      { status: 500 }
    );
  }
}
```

**File: `apps/web-backend/.env.local` (RAHASIA - JANGKA PAKE REPO)**
```
# CLOUDFLARE TURNSTILE - SECRET KEY (HANYA LOCAL DEVELOPMENT)
CLOUDFLARE_SECRET_KEY=your_secret_key_here_ini_rahasia

# SUPABASE - SUDAH ADA DI PROYEK
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# OPSIONAL: Node Environment
NODE_ENV=development
```

---

## 4. CONFIGURATION ENVIRONMENT VARIABLES

### 4.1 Mobile Environment (`apps/mobile/.env.local`)

| Variable | Deskripsi | Visibility |
|----------|-----------|------------|
| `EXPO_PUBLIC_CLOUDFLARE_SITE_KEY` | Site key dari Cloudflare Dashboard | ✅ Publik (client-side) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Publik (client-side) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ Publik (client-side) |

**Catatan:** Prefix `EXPO_PUBLIC` wajib untuk Expo meny ekspose variable ke JavaScript bundle.

### 4.2 Web Environment (`apps/web-backend/.env.local`)

| Variable | Deskripsi | Visibility |
|----------|-----------|------------|
| `CLOUDFLARE_SECRET_KEY` | Secret key dari Cloudflare Dashboard | ❌ Rahasia (server-side hanya) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Publik (tapi hanya URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ Publik (tapi hanya anon key) |
| `NODE_ENV` | Environment mode development/production | ✅ Lokal |

**PENTING:** `CLOUDFLARE_SECRET_KEY` harus ada di `.env.local` dan **TIDAK BOLEH** ada di `.env` publik atau diexpose ke client. File `.env.local` sudah terinclude di `.gitignore` (sesuai struktur monorepo standar).

---

## 5. SECURITY CONSIDERATIONS

### 5.1 Keamanan yang Diperoleh

1. **Menghentikan Bot Sederhana:**
   - Turnstile mengharusakan challenge human
   - Mencegah script registrasi otomatis
   - Meningkatkan quality daftar akun

2. **Lapisan Keamanan Ganda:**
   - Layer 1: Cloudflare Turnstile verification
   - Layer 2: Supabase Auth email/password validation
   - Layer 3: Session management Supabase

3. **Protection against:**
   - Automated registration scripts
   - Credential stuffing (sama seperti tanpa Turnstile)
   - Tapi: Mencegah bot sederhana yang tidak bisa solve challenge

### 5.2 Risiko dan Mitigasi

| Risiko | Tingkat | Mitigasi |
|--------|---------|----------|
| Token expired | Rendah | Cloudflare TTL default 2-10 menit, cukup untuk session login |
| Library error di device | Rendah | Test di iOS + Android sebelum release |
| User experience disrupted | Rendah | Widget load < 1 detik, pesan error jelas |
| Secret key leaked | Tinggi | Pastikan CLOUDFLARE_SECRET_KEY hanya di .env.local, tidak tercommit ke repo |
| Browser automation masih bisa | Sedang | Turnstile sulit dipecah tapi not impossible; pertimbangkan rate limiting tambahan |

### 5.3 Best Practice

1. **Simpan Secret Key dengan aman:**
   - Hanya di environment server (`.env.local`, tidak ke repo)
   - Gunakan `.gitignore` untuk menyelamatkan file env
   - Rotate key jika terkira bocor

2. **Handle Error Gracefully:**
   - Tampilkan pesan "Verifikasi gagal, coba lagi"
   - Jangan tampilkan detail teknis ke user
   - Beri waktu jeda sebelum coba lagi

3. **Performance Monitoring:**
   - Waktu verifikasi Turnstile biasanya < 500ms
   - Monitor API response time di dashboard
   - Jika lambat, cek koneksi user

---

## 6. TESTING PLAN

### 6.1 Test Case Scenarios

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-01 | User buka login → lengkapi challenge → submit | Login berhasil, user diarahkan ke dashboard |
| TC-02 | User buka login → skip challenge → submit | Error: "Verifikasi robot gagal" |
| TC-03 | User buka login → challenge gagal (tampilan error) | Widget meredup, coba lagi |
| TC-04 | Bot coba akses `/api/auth/login` tanpa widget | Diblokir dengan status 400 |
| TC-05 | User login valid → logout → login lagi | Flow berulang tanpa error |
| TC-06 | Test cross-platform: iOS, Android, Web Browser | Semua platform work consistently |
| TC-07 | Test dengan network lambat (2G/3G) | Widget dan token masih generate dengan benar |

### 6.2 Testing Tools

- **Mobile:** Expo Go di device fisik iOS + Android
- **Web:** Browser Chrome DevTools, Network tab
- **Automated:** Jest tests for API routes
- **Manual:** Test case di atas

### 6.3 Checklist QA

- [ ] Widget Turnstile muncul di halaman login
- [ ] Challenge bisa diselesaikan user
- [ ] Token terkirim ke backend dengan benar
- [ ] Verifikasi Cloudflare sukses
- [ ] Supabase auth login sukses setelah verifikasi
- [ ] Error handling saat token invalid
- [ ] Logout dan login kembali berjalan
- [ ] Environment variables terbaca dengan benar
- [ ] Tidak ada error di console logs

---

## 7. ROLLBACK PLAN

Jika ada issue setelah implementasi:

### 7.1 Instant Rollback Steps

1. **Hapus widget Turnstile dari login form:**
   - Remove `Turnstile` component dari `LoginForm.tsx`
   - Hapus state `turnstileToken`
   - Hapus logika fetch ke `/api/auth/login`

2. **Kembalikan flow login lama:**
   - Kembalikan POST ke `/api/auth/login` tanpa token parameter
   - Supabase auth langsung pakai email/password

3. **Environment cleanup:**
   - Hapus `EXPO_PUBLIC_CLOUDFLARE_SITE_KEY` dari `.env.local` mobile
   - Hapus `CLOUDFLARE_SECRET_KEY` dari `.env.local` web
   - Pastikan tidak ada sisa reference di code

4. **Deploy ulang:**
   - `npm run dev:web` untuk web
   - `expo start` untuk mobile
   - Test ulang flow login tanpa Turnstile

### 7.2 Emergency Contacts

- Jika issue kritis: Review Cloudflare dashboard untuk analytics
- Jika secret key terkira bocor: Generate key baru di Cloudflare dashboard
- Jika Supabase auth error: Cek RLS policies dan user management

---

## 8. CONCLUSION & RECOMMENDATIONS

### 8.1 Hasil Implementasi

Implementasi Cloudflare Turnstile pada HomeTik telah direncanakan dan siap untuk ekssekusi. Berdasarkan planning yang telah dilakukan:

✅ **Sudah Dikonfirmasi:**
- Library `react-native-turnstile` untuk mobile
- Endpoint API route baru di web backend
- Environment variable configuration benar-benar terpisah (public vs secret)
- Struktur file yang rapi dan modular

✅ **Keamanan Tingkat:**
- Menambah layer keauthentication kedua
- Mencegah bot registrasi sederhana
- Compatible dengan supabase auth yang sudah ada

### 8.2 Saran untuk Phase Selanjutnya

1. **Phase 2:** Implementasi rate limiting di Supabase Auth untuk mencegah brute force
2. **Phase 3:** Tambahkan email verification setelah login pertama
3. **Phase 4:** Integrasi dengan OAuth2 providers (Google, GitHub) jika diperlukan
4. **Phase 5:** Monitoring dan analytics di Cloudflare dashboard untuk pattern analisis

### 8.3 Next Steps

1. **Immediately:** Buat file environment `.env.local` kedua platform
2. **This Week:** Implementasi file LoginForm di mobile + API route di web
3. **Next Week:** Testing QA di device fisik dan browser
4. **Release:** Deploy ke staging environment untuk user testing

---

## 9. APPENDIX

### 9.1 Cloudflare Turnstile vs reCAPTCHA

| Fitur | Cloudflare Turnstile | reCAPTCHA |
|-------|---------------------|-----------|
| **Cost** | Gratis untuk kebanyakan penggunaan | Gratis (tetapi limit) |
| **Privacy** | Fokus privacy-first | Google tracking |
| **Mobile Support** | Native + Web View | Utama Web |
| **Accessibility** | Baik | Variabel |
| **Setup Complexity** | Rendah | Menengah |
| **Rate Limiting** | Built-in | perlu konfigurasi |

**Alasan Memilih Turnstile:**
- Gratis dan tidak memerlukan Google account
- Mobile support yang baik melalui library
- Privacy policy yang lebih baik untuk aplikasi Indonesia
- Lebih mudah diintegrasi ke proyek React Native

### 9.2 Kode Referensi Cepat

**Mobile Import:**
```typescript
import Turnstile from 'react-native-turnstile';
// atau: import { Turnstile } from 'react-native-turnstile';
```

**Web Route Pattern:**
```typescript
// File: apps/web-backend/src/app/api/auth/[...]/route.ts
// Matches: /api/auth/login, /api/auth/logout, dsb
```

**Environment Check:**
```typescript
// Mobile: .env.local
EXPO_PUBLIC_CLOUDFLARE_SITE_KEY=key_situs

// Web: .env.local (RAHASIA)
CLOUDFLARE_SECRET_KEY=secret_key
// Pastikan tidak ada di .env publik!
```

---

**Laporan Selesai.**
*Document generated for HomeTik Cloudflare Turnstile Implementation Plan.*
*Untuk eskulusi lebih lanjut, lihat bagian 6 Testing Plan dan bagian 7 Rollback Plan.*