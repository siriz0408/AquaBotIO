-- Equipment Tracking Migration (Spec 10 - R-102)
-- Adds equipment catalog with lifespan tracking for Plus+ tier users

-- Equipment Lifespan Defaults Table (reference data)
CREATE TABLE IF NOT EXISTS equipment_lifespan_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type VARCHAR(50) NOT NULL UNIQUE,
  lifespan_months_min INT NOT NULL,
  lifespan_months_max INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default lifespans
INSERT INTO equipment_lifespan_defaults (equipment_type, lifespan_months_min, lifespan_months_max, notes)
VALUES
  ('filter', 24, 48, 'External/canister filter unit'),
  ('filter_media', 3, 6, 'Varies by type (sponge, cartridge, biological)'),
  ('heater', 24, 36, 'Standard aquarium heaters'),
  ('light_bulb', 12, 18, 'Conventional T8, T5 fluorescent'),
  ('light_led', 36, 60, 'Modern LED fixtures'),
  ('protein_skimmer', 24, 60, 'Marine/reef only'),
  ('powerhead', 24, 48, 'Circulation pump'),
  ('dosing_pump', 36, 84, 'Peristaltic/stepper'),
  ('controller', 36, 60, 'Aquarium controller'),
  ('carbon', 1, 1, 'Activated carbon - replace monthly'),
  ('substrate', 60, 120, 'Gravel, sand - very stable'),
  ('test_kit', 12, 24, 'Reagent expiration varies'),
  ('media', 6, 12, 'Bio-media, ceramic rings'),
  ('other', 12, 36, 'Default for custom types')
ON CONFLICT (equipment_type) DO NOTHING;

-- RLS for lifespan defaults (read-only for authenticated users)
ALTER TABLE equipment_lifespan_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lifespan defaults"
  ON equipment_lifespan_defaults FOR SELECT
  USING (auth.role() = 'authenticated');

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Core fields
  type VARCHAR(50) NOT NULL, -- filter, heater, light, skimmer, powerhead, pump, controller, test_kit, substrate, media, carbon, other
  custom_type VARCHAR(100), -- if type = 'other'
  brand VARCHAR(100),
  model VARCHAR(100),

  -- Dates
  purchase_date DATE NOT NULL,
  last_serviced_date DATE, -- when last maintenance was performed

  -- Settings & notes
  settings TEXT, -- flow rate, wattage, schedule, temperature, etc.
  notes TEXT,

  -- Cost (optional)
  purchase_price DECIMAL(10, 2),

  -- Lifespan & status
  expected_lifespan_months INT, -- override default; NULL uses system default

  -- Media
  photo_url VARCHAR(500), -- Supabase Storage URL

  -- Location & context
  location VARCHAR(100), -- filter chamber 1, sump, etc.

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- soft delete
  deletion_reason VARCHAR(50), -- replaced, removed, failed, sold, other

  CONSTRAINT check_positive_lifespan CHECK (expected_lifespan_months > 0 OR expected_lifespan_months IS NULL),
  CONSTRAINT check_purchase_date CHECK (purchase_date <= CURRENT_DATE)
);

-- Indexes for equipment
CREATE INDEX IF NOT EXISTS idx_equipment_tank_id ON equipment(tank_id);
CREATE INDEX IF NOT EXISTS idx_equipment_user_id ON equipment(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_deleted_at ON equipment(deleted_at);
CREATE INDEX IF NOT EXISTS idx_equipment_purchase_date ON equipment(purchase_date);

-- RLS for equipment
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own equipment"
  ON equipment FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equipment"
  ON equipment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment"
  ON equipment FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment"
  ON equipment FOR DELETE
  USING (auth.uid() = user_id);

-- Function to verify tank ownership
CREATE OR REPLACE FUNCTION check_equipment_tank_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tanks WHERE id = NEW.tank_id AND user_id = NEW.user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Equipment must be associated with an active tank owned by the user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce tank ownership
DROP TRIGGER IF EXISTS trigger_check_equipment_tank_ownership ON equipment;
CREATE TRIGGER trigger_check_equipment_tank_ownership
BEFORE INSERT OR UPDATE ON equipment
FOR EACH ROW EXECUTE FUNCTION check_equipment_tank_ownership();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_equipment_timestamp ON equipment;
CREATE TRIGGER trigger_update_equipment_timestamp
BEFORE UPDATE ON equipment
FOR EACH ROW EXECUTE FUNCTION update_equipment_updated_at();

-- Function to get equipment with status calculation
CREATE OR REPLACE FUNCTION get_equipment_with_status(p_tank_id UUID)
RETURNS TABLE (
  id UUID,
  tank_id UUID,
  user_id UUID,
  type VARCHAR(50),
  custom_type VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  purchase_date DATE,
  last_serviced_date DATE,
  settings TEXT,
  notes TEXT,
  purchase_price DECIMAL(10, 2),
  expected_lifespan_months INT,
  photo_url VARCHAR(500),
  location VARCHAR(100),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Calculated fields
  age_months INT,
  lifespan_months INT,
  months_remaining INT,
  status TEXT -- 'good', 'due_soon', 'overdue'
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.tank_id,
    e.user_id,
    e.type,
    e.custom_type,
    e.brand,
    e.model,
    e.purchase_date,
    e.last_serviced_date,
    e.settings,
    e.notes,
    e.purchase_price,
    e.expected_lifespan_months,
    e.photo_url,
    e.location,
    e.created_at,
    e.updated_at,
    -- Age calculation (from last serviced date if exists, otherwise purchase date)
    EXTRACT(MONTH FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT +
    (EXTRACT(YEAR FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT * 12) AS age_months,
    -- Lifespan (use custom or default)
    COALESCE(e.expected_lifespan_months, COALESCE(d.lifespan_months_max, 24)) AS lifespan_months,
    -- Months remaining
    COALESCE(e.expected_lifespan_months, COALESCE(d.lifespan_months_max, 24)) - (
      EXTRACT(MONTH FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT +
      (EXTRACT(YEAR FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT * 12)
    ) AS months_remaining,
    -- Status
    CASE
      WHEN (
        EXTRACT(MONTH FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT +
        (EXTRACT(YEAR FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT * 12)
      ) >= COALESCE(e.expected_lifespan_months, COALESCE(d.lifespan_months_max, 24)) THEN 'overdue'
      WHEN (
        EXTRACT(MONTH FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT +
        (EXTRACT(YEAR FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT * 12)
      ) >= (COALESCE(e.expected_lifespan_months, COALESCE(d.lifespan_months_max, 24)) * 0.8) THEN 'due_soon'
      ELSE 'good'
    END AS status
  FROM equipment e
  LEFT JOIN equipment_lifespan_defaults d ON d.equipment_type = e.type
  WHERE e.tank_id = p_tank_id
    AND e.deleted_at IS NULL
  ORDER BY
    CASE
      WHEN (
        EXTRACT(MONTH FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT +
        (EXTRACT(YEAR FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT * 12)
      ) >= COALESCE(e.expected_lifespan_months, COALESCE(d.lifespan_months_max, 24)) THEN 1
      WHEN (
        EXTRACT(MONTH FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT +
        (EXTRACT(YEAR FROM AGE(NOW(), COALESCE(e.last_serviced_date, e.purchase_date)::TIMESTAMP))::INT * 12)
      ) >= (COALESCE(e.expected_lifespan_months, COALESCE(d.lifespan_months_max, 24)) * 0.8) THEN 2
      ELSE 3
    END,
    e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_equipment_with_status(UUID) TO authenticated;

-- Storage bucket for equipment photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-photos',
  'equipment-photos',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for equipment photos
CREATE POLICY "Users can upload equipment photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'equipment-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their equipment photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'equipment-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their equipment photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'equipment-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
