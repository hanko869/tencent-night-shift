-- Check if any expenditures exist in the database
SELECT COUNT(*) as total_expenditures FROM expenditures;

-- Check all expenditures (including deleted team references)
SELECT 
    id,
    team_id,
    member_id,
    team_name_historical,
    member_name_historical,
    description,
    amount,
    date,
    created_at
FROM expenditures
ORDER BY date DESC;

-- Check if teams table has any data
SELECT COUNT(*) as total_teams FROM teams;
SELECT * FROM teams;

-- Check if members table has any data  
SELECT COUNT(*) as total_members FROM members;
SELECT * FROM members; 