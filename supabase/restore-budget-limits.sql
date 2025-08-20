-- Restore $1000 budget limits for all members
-- This script sets all members to have a $1000 budget limit

-- Update all existing members to have $1000 budget
UPDATE members SET budget = 1000 WHERE budget IS NULL OR budget = 0;

-- Alter budget column to have NOT NULL constraint with default value
ALTER TABLE members ALTER COLUMN budget SET NOT NULL;
ALTER TABLE members ALTER COLUMN budget SET DEFAULT 1000;

-- Drop and recreate the get_member_summary function to handle budget calculations
DROP FUNCTION IF EXISTS get_member_summary();

CREATE OR REPLACE FUNCTION get_member_summary()
RETURNS TABLE (
  member_id VARCHAR,
  member_name VARCHAR,
  team_id VARCHAR,
  team_name VARCHAR,
  budget DECIMAL,
  total_spent DECIMAL,
  remaining DECIMAL,
  percentage_used DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.team_id,
    t.name as team_name,
    m.budget,
    COALESCE(SUM(e.amount), 0) as total_spent,
    (m.budget - COALESCE(SUM(e.amount), 0)) as remaining,
    CASE 
      WHEN m.budget > 0 THEN (COALESCE(SUM(e.amount), 0) / m.budget * 100)
      ELSE 0 
    END as percentage_used
  FROM members m
  LEFT JOIN teams t ON m.team_id = t.id
  LEFT JOIN expenditures e ON m.id = e.member_id 
    AND EXTRACT(YEAR FROM e.date::date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM e.date::date) = EXTRACT(MONTH FROM CURRENT_DATE)
  GROUP BY m.id, m.name, m.team_id, t.name, m.budget
  ORDER BY m.name;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the member_spending_view
DROP VIEW IF EXISTS member_spending_view;

CREATE VIEW member_spending_view AS
SELECT * FROM get_member_summary();

-- Enable RLS on the view (if needed)
-- ALTER VIEW member_spending_view ENABLE ROW LEVEL SECURITY; 