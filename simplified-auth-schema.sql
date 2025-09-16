-- Sistema de autenticación simplificado por número de celular
-- Ejecutar en SQL Editor de Supabase

-- Eliminar tabla anterior si existe y recrear
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Crear nueva tabla de usuarios simplificada
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'client' CHECK (user_type IN ('client', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear tabla de citas actualizada
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  service_id TEXT REFERENCES services(id),
  service_name TEXT NOT NULL,
  service_duration INTEGER NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear usuario administrador Dany Vasquez
INSERT INTO users (phone, first_name, last_name, user_type) VALUES 
('42243067', 'Dany', 'Vasquez', 'admin');

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Políticas de seguridad para appointments
CREATE POLICY "Users can view appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all appointments" ON appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = client_id OR users.user_type = 'admin')
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);