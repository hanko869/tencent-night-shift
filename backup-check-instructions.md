# Supabase Backup Recovery Instructions

## Method 1: Dashboard Check
1. Go to https://supabase.com/dashboard
2. Select your BudgetTracker project
3. Navigate to **Settings** → **Database**
4. Look for **Backups** or **Point-in-time Recovery** section
5. Check available backup dates/times

## Method 2: CLI Check (if you have Supabase CLI)
```bash
# Check if you have supabase CLI
supabase --version

# If not installed, install it:
npm install -g supabase

# Login and check project
supabase login
supabase projects list
supabase db dump --project-ref YOUR_PROJECT_ID
```

## Method 3: Check Supabase Plan Features
- **Free Plan**: Limited backup retention (usually 7 days)
- **Pro Plan**: Point-in-time recovery up to 7 days
- **Team/Enterprise**: Longer retention periods

## What to Look For:
1. **Automatic backups** from before you deleted the teams
2. **Point-in-time recovery** to restore to a specific timestamp
3. **SQL dump** files you might have created manually

## If Backups Are Available:
- Look for a backup from before the team deletion
- Use Supabase's restore feature
- Or download the backup and restore specific tables

## If No Backups Available:
We'll need to recreate the data structure and you'll need to re-enter the expenditure data manually. 