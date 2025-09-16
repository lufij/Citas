-- Verificar y crear solo las tablas y datos faltantes
-- Ejecutar en SQL Editor de Supabase

-- 1. Verificar si existe la tabla services, si no, crearla
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Verificar si existe la tabla appointments, si no, crearla
CREATE TABLE IF NOT EXISTS appointments (
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

-- 3. Insertar servicios básicos si no existen
INSERT INTO services (id, name, description, duration, price, active) 
VALUES 
  ('corte-clasico', 'Corte Clásico', 'Corte de cabello tradicional', 30, 5000.00, true),
  ('corte-moderno', 'Corte Moderno', 'Corte de cabello con estilo contemporáneo', 45, 7000.00, true),
  ('barba', 'Arreglo de Barba', 'Recorte y perfilado de barba', 20, 3000.00, true),
  ('corte-barba', 'Corte + Barba', 'Servicio completo de corte y barba', 60, 9000.00, true),
  ('lavado', 'Lavado', 'Lavado de cabello', 15, 2000.00, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar si el usuario admin existe, si no, crearlo
INSERT INTO users (phone, first_name, last_name, user_type) 
VALUES ('42243067', 'Dany', 'Vasquez', 'admin')
ON CONFLICT (phone) DO NOTHING;

-- 5. Habilitar RLS si no está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas de seguridad (DROP si existen para recrear)
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert themselves" ON users;
CREATE POLICY "Users can insert themselves" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can view appointments" ON appointments;
CREATE POLICY "Users can view appointments" ON appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;
CREATE POLICY "Admins can manage all appointments" ON appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = client_id OR users.user_type = 'admin')
);

DROP POLICY IF EXISTS "Users can view services" ON services;
CREATE POLICY "Users can view services" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.user_type = 'admin')
);

-- 7. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);

-- 8. Mostrar un resumen de lo que se creó
SELECT 'Verificación completada' as mensaje;
SELECT 'Usuarios creados:' as info, count(*) as total FROM users;
SELECT 'Servicios disponibles:' as info, count(*) as total FROM services;
SELECT 'Citas registradas:' as info, count(*) as total FROM appointments;