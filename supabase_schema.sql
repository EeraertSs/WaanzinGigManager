-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE gig_status AS ENUM ('Draft', 'Lead', 'Confirmed', 'Contract Sent', 'Done', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure 'Draft' exists in the enum (in case the type already existed without it)
ALTER TYPE gig_status ADD VALUE IF NOT EXISTS 'Draft';

-- Create Gigs Table
CREATE TABLE IF NOT EXISTS gigs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    venue_name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    fee NUMERIC,
    status gig_status DEFAULT 'Draft',
    
    -- Contact Info
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Schedule
    call_time TEXT,
    start_time TEXT,
    end_time TEXT,
    
    -- Financials & Logistics
    payment_method TEXT DEFAULT 'Invoice',
    is_free BOOLEAN DEFAULT FALSE,
    own_pa_required BOOLEAN DEFAULT FALSE,
    pa_cost NUMERIC,
    
    -- Waanzin Assistant / Automation
    source_email_id TEXT,
    ai_confidence DECIMAL(3, 2),
    ai_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure new columns exist (if table already existed)
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS source_email_id TEXT;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3, 2);
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS ai_notes TEXT;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS has_unseen_ai_updates BOOLEAN DEFAULT FALSE;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS ai_proposed_updates JSONB;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop legacy check constraint if it exists (it conflicts with the Enum)
ALTER TABLE public.gigs DROP CONSTRAINT IF EXISTS gigs_status_check;

-- Create Emails Table (for Async Sync)
CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY, -- Message-ID or UID
    subject TEXT,
    sender TEXT,
    body TEXT,
    received_at TIMESTAMPTZ,
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    folder TEXT
);

-- Ensure new columns exist (if table already existed)
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS folder TEXT;

-- Enable Row Level Security (RLS)
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Gigs
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;
CREATE POLICY "Enable read access for all users" ON public.gigs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable write access for all users" ON public.gigs;
CREATE POLICY "Enable write access for all users" ON public.gigs FOR ALL USING (true);

-- Emails
DROP POLICY IF EXISTS "Enable read access for all users" ON public.emails;
CREATE POLICY "Enable read access for all users" ON public.emails FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable write access for all users" ON public.emails;
CREATE POLICY "Enable write access for all users" ON public.emails FOR ALL USING (true);

-- Insert Sample Data (Only if table is empty)
INSERT INTO public.gigs (
  date, venue_name, location, fee, status, 
  contact_name, contact_email, contact_phone,
  call_time, start_time, end_time, payment_method, is_free, own_pa_required, pa_cost
)
SELECT
    now() + interval '7 days', 'De Klinker', 'Aarschot', 500, 'Confirmed', 
    'Jan Peeters', 'jan@klinker.be', '+32 477 12 34 56',
    '18:00', '20:00', '22:00', 'Invoice', false, true, 150
WHERE NOT EXISTS (SELECT 1 FROM public.gigs LIMIT 1);
