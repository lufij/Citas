import { createClient } from '@supabase/supabase-js'

// Configuración con fallback para demo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

// Crear cliente con configuración segura
let supabase: any = null;

try {
  // Solo crear cliente real si tenemos las variables de entorno correctas
  if (supabaseUrl !== 'https://demo.supabase.co' && supabaseAnonKey !== 'demo-key') {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } else {
    // Modo demo - cliente mock
    console.warn('🔄 Ejecutando en modo DEMO - Supabase no configurado')
    supabase = {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: 'Demo mode - no database operations' }),
        update: () => ({ data: null, error: 'Demo mode - no database operations' }),
        delete: () => ({ data: null, error: 'Demo mode - no database operations' })
      })
    }
  }
} catch (error) {
  console.warn('⚠️ Error conectando Supabase, usando modo demo')
  supabase = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: 'Demo mode - no database operations' }),
      update: () => ({ data: null, error: 'Demo mode - no database operations' }),
      delete: () => ({ data: null, error: 'Demo mode - no database operations' })
    })
  }
}

export { supabase }

// Tipos para TypeScript
export interface Profile {
  id: string
  name: string
  phone?: string
  user_type: 'client' | 'admin'
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: number
  client_id: string
  client_name: string
  date: string
  time: string
  service_id: string
  service_name: string
  service_duration: number
  service_price: number
  notes?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  created_at: string
  completed_at?: string
  updated_at: string
}