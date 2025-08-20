-- Migration to preserve historical expenditure data
-- Teams and members can be deleted, but expenditures should keep historical references

-- Step 1: Add archived flag and historical reference fields to expenditures
ALTER TABLE expenditures 
ADD COLUMN IF NOT EXISTS team_name_historical TEXT,
ADD COLUMN IF NOT EXISTS member_name_historical TEXT;

-- Step 2: Update existing expenditures with historical names
UPDATE expenditures 
SET 
  team_name_historical = (SELECT name FROM teams WHERE teams.id = expenditures.team_id),
  member_name_historical = (SELECT name FROM members WHERE members.id = expenditures.member_id)
WHERE team_name_historical IS NULL OR member_name_historical IS NULL;

-- Step 3: Remove the foreign key constraint that causes cascading deletes on expenditures.team_id
-- First, we need to drop the existing constraint
ALTER TABLE expenditures 
DROP CONSTRAINT IF EXISTS expenditures_team_id_fkey;

-- Add it back without CASCADE (just as a reference, not enforced deletion)
-- This allows expenditures to keep team_id even if team is deleted
ALTER TABLE expenditures 
ADD CONSTRAINT expenditures_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Step 4: The member_id constraint is already ON DELETE SET NULL, which is correct

-- Step 5: Create a function to automatically update historical names when records are created
CREATE OR REPLACE FUNCTION update_expenditure_historical_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Get team name
    SELECT name INTO NEW.team_name_historical 
    FROM teams 
    WHERE id = NEW.team_id;
    
    -- Get member name if member_id is provided
    IF NEW.member_id IS NOT NULL THEN
        SELECT name INTO NEW.member_name_historical 
        FROM members 
        WHERE id = NEW.member_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to automatically populate historical names
DROP TRIGGER IF EXISTS trigger_update_expenditure_historical_names ON expenditures;
CREATE TRIGGER trigger_update_expenditure_historical_names
    BEFORE INSERT OR UPDATE ON expenditures
    FOR EACH ROW
    EXECUTE FUNCTION update_expenditure_historical_names();

-- Step 7: Update the get_expenditures view/function to use historical names when current ones are not available
-- This ensures the UI can display historical data even after teams/members are deleted

-- Verify the changes
SELECT 
    e.id,
    e.team_id,
    e.member_id,
    e.team_name_historical,
    e.member_name_historical,
    e.description,
    e.amount,
    e.date
FROM expenditures e
ORDER BY e.date DESC
LIMIT 5; 