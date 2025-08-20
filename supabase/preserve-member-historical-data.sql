-- Migration to preserve expenditure records when members are deleted
-- Member names should be preserved in expenditures even after member deletion

-- Step 1: Check if historical columns already exist (from previous migration)
-- If not, add them
ALTER TABLE expenditures 
ADD COLUMN IF NOT EXISTS team_name_historical TEXT,
ADD COLUMN IF NOT EXISTS member_name_historical TEXT;

-- Step 2: Update existing expenditures with current member and team names
-- This ensures we have historical data for all existing records
UPDATE expenditures 
SET 
  team_name_historical = COALESCE(team_name_historical, (SELECT name FROM teams WHERE teams.id = expenditures.team_id)),
  member_name_historical = COALESCE(member_name_historical, (SELECT name FROM members WHERE members.id = expenditures.member_id))
WHERE team_name_historical IS NULL OR member_name_historical IS NULL;

-- Step 3: The constraint for members -> expenditures is already set to ON DELETE SET NULL
-- This means when a member is deleted, expenditures.member_id becomes NULL
-- But we keep the historical name, so we can still display who made the expense

-- Step 4: Update the trigger function to always populate historical names
CREATE OR REPLACE FUNCTION update_expenditure_historical_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Always get team name when inserting/updating
    IF NEW.team_id IS NOT NULL THEN
        SELECT name INTO NEW.team_name_historical 
        FROM teams 
        WHERE id = NEW.team_id;
    END IF;
    
    -- Always get member name when inserting/updating (if member_id is provided)
    IF NEW.member_id IS NOT NULL THEN
        SELECT name INTO NEW.member_name_historical 
        FROM members 
        WHERE id = NEW.member_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_update_expenditure_historical_names ON expenditures;
CREATE TRIGGER trigger_update_expenditure_historical_names
    BEFORE INSERT OR UPDATE ON expenditures
    FOR EACH ROW
    EXECUTE FUNCTION update_expenditure_historical_names();

-- Step 6: Test the historical preservation
-- Show some expenditures with their historical data
SELECT 
    e.id,
    e.team_id,
    e.member_id,
    e.team_name_historical,
    e.member_name_historical,
    e.description,
    e.amount,
    e.date,
    t.name as current_team_name,
    m.name as current_member_name
FROM expenditures e
LEFT JOIN teams t ON e.team_id = t.id
LEFT JOIN members m ON e.member_id = m.id
ORDER BY e.date DESC
LIMIT 10; 