-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE app_role AS ENUM ('admin', 'supervisor', 'coordenador');

CREATE TYPE event_type AS ENUM (
  'Evento',
  'Ação Pontual',
  'Projeto Institucional',
  'Projeto Pedagógico',
  'Expedição Pedagógica',
  'Formação',
  'Festa'
);

CREATE TYPE event_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE auth_type AS ENUM ('local', 'google');

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  auth_type auth_type NOT NULL DEFAULT 'google',
  google_id VARCHAR(255) UNIQUE,
  role app_role NOT NULL DEFAULT 'coordenador',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  event_type event_type NOT NULL,
  status event_status DEFAULT 'pending',
  created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  google_calendar_event_id VARCHAR(255),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_approved_by ON events(approved_by);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Insert admin user (password: admin123 - bcrypt hashed)
-- Hash generated with bcrypt: $2b$10$YourHashHereGenerateWithBcrypt
INSERT INTO users (email, password_hash, full_name, auth_type, role, active)
VALUES (
  'admin@app.local',
  '$2b$10$D9Z5jJzrD8pJ7K9L5M3N2e5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0', -- Placeholder, será gerado no backend
  'Admin User',
  'local',
  'admin',
  true
);

-- Grant permissions
GRANT CONNECT ON DATABASE event_calendar TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
