-- =========================================================
-- AgriSmart Admin — Postgres schema additions
-- =========================================================

-- Ensure new roles are allowed by updating the check constraint on users.role
-- We'll just drop the constraint and add a new one.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('farmer', 'buyer', 'admin', 'super_admin', 'moderator', 'support', 'analyst'));

-- ---------- AUDIT LOGS ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  details         JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ---------- SUPPORT TICKETS ----------
CREATE TABLE IF NOT EXISTS support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- ---------- TICKET REPLIES ----------
CREATE TABLE IF NOT EXISTS ticket_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  is_internal     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id);

-- ---------- SUBSCRIPTION PLANS ----------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  features        JSONB NOT NULL DEFAULT '[]'::jsonb,
  interval        TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly', 'lifetime')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- USER SUBSCRIPTIONS ----------
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON user_subscriptions(user_id);

-- ---------- ADMIN SETTINGS ----------
CREATE TABLE IF NOT EXISTS admin_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT UNIQUE NOT NULL,
  value           JSONB NOT NULL,
  updated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['support_tickets', 'subscription_plans', 'user_subscriptions', 'admin_settings'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_upd ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_upd BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END $$;
