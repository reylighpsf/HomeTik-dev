-- ============================================================================
-- HomeTik – Database Schema, Security (RLS), RBAC & Seed Data
-- PostgreSQL with PostGIS & Supabase Auth
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CUSTOM ENUM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'BARBER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'DRAFT',
    'PENDING',
    'ACCEPTED',
    'IN_TRANSIT',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1  profiles – core user / account data (Linked to auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role     NOT NULL DEFAULT 'USER',
  name        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  UNIQUE,
  phone       VARCHAR(20),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.2  barber_details – extra info for BARBER-role users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS barber_details (
  id               UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id       UUID            NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  is_online        BOOLEAN         NOT NULL DEFAULT false,
  rating           NUMERIC(3, 2)   NOT NULL DEFAULT 5.0,
  total_reviews    INT             NOT NULL DEFAULT 0,
  specialties      TEXT[]          NOT NULL DEFAULT '{}',
  current_location GEOMETRY(Point, 4326),
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.3  services – catalogue of bookable services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(255)    NOT NULL,
  description      TEXT,
  icon             VARCHAR(100),
  base_price       NUMERIC(10, 2)  NOT NULL,
  duration_minutes INT             NOT NULL,
  category         VARCHAR(100),
  is_active        BOOLEAN         NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.4  bookings – user ↔ barber appointments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id            UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id     UUID            REFERENCES profiles(id) ON DELETE SET NULL,
  status        booking_status  NOT NULL DEFAULT 'PENDING',
  service_type  VARCHAR(255)    NOT NULL,
  notes         TEXT,
  total_price   NUMERIC(10, 2)  NOT NULL,
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  user_location GEOMETRY(Point, 4326),
  user_address  TEXT,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.5  booking_notifications – records dispatched notifications to barbers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_notifications (
  id                 UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_profile_id  UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id         UUID            NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  distance_km        NUMERIC(6, 2)   NOT NULL,
  status             VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
  created_at         TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_barber_details_current_location
  ON barber_details USING GIST (current_location);

CREATE INDEX IF NOT EXISTS idx_bookings_user_location
  ON bookings USING GIST (user_location);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings (status);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id
  ON bookings (user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_barber_id
  ON bookings (barber_id);

CREATE INDEX IF NOT EXISTS idx_booking_notifications_barber
  ON booking_notifications (barber_profile_id);

CREATE INDEX IF NOT EXISTS idx_booking_notifications_booking
  ON booking_notifications (booking_id);

-- ============================================================================
-- 5. TRIGGER FUNCTION – auto-update `updated_at`
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_barber_details_updated_at ON barber_details;
CREATE TRIGGER trg_barber_details_updated_at
  BEFORE UPDATE ON barber_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. AUTH SYNC TRIGGER – auto-create profile & barber_details on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role;
  user_name_val TEXT;
BEGIN
  -- Dapatkan role dari app_metadata (prioritas) atau user_metadata, default 'USER'
  assigned_role := COALESCE(
    (NEW.raw_app_meta_data->>'role')::public.user_role,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'USER'::public.user_role
  );

  user_name_val := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.phone,
    'Pengguna HomeTik'
  );

  INSERT INTO public.profiles (id, role, name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    assigned_role,
    user_name_val,
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = now();

  -- Jika role BARBER, buat baris di barber_details
  IF assigned_role = 'BARBER' THEN
    INSERT INTO public.barber_details (profile_id, specialties, is_online)
    VALUES (NEW.id, ARRAY['Haircut', 'Styling'], false)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. RBAC JWT CUSTOM ACCESS TOKEN HOOK
-- ============================================================================
-- Menyuntikkan role ke dalam token JWT (claim `user_role` dan `app_metadata.role`)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims JSONB;
  current_role TEXT;
BEGIN
  -- Ambil role langsung dari profiles
  SELECT role::TEXT INTO current_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::UUID;

  claims := event->'claims';

  IF current_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(current_role));
    claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(current_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"USER"');
    claims := jsonb_set(claims, '{app_metadata, role}', '"USER"');
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Semua user (termasuk anonim) dapat melihat profil dasar (nama, avatar, rating barber)
CREATE POLICY "Profiles can be viewed by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- User hanya dapat mengupdate profil miliknya sendiri
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- 8.2 barber_details
-- ---------------------------------------------------------------------------
ALTER TABLE barber_details ENABLE ROW LEVEL SECURITY;

-- Informasi barber online/tersedia dapat dilihat oleh semua
CREATE POLICY "Barber details can be viewed by everyone"
  ON barber_details FOR SELECT
  TO authenticated, anon
  USING (true);

-- Barber hanya dapat mengupdate data miliknya sendiri (lokasi GPS, online status)
CREATE POLICY "Barbers can update their own details"
  ON barber_details FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

-- ---------------------------------------------------------------------------
-- 8.3 services
-- ---------------------------------------------------------------------------
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Semua orang dapat melihat katalog layanan aktif
CREATE POLICY "Services catalog can be viewed by all"
  ON services FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Hanya ADMIN yang dapat mengelola layanan (via app_metadata role atau profiles.role)
CREATE POLICY "Only admins can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'ADMIN'
    )
  );

CREATE POLICY "Only admins can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'ADMIN'
    )
  );

-- ---------------------------------------------------------------------------
-- 8.4 bookings
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Customer pemilik, Barber yang ditugaskan, atau Barber online (saat PENDING) bisa membaca
CREATE POLICY "Users and assigned barbers can view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) = barber_id
    OR (status = 'PENDING' AND EXISTS (
      SELECT 1 FROM barber_details WHERE profile_id = (select auth.uid())
    ))
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'ADMIN'
    )
  );

-- Customer dapat membuat booking baru untuk dirinya sendiri
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Customer atau Barber yang terlibat dapat mengupdate status
CREATE POLICY "Parties involved can update booking"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) = barber_id
    OR (status = 'PENDING' AND EXISTS (
      SELECT 1 FROM barber_details WHERE profile_id = (select auth.uid())
    ))
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select auth.uid()) = barber_id
    OR barber_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'ADMIN'
    )
  );

-- ---------------------------------------------------------------------------
-- 8.5 booking_notifications
-- ---------------------------------------------------------------------------
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbers can view their notifications"
  ON booking_notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = barber_profile_id);

CREATE POLICY "Barbers can update their notifications"
  ON booking_notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = barber_profile_id)
  WITH CHECK ((select auth.uid()) = barber_profile_id);

-- ============================================================================
-- 9. STORED FUNCTION – find_nearby_barbers (PostGIS)
-- ============================================================================

CREATE OR REPLACE FUNCTION find_nearby_barbers(
  user_lat   FLOAT,
  user_lng   FLOAT,
  radius_km  FLOAT DEFAULT 5.0
)
RETURNS TABLE (
  id              UUID,
  profile_id      UUID,
  is_online       BOOLEAN,
  rating          NUMERIC,
  total_reviews   INT,
  specialties     TEXT[],
  distance_km     FLOAT,
  user_name       VARCHAR,
  user_avatar_url TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bd.id,
    bd.profile_id,
    bd.is_online,
    bd.rating,
    bd.total_reviews,
    bd.specialties,
    (ST_Distance(
      bd.current_location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000.0)::FLOAT                       AS distance_km,
    p.name::VARCHAR                           AS user_name,
    p.avatar_url                              AS user_avatar_url
  FROM barber_details bd
  JOIN profiles p ON p.id = bd.profile_id
  WHERE bd.is_online = true
    AND bd.current_location IS NOT NULL
    AND ST_DWithin(
          bd.current_location::geography,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
          radius_km * 1000
        )
  ORDER BY distance_km ASC;
END;
$$;

-- ============================================================================
-- 10. SEED DATA – sample services
-- ============================================================================

INSERT INTO services (name, description, icon, base_price, duration_minutes, category) VALUES
  (
    'Potong Rambut',
    'Layanan potong rambut profesional sesuai gaya yang diinginkan.',
    'scissors',
    50000.00,
    30,
    'Rambut'
  ),
  (
    'Cukur Jenggot',
    'Rapikan dan bentuk jenggot dengan presisi menggunakan pisau cukur.',
    'razor',
    30000.00,
    20,
    'Jenggot'
  ),
  (
    'Styling Rambut',
    'Penataan rambut dengan produk styling premium untuk tampilan terbaik.',
    'sparkles',
    75000.00,
    45,
    'Rambut'
  ),
  (
    'Facial Treatment',
    'Perawatan wajah dasar termasuk pembersihan dan pelembap.',
    'face',
    60000.00,
    40,
    'Perawatan'
  ),
  (
    'Pijat Kepala',
    'Pijat kepala relaksasi untuk menghilangkan pegal dan stres.',
    'hand',
    40000.00,
    25,
    'Relaksasi'
  )
ON CONFLICT DO NOTHING;
