-- Fix: Add member_id column to expenditures table if it doesn't exist
ALTER TABLE public.expenditures 
ADD COLUMN IF NOT EXISTS member_id TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_expenditures_member_id ON public.expenditures(member_id);

-- Optional: Add foreign key constraint to ensure member_id references valid members
-- (Only if you want to enforce referential integrity)
-- ALTER TABLE public.expenditures 
-- ADD CONSTRAINT fk_expenditures_member_id 
-- FOREIGN KEY (member_id) 
-- REFERENCES public.members(id) 
-- ON DELETE SET NULL;
