-- =========================================================
-- AgriSmart — Postgres schema (Neon)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE,
  phone           TEXT UNIQUE,
  password_hash   TEXT,
  role            TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer','buyer','admin')),
  language        TEXT DEFAULT 'en',
  avatar_url      TEXT,
  state           TEXT,
  district        TEXT,
  village         TEXT,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ---------- OTP CODES ----------
CREATE TABLE IF NOT EXISTS otp_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  code_hash    TEXT NOT NULL,
  purpose      TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login','register','reset')),
  attempts     INT NOT NULL DEFAULT 0,
  consumed_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- ---------- FARMS ----------
CREATE TABLE IF NOT EXISTS farms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  area_acres       NUMERIC(10,2) NOT NULL CHECK (area_acres >= 0),
  soil_type        TEXT,
  irrigation_type  TEXT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  address          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);

-- ---------- CROPS ----------
CREATE TABLE IF NOT EXISTS crops (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id               UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  variety               TEXT,
  sown_at               DATE,
  expected_harvest_at   DATE,
  health_status         TEXT DEFAULT 'good' CHECK (health_status IN ('good','moderate','poor')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);

-- ---------- MARKETPLACE LISTINGS ----------
CREATE TABLE IF NOT EXISTS listings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  category            TEXT NOT NULL DEFAULT 'crop' CHECK (category IN ('crop','seed','fertilizer','equipment','other')),
  description         TEXT,
  price_per_unit      NUMERIC(12,2) NOT NULL CHECK (price_per_unit >= 0),
  unit                TEXT NOT NULL DEFAULT 'kg',
  quantity_available  NUMERIC(12,2) NOT NULL CHECK (quantity_available >= 0),
  images              TEXT[] DEFAULT '{}',
  location            TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  quantity          NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  total_amount      NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  shipping_address  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('weather','market','order','system')),
  title       TEXT,
  body        TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

-- ---------- MARKET PRICE SNAPSHOTS ----------
CREATE TABLE IF NOT EXISTS market_prices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name             TEXT NOT NULL,
  crop_key              TEXT NOT NULL,
  city                  TEXT NOT NULL,
  city_key              TEXT NOT NULL,
  market                TEXT NOT NULL,
  market_key            TEXT NOT NULL,
  min_price             NUMERIC(14,2),
  max_price             NUMERIC(14,2),
  avg_price             NUMERIC(14,2) NOT NULL CHECK (avg_price >= 0),
  unit                  TEXT NOT NULL DEFAULT '100kg',
  price_date            DATE NOT NULL,
  source                TEXT NOT NULL DEFAULT 'AMIS',
  source_record_id      TEXT NOT NULL,
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, source_record_id, price_date)
);
CREATE INDEX IF NOT EXISTS idx_market_prices_city ON market_prices(city_key);
CREATE INDEX IF NOT EXISTS idx_market_prices_crop ON market_prices(crop_key);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(price_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_trend ON market_prices(city_key, crop_key, price_date DESC);

CREATE TABLE IF NOT EXISTS market_price_sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL DEFAULT 'AMIS',
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('scheduled','manual')),
  status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed','skipped')),
  fetched_count   INT NOT NULL DEFAULT 0,
  inserted_count  INT NOT NULL DEFAULT 0,
  updated_count   INT NOT NULL DEFAULT 0,
  skipped_count   INT NOT NULL DEFAULT 0,
  error_summary   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_market_sync_started ON market_price_sync_logs(started_at DESC);

-- ---------- updated_at trigger helper ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','farms','crops','listings','orders'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_upd ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_upd BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END $$;
