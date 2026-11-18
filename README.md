# ✂️ HomeTik — On-Demand Home Barber & Grooming Platform

![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?style=flat-square&logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20PostGIS-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)

**HomeTik** adalah platform layanan pemanggilan barber & *grooming* ke rumah (*on-demand home service*) yang dibangun dengan arsitektur **Monorepo (NPM Workspaces)**. Pelanggan dapat menjelajahi katalog layanan, mencari mitra barber *online* terdekat berbasis lokasi GPS (**PostGIS**), memilih barber secara langsung, serta mengelola profil dan riwayat pesanan dalam satu aplikasi mobile.

---

## ✨ Fitur Utama

### 🔐 Autentikasi, Mode Tamu & Verifikasi Email OTP
- **Guest Mode & Route Guarding:** Pengunjung dapat menjelajahi beranda dan katalog layanan tanpa login; akses fitur pemesanan dan profil dijaga oleh `AuthContext` dan Next.js Middleware RBAC (`USER`, `BARBER`, `ADMIN`).
- **Registrasi & Verifikasi Email OTP 8-Digit:** Menggunakan `supabase.auth.signUp` dengan *Stateless Implicit Client* (non-PKCE) dan Custom SMTP (Gmail / Brevo), dilengkapi komponen `OtpInput` responsif dengan *auto-focus*, *paste* 8 digit sekaligus, *countdown* 60 detik, dan anti *double-submit*.
- **Auto-Recovery Login (`EMAIL_NOT_CONFIRMED`):** Jika pengguna menutup aplikasi sebelum menyelesaikan OTP lalu mencoba login kembali, backend otomatis mengirim ulang kode OTP baru dan aplikasi langsung mengarahkan ke layar `/verify-otp`.
- **Lupa & Ganti Kata Sandi:** Alur lengkap *Forgot Password* → *Verify OTP* → *Reset Password*, serta modal **Ganti Kata Sandi** langsung dari halaman Profil.

### 🏠 Beranda & Katalog Layanan
- **Dashboard Modern:** *Pearl White Splash Screen*, 8-Grid layanan utama, kartu pemesanan cepat, daftar *Top Rated Barbers*, dan katalog layanan publik (`PublicCatalog`).
- **Folder-per-Page Routing:** Struktur Expo Router yang modular dan mudah dikembangkan.

### 📍 Pemesanan Interaktif & Pilih Barber Terdekat
- **Spatial Query (PostGIS):** Pencarian mitra barber berstatus *online* di sekitar koordinat pengguna (`useNearbyBarbers`).
- **Direct Selection & Checkout Modal:** Pelanggan dapat memilih barber spesifik, melihat rating/jarak/ETA, memilih metode pembayaran (HometikPay / QRIS / Tunai), menambahkan patokan rumah, dan mengirim pesanan langsung ke backend (`/api/bookings`).

### 👤 Manajemen Profil & Dompet
- **Sinkronisasi Database Supabase:** Perubahan nama, nomor WhatsApp, alamat tersimpan, dan foto profil langsung tersimpan ke tabel `profiles`.
- **Default Avatar:** Avatar siluet default otomatis digunakan untuk mode tamu dan pengguna yang belum mengunggah foto profil.

---

## 🗂️ Struktur Monorepo

```text
HomeTik-dev/
├── apps/
│   ├── backend/                     # Next.js 15 App Router API & Admin Backend
│   │   ├── src/app/api/
│   │   │   ├── auth/                # login, register, logout, user, otp/send, otp/verify
│   │   │   ├── barbers/             # nearby barber spatial endpoints
│   │   │   └── bookings/            # booking creation & management
│   │   ├── src/lib/
│   │   │   ├── supabase/            # SSR client, Stateless OTP client, Admin client
│   │   │   ├── validators/          # Zod schemas (auth, booking)
│   │   │   └── schema.sql           # Skema PostgreSQL, PostGIS, RLS & Triggers
│   │   └── src/middleware.ts        # Route guard & RBAC JWT verification
│   └── mobile/                      # React Native (Expo SDK 58 + Expo Router)
│       ├── assets/                  # Ikon & default-avatar.png
│       └── src/
│           ├── app/                 # (tabs)/home, services, bookings, profile, login, register, verify-otp, reset-password, booking/select-barber
│           ├── components/          # auth (OtpInput, LoginForm, RegisterForm, ForgotPasswordForm), home, splash
│           ├── context/             # AuthContext
│           ├── hooks/               # use-profile, use-bookings, use-nearby-barbers
│           └── lib/                 # supabase client & smart api.ts resolver
├── packages/
│   └── shared-types/                # Tipe TypeScript bersama antara backend & mobile
└── package.json                     # NPM Workspaces root scripts
```

---

## 🛠️ Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| **Mobile App** | React Native `0.88`, Expo SDK `58`, Expo Router, TanStack React Query v5, React Native MMKV |
| **Backend API** | Next.js `15` (App Router), TypeScript, Zod Validation |
| **Database & Auth** | Supabase (PostgreSQL + PostGIS Spatial Index, Row Level Security, Supabase Auth) |
| **Monorepo** | NPM Workspaces (`apps/*`, `packages/*`) |

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
- **Node.js** `>= 20.0.0` dan **npm** `>= 10.0.0`
- Proyek **Supabase** aktif (PostgreSQL + PostGIS)
- **Android Studio Emulator**, **iOS Simulator**, atau aplikasi **Expo Go** di HP fisik

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/reylighpsf/HomeTik-dev.git
cd HomeTik-dev
npm install
```

### 3. Setup Database & Email OTP di Supabase
1. Buka **Supabase Dashboard → SQL Editor**, lalu jalankan seluruh isi file [`apps/backend/src/lib/schema.sql`](apps/backend/src/lib/schema.sql) untuk membuat tabel (`profiles`, `barber_details`, `bookings`, `booking_notifications`), RLS policies, fungsi PostGIS, dan trigger `handle_new_user`.
2. Aktifkan **Confirm email** di **Authentication → Providers → Email**.
3. Di **Authentication → Email Templates**, ubah template **Confirm sign up** dan **Magic Link** agar menampilkan `{{ .Token }}` (tanpa `{{ .ConfirmationURL }}` agar tidak ter-prefetch otomatis):
   ```html
   <h2>Kode Verifikasi HomeTik</h2>
   <p>Masukkan kode OTP berikut di aplikasi HomeTik:</p>
   <h1 style="letter-spacing: 6px; color: #00B14F;">{{ .Token }}</h1>
   <p>Kode ini bersifat rahasia. Jangan bagikan kepada siapa pun.</p>
   ```
4. *(Disarankan)* Hubungkan **Custom SMTP** (Gmail App Password atau Brevo) di **Project Settings → Authentication → SMTP Settings** agar tidak terkena batas *rate limit* bawaan free tier.

### 4. Konfigurasi Environment Variables

Salin contoh file env di masing-masing workspace:

**Backend (`apps/backend/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-or-secret-key>
```

**Mobile (`apps/mobile/.env.local`):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>

# Android Emulator:
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# HP Fisik via Wi-Fi (ganti dengan IP Wi-Fi laptop atau komentari agar auto-detect):
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

### 5. Jalankan Aplikasi

Buka **2 terminal** dari folder root:

**Terminal 1 — Backend Next.js (port 3000):**
```bash
npm run dev:backend
```

**Terminal 2 — Mobile Expo:**
```bash
npm run dev:mobile
```
*(Gunakan `npx expo start -c` di dalam `apps/mobile` jika baru saja mengubah `.env.local`)*

---

## 📜 Skrip NPM Tersedia

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev:backend` | Menjalankan server backend Next.js di `0.0.0.0:3000` (mode development) |
| `npm run dev:mobile` | Menjalankan Expo Metro Bundler untuk aplikasi mobile |
| `npm run web` | Menjalankan aplikasi mobile dalam mode Expo Web |
| `npm run build:backend` | Build produksi untuk backend Next.js |
| `npm run typecheck` | Menjalankan `tsc --noEmit` di seluruh workspace (`backend` & `mobile`) |
| `npm run lint` | Menjalankan ESLint di seluruh workspace |

---

## 🔌 Ringkasan Endpoint API Utama

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/otp/send` | Kirim OTP 8-digit via Email untuk registrasi (`signUp`), kirim ulang (`resend`), atau lupa sandi |
| `POST` | `/api/auth/otp/verify` | Verifikasi kode OTP dan mengembalikan sesi JWT Supabase |
| `POST` | `/api/auth/login` | Login Email + Password dengan deteksi & auto-recovery akun belum verifikasi (`403 EMAIL_NOT_CONFIRMED`) |
| `POST` | `/api/auth/register` | Registrasi akun langsung (fallback / direct signup) |
| `GET` | `/api/auth/user` | Mengambil data pengguna & profil yang sedang login |
| `GET` | `/api/barbers/nearby` | Query PostGIS daftar barber *online* terdekat berdasarkan koordinat GPS |
| `GET/POST` | `/api/bookings` | Mengambil riwayat pesanan pengguna & membuat pesanan baru |

---

## 🗺️ Roadmap

- [x] **Sprint 1:** Setup Monorepo, Skema Supabase + PostGIS, Auth & Route Guarding, Dashboard Mobile & Splash Screen
- [x] **Sprint 2 (Core Flow):** Pilih Barber Online Terdekat, Profil Tersinkron Database, Default Avatar, Email OTP 8-Digit & Auto-Recovery Login
- [ ] **Sprint 2 (Lanjutan):** WhatsApp Dispatch otomatis ke mitra barber, Live Tracking peta GPS, & Integrasi pembayaran QRIS
- [ ] **Sprint 3:** Admin Web Dashboard (verifikasi mitra, manajemen layanan & analitik) dan Push Notification (FCM / Expo)

---

## 📄 Lisensi

Proyek ini dikembangkan untuk tujuan pengembangan platform **HomeTik**. Hak cipta © 2026 HomeTik.
