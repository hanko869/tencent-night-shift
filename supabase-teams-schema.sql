-- Create teams table for budget management
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  budget INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(10) NOT NULL DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default teams
INSERT INTO teams (id, name, budget, color) VALUES
  ('1', 'Chen Long', 9800, '#3b82f6'),
  ('2', '李行舟', 8400, '#10b981'),
  ('3', '天意', 8400, '#f59e0b'),
  ('4', '沉浮', 5600, '#ef4444')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies for teams table
-- Allow read access to all users
CREATE POLICY "Enable read access for all users" ON teams
  FOR SELECT USING (true);

-- Allow insert for all users (you can restrict this later)
CREATE POLICY "Enable insert for all users" ON teams
  FOR INSERT WITH CHECK (true);

-- Allow update for all users (you can restrict this later)  
CREATE POLICY "Enable update for all users" ON teams
  FOR UPDATE USING (true);

-- Allow delete for all users (you can restrict this later)
CREATE POLICY "Enable delete for all users" ON teams
  FOR DELETE USING (true);

-- Comment on table
COMMENT ON TABLE teams IS 'Teams with their budget allocations and colors'; 