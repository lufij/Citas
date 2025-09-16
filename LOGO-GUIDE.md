# Guía para Cambiar Logo de Barbería Dany

## 📁 Pasos para personalizar tu logo:

### 1. Preparar tu logo
- Formato recomendado: PNG con fondo transparente
- Tamaño mínimo: 512x512 píxeles
- Guárdalo como: `public/logo-barberia.png`

### 2. Actualizar el componente BarberLogo
En `src/components/BarberLogo.tsx`, reemplaza la línea comentada:

```tsx
// Cambiar esta línea:
<Scissors className={sizes[size]} />

// Por esta:
<img 
  src="/logo-barberia.png" 
  alt="Barbería Dany" 
  className={`${sizes[size]} object-contain`} 
/>
```

### 3. Generar iconos PWA automáticamente
Ejecuta en la terminal:

```bash
# Si tienes tu logo en public/logo-barberia.png
npx pwa-asset-generator ./public/logo-barberia.png ./public --icon-only --favicon --opaque false --padding "10%" --background "#10b981"

# Renombrar los archivos generados
move "public\manifest-icon-192.maskable.png" "public\pwa-192x192.png"
move "public\manifest-icon-512.maskable.png" "public\pwa-512x512.png"  
move "public\apple-icon-180.png" "public\apple-touch-icon.png"
move "public\favicon-196.png" "public\favicon.ico"
```

### 4. Los iconos se aplicarán automáticamente en:
- ✅ Pantalla de login
- ✅ Icono de la app en el celular  
- ✅ Favicon del navegador
- ✅ Apple touch icon para iOS

### 5. Opcional: Cambiar colores
En `vite.config.ts` puedes cambiar:
- `theme_color`: Color de la barra de estado
- `background_color`: Color de fondo de la app

¿Tienes tu logo listo? ¡Súbelo y seguimos!