-- Full Members Migration Script for Supabase
-- Run this in your Supabase SQL editor

-- Step 1: Create members table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_leader BOOLEAN DEFAULT FALSE,
  budget DECIMAL(10,2) DEFAULT 1400.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, name)
);

-- Step 2: Add member_id to expenditures table
ALTER TABLE expenditures 
ADD COLUMN IF NOT EXISTS member_id TEXT REFERENCES members(id) ON DELETE SET NULL;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_team_id ON members(team_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_member_id ON expenditures(member_id);

-- Step 4: Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies for members (allow all access for now)
CREATE POLICY "Enable all access for members" ON members
  FOR ALL USING (true);

-- Step 6: Create function to get member summary with spending
CREATE OR REPLACE FUNCTION get_member_summary()
RETURNS TABLE (
  member_id TEXT,
  member_name TEXT,
  team_id TEXT,
  team_name TEXT,
  is_leader BOOLEAN,
  budget DECIMAL,
  total_spent DECIMAL,
  remaining DECIMAL,
  percentage_used DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id::TEXT as member_id,
    m.name as member_name,
    m.team_id::TEXT,
    t.name as team_name,
    m.is_leader,
    m.budget,
    COALESCE(SUM(e.amount), 0) as total_spent,
    CASE 
      WHEN m.is_leader THEN NULL
      ELSE m.budget - COALESCE(SUM(e.amount), 0)
    END as remaining,
    CASE 
      WHEN m.is_leader THEN NULL
      WHEN m.budget > 0 THEN (COALESCE(SUM(e.amount), 0) / m.budget * 100)
      ELSE 0
    END as percentage_used
  FROM members m
  JOIN teams t ON m.team_id = t.id
  LEFT JOIN expenditures e ON m.id::TEXT = e.member_id
  GROUP BY m.id, m.name, m.team_id, t.name, m.is_leader, m.budget
  ORDER BY t.name, m.is_leader DESC, m.name;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create a view for easier member data access
CREATE OR REPLACE VIEW member_spending_view AS
SELECT 
  m.id as member_id,
  m.name as member_name,
  m.team_id,
  t.name as team_name,
  m.is_leader,
  m.budget,
  COALESCE(SUM(e.amount), 0) as total_spent,
  CASE 
    WHEN m.is_leader THEN NULL
    ELSE m.budget - COALESCE(SUM(e.amount), 0)
  END as remaining,
  CASE 
    WHEN m.is_leader THEN NULL
    WHEN m.budget > 0 THEN (COALESCE(SUM(e.amount), 0) / m.budget * 100)
    ELSE 0
  END as percentage_used
FROM members m
JOIN teams t ON m.team_id = t.id
LEFT JOIN expenditures e ON m.id = e.member_id
GROUP BY m.id, m.name, m.team_id, t.name, m.is_leader, m.budget;

-- Step 8: Verify the migration
-- Check if members table was created
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'members'
) as members_table_exists;

-- Check if member_id column was added to expenditures
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'expenditures' 
  AND column_name = 'member_id'
) as member_id_column_exists;

-- Optional: Insert sample members for testing (uncomment to use)
-- INSERT INTO members (team_id, name, is_leader, budget) VALUES
--   ('1', 'Team Leader 1', true, 0),
--   ('1', 'Member 1A', false, 1400),
--   ('1', 'Member 1B', false, 1400),
--   ('2', 'Team Leader 2', true, 0),
--   ('2', 'Member 2A', false, 1400),
--   ('2', 'Member 2B', false, 1400);

-- Display success message
SELECT 'Members migration completed successfully!' as status; 