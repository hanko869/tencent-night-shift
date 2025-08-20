-- Team Budget System Migration
-- This migration implements team-based budgets where member budgets are calculated dynamically

-- First, make sure teams table has budget column (nullable for unlimited budgets)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS budget DECIMAL DEFAULT NULL;

-- Remove budget column from members table since it will be calculated dynamically
-- But first preserve the old data for reference
ALTER TABLE members ADD COLUMN IF NOT EXISTS legacy_budget DECIMAL DEFAULT NULL;
UPDATE members SET legacy_budget = budget WHERE budget IS NOT NULL;

-- Drop the budget column from members (we'll calculate it dynamically)
ALTER TABLE members DROP COLUMN IF EXISTS budget;

-- Update the get_member_summary function to calculate budget from team
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
    CASE 
      WHEN t.budget IS NOT NULL THEN 
        (t.budget / GREATEST(team_member_count.member_count, 1))
      ELSE NULL 
    END as budget,
    COALESCE(SUM(e.amount), 0) as total_spent,
    CASE 
      WHEN t.budget IS NOT NULL THEN 
        ((t.budget / GREATEST(team_member_count.member_count, 1)) - COALESCE(SUM(e.amount), 0))
      ELSE NULL
    END as remaining,
    CASE 
      WHEN t.budget IS NOT NULL AND t.budget > 0 THEN 
        (COALESCE(SUM(e.amount), 0) / (t.budget / GREATEST(team_member_count.member_count, 1)) * 100)
      ELSE NULL 
    END as percentage_used
  FROM members m
  LEFT JOIN teams t ON m.team_id = t.id
  LEFT JOIN (
    SELECT team_id, COUNT(*) as member_count
    FROM members
    GROUP BY team_id
  ) team_member_count ON m.team_id = team_member_count.team_id
  LEFT JOIN expenditures e ON m.id = e.member_id 
    AND EXTRACT(YEAR FROM e.date::date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM e.date::date) = EXTRACT(MONTH FROM CURRENT_DATE)
  GROUP BY m.id, m.name, m.team_id, t.name, t.budget, team_member_count.member_count
  ORDER BY m.name;
END;
$$ LANGUAGE plpgsql;

-- Recreate the member_spending_view
DROP VIEW IF EXISTS member_spending_view;

CREATE VIEW member_spending_view AS
SELECT * FROM get_member_summary();

-- Create a function to get team budget summary
CREATE OR REPLACE FUNCTION get_team_summary()
RETURNS TABLE (
  team_id VARCHAR,
  team_name VARCHAR,
  team_budget DECIMAL,
  member_count INTEGER,
  individual_budget DECIMAL,
  total_spent DECIMAL,
  remaining DECIMAL,
  percentage_used DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.budget,
    COALESCE(team_counts.member_count, 0) as member_count,
    CASE 
      WHEN t.budget IS NOT NULL AND team_counts.member_count > 0 THEN 
        (t.budget / team_counts.member_count)
      ELSE NULL 
    END as individual_budget,
    COALESCE(team_spending.total_spent, 0) as total_spent,
    CASE 
      WHEN t.budget IS NOT NULL THEN 
        (t.budget - COALESCE(team_spending.total_spent, 0))
      ELSE NULL
    END as remaining,
    CASE 
      WHEN t.budget IS NOT NULL AND t.budget > 0 THEN 
        (COALESCE(team_spending.total_spent, 0) / t.budget * 100)
      ELSE NULL 
    END as percentage_used
  FROM teams t
  LEFT JOIN (
    SELECT team_id, COUNT(*) as member_count
    FROM members
    GROUP BY team_id
  ) team_counts ON t.id = team_counts.team_id
  LEFT JOIN (
    SELECT 
      m.team_id,
      SUM(e.amount) as total_spent
    FROM members m
    LEFT JOIN expenditures e ON m.id = e.member_id 
      AND EXTRACT(YEAR FROM e.date::date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM e.date::date) = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY m.team_id
  ) team_spending ON t.id = team_spending.team_id
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql; 