-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_leader BOOLEAN DEFAULT FALSE,
  budget DECIMAL(10,2) DEFAULT 1400.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, name)
);

-- Add member_id to expenditures table
ALTER TABLE expenditures 
ADD COLUMN IF NOT EXISTS member_id TEXT REFERENCES members(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_team_id ON members(team_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_member_id ON expenditures(member_id);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create policies for members
CREATE POLICY "Enable all access for members" ON members
  FOR ALL USING (true);

-- Update the get_team_summary function to work with member budgets
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