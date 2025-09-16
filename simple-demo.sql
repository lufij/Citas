-- Script simplificado para crear usuarios demo
-- Ejecutar en SQL Editor de Supabase

-- Primero habilitamos la inserción manual en auth.users (temporal)
-- NOTA: Solo ejecutar en desarrollo, nunca en producción

-- Crear usuario cliente demo
INSERT INTO profiles (id, name, user_type, phone) VALUES 
(gen_random_uuid(), 'Cliente Demo', 'client', '555-1234');

-- Crear usuario admin demo
INSERT INTO profiles (id, name, user_type, phone) VALUES 
(gen_random_uuid(), 'Administrador Demo', 'admin', '555-5678');

-- Los usuarios se crearán automáticamente cuando usen el registro
-- con las credenciales: cliente@demo.com / demo123 y admin@demo.com / admin123