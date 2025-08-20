-- Migration to remove budget limits from members
-- Members will have unlimited budgets, progress bars will just show spending amounts

-- Step 1: Set all member budgets to NULL (unlimited)
UPDATE members 
SET budget = NULL;

-- Step 2: Update the budget column to allow NULL values (remove NOT NULL constraint if it exists)
ALTER TABLE members 
ALTER COLUMN budget DROP NOT NULL;

-- Step 3: Update the get_member_summary function to handle unlimited budgets
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
    NULL::DECIMAL as remaining,  -- No remaining since budget is unlimited
    NULL::DECIMAL as percentage_used  -- No percentage since budget is unlimited
  FROM members m
  JOIN teams t ON m.team_id = t.id
  LEFT JOIN expenditures e ON m.id::TEXT = e.member_id
  GROUP BY m.id, m.name, m.team_id, t.name, m.budget
  ORDER BY t.name, m.name;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update the member_spending_view to handle unlimited budgets
DROP VIEW IF EXISTS member_spending_view;
CREATE VIEW member_spending_view AS
SELECT 
  m.id as member_id,
  m.name as member_name,
  m.team_id,
  t.name as team_name,
  m.budget,
  COALESCE(SUM(e.amount), 0) as total_spent,
  NULL::DECIMAL as remaining,  -- No remaining since budget is unlimited
  NULL::DECIMAL as percentage_used  -- No percentage since budget is unlimited
FROM members m
JOIN teams t ON m.team_id = t.id
LEFT JOIN expenditures e ON m.id::TEXT = e.member_id
GROUP BY m.id, m.name, m.team_id, t.name, m.budget;

-- Step 5: Verify the changes
SELECT 
    id,
    name,
    team_id,
    budget,
    created_at
FROM members
ORDER BY name; 