-- Crear usuarios demo en Supabase
-- EJECUTAR EN SQL EDITOR de Supabase

-- Usuario Cliente Demo
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'cliente@demo.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Cliente Demo", "user_type": "client"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Usuario Admin Demo  
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@demo.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Administrador Demo", "user_type": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Crear perfiles de los usuarios demo
-- Nota: Los IDs deben coincidir con los usuarios creados arriba
-- Obten los IDs con: SELECT id, email FROM auth.users WHERE email IN ('cliente@demo.com', 'admin@demo.com');

-- Una vez que tengas los IDs, ejecuta:
-- INSERT INTO profiles (id, name, user_type, phone) VALUES 
-- ('ID_DEL_CLIENTE', 'Cliente Demo', 'client', '555-1234'),
-- ('ID_DEL_ADMIN', 'Administrador Demo', 'admin', '555-5678');