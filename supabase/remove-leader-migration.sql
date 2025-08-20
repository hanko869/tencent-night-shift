-- Migration to remove team leader system
-- All members will have a fixed budget of 1400

-- First, update all existing leaders to have budget of 1400
UPDATE members 
SET budget = 1400 
WHERE is_leader = true;

-- Remove is_leader column from members table
ALTER TABLE members 
DROP COLUMN IF EXISTS is_leader;

-- Update the get_member_summary function to remove leader logic
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

-- Update the member_spending_view to remove leader logic
DROP VIEW IF EXISTS member_spending_view;
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