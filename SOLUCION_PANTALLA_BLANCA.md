# 🔧 SOLUCIÓN AL PROBLEMA DE PANTALLA BLANCA

## 🚨 PROBLEMA IDENTIFICADO
La aplicación se queda en pantalla blanca porque **FALTAN LAS CREDENCIALES DE SUPABASE**.

## ✅ SOLUCIÓN PASO A PASO:

### 1. **Configurar Variables de Entorno**

1. **Ve a tu proyecto de Supabase**: https://supabase.com/dashboard
2. **Encuentra tu proyecto "Barberia Dany"**
3. **Ve a Settings > API**
4. **Copia estos dos valores**:
   - **Project URL** (ejemplo: `https://abcd1234.supabase.co`)
   - **anon public key** (ejemplo: `eyJhbGciOiJIUzI1NiIs...`)

### 2. **Crear archivo .env**

1. **Abre el archivo `.env`** en la carpeta raíz del proyecto
2. **Reemplaza los valores**:
```bash
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs_tu_clave_completa_aqui
```

### 3. **Ejecutar el Schema SQL**

1. **Ve a Supabase Dashboard > SQL Editor**
2. **Ejecuta el archivo `simplified-auth-schema.sql`** (está en la carpeta del proyecto)
3. **Verifica** que se crearon las tablas: `users`, `appointments`, `services`

### 4. **Reiniciar la Aplicación**

```bash
# Detener el servidor si está corriendo
Ctrl + C

# Reiniciar
npm run dev
```

## 🎯 **VERIFICAR QUE FUNCIONA:**

1. **Abrir** http://localhost:3000/
2. **Si ves el login** = ✅ Configuración correcta
3. **Si sigue en blanco** = ❌ Verifica las credenciales

### 📱 **Credenciales de Prueba:**
- **Administrador**: Teléfono `42243067`, Nombre `Dany Vasquez`

## 🔍 **SI AÚN NO FUNCIONA:**

1. **Abre la consola del navegador** (F12)
2. **Ve la pestaña Console**
3. **Busca errores** que empiecen con "Missing Supabase..."
4. **Verifica** que las URLs en .env NO tengan espacios ni comillas extra

## 📋 **CHECKLIST:**

- [ ] Archivo .env creado
- [ ] Variables VITE_SUPABASE_URL configurada
- [ ] Variable VITE_SUPABASE_ANON_KEY configurada  
- [ ] Schema SQL ejecutado en Supabase
- [ ] Servidor reiniciado
- [ ] Navegador refrescado

¡Con estos pasos la aplicación debería funcionar perfectamente! 🎉