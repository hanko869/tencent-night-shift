-- Migration to remove team leader system
-- All members will have a fixed budget of 1400

-- First, drop the view that depends on is_leader column
DROP VIEW IF EXISTS member_spending_view;

-- Drop the existing function before recreating it
DROP FUNCTION IF EXISTS get_member_summary();

-- Update all existing leaders to have budget of 1400
UPDATE members 
SET budget = 1400 
WHERE is_leader = true;

-- Now we can safely remove is_leader column from members table
ALTER TABLE members 
DROP COLUMN IF EXISTS is_leader;

-- Create the new get_member_summary function without leader logic
CREATE OR REPLACE FUNCTION get_member_summary()
RETURNS TABLE (
  member_id TEXT,
  member_name TEXT,
  team_id TEXT,
  team_name TEXT,
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
    m.budget,
    COALESCE(SUM(e.amount), 0) as total_spent,
    m.budget - COALESCE(SUM(e.amount), 0) as remaining,
    CASE 
      WHEN m.budget > 0 THEN (COALESCE(SUM(e.amount), 0) / m.budget * 100)
      ELSE 0
    END as percentage_used
  FROM members m
  JOIN teams t ON m.team_id = t.id
  LEFT JOIN expenditures e ON m.id::TEXT = e.member_id
  GROUP BY m.id, m.name, m.team_id, t.name, m.budget
  ORDER BY t.name, m.name;
END;
$$ LANGUAGE plpgsql;

-- Recreate the member_spending_view without leader logic
CREATE VIEW member_spending_view AS
SELECT 
  m.id as member_id,
  m.name as member_name,
  m.team_id,
  t.name as team_name,
  m.budget,
  COALESCE(SUM(e.amount), 0) as total_spent,
  m.budget - COALESCE(SUM(e.amount), 0) as remaining,
  CASE 
    WHEN m.budget > 0 THEN (COALESCE(SUM(e.amount), 0) / m.budget * 100)
    ELSE 0
  END as percentage_used
FROM members m
JOIN teams t ON m.team_id = t.id
LEFT JOIN expenditures e ON m.id::TEXT = e.member_id
GROUP BY m.id, m.name, m.team_id, t.name, m.budget;

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position; 