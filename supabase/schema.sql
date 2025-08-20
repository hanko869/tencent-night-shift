-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create teams table (optional, using hardcoded data in app)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  budget INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenditures table
CREATE TABLE IF NOT EXISTS expenditures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenditures_team_id ON expenditures(team_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_date ON expenditures(date);
CREATE INDEX IF NOT EXISTS idx_expenditures_created_at ON expenditures(created_at);

-- Insert default teams with Chinese names
INSERT INTO teams (id, name, budget, color) VALUES
  ('1', 'Chen Long', 9800, '#3b82f6'),
  ('2', '李行舟', 8400, '#10b981'),
  ('3', '天意', 8400, '#f59e0b'),
  ('4', '沉浮', 5600, '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies for expenditures (allow all operations for now)
CREATE POLICY "Enable all access for expenditures" ON expenditures
  FOR ALL USING (true);

-- Create policies for teams (read-only)
CREATE POLICY "Enable read access for teams" ON teams
  FOR SELECT USING (true);

-- Create a function to get team expenditure summary
CREATE OR REPLACE FUNCTION get_team_summary()
RETURNS TABLE (
  team_id TEXT,
  team_name TEXT,
  budget INTEGER,
  total_spent DECIMAL,
  remaining DECIMAL,
  percentage_used DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id::TEXT as team_id,
    t.name as team_name,
    t.budget,
    COALESCE(SUM(e.amount), 0) as total_spent,
    t.budget - COALESCE(SUM(e.amount), 0) as remaining,
    CASE 
      WHEN t.budget > 0 THEN (COALESCE(SUM(e.amount), 0) / t.budget * 100)
      ELSE 0
    END as percentage_used
  FROM teams t
  LEFT JOIN expenditures e ON t.id::TEXT = e.team_id
  GROUP BY t.id, t.name, t.budget
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql; 