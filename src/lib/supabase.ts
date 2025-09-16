import { createClient } from '@supabase/supabase-js'

// Configuración robusta con múltiples fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   process.env.VITE_SUPABASE_URL || 
                   'https://demo-mode.supabase.co'
                   
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       process.env.VITE_SUPABASE_ANON_KEY || 
                       'demo-key-fallback'

// Cliente Supabase con configuración segura
let supabase: any = null;

// Mock completo para modo demo
const createMockSupabase = () => ({
  from: (table: string) => ({
    select: (columns?: string) => Promise.resolve({ data: [], error: null }),
    insert: (data: any) => Promise.resolve({ data: null, error: 'Demo mode - no write operations' }),
    update: (data: any) => Promise.resolve({ data: null, error: 'Demo mode - no write operations' }),
    upsert: (data: any) => Promise.resolve({ data: null, error: 'Demo mode - no write operations' }),
    delete: () => Promise.resolve({ data: null, error: 'Demo mode - no write operations' }),
    eq: function(column: string, value: any) { return this; },
    neq: function(column: string, value: any) { return this; },
    gt: function(column: string, value: any) { return this; },
    lt: function(column: string, value: any) { return this; },
    gte: function(column: string, value: any) { return this; },
    lte: function(column: string, value: any) { return this; },
    like: function(column: string, value: any) { return this; },
    ilike: function(column: string, value: any) { return this; },
    is: function(column: string, value: any) { return this; },
    in: function(column: string, values: any[]) { return this; },
    contains: function(column: string, value: any) { return this; },
    order: function(column: string, options?: any) { return this; },
    limit: function(count: number) { return this; },
    range: function(from: number, to: number) { return this; },
    single: function() { return Promise.resolve({ data: null, error: null }); },
    maybeSingle: function() { return Promise.resolve({ data: null, error: null }); }
  }),
  auth: {
    signUp: () => Promise.resolve({ data: null, error: 'Demo mode' }),
    signIn: () => Promise.resolve({ data: null, error: 'Demo mode' }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  }
});

try {
  // Verificar si estamos en modo demo
  const isDemoMode = supabaseUrl.includes('demo') || supabaseAnonKey.includes('demo');
  
  if (!isDemoMode && supabaseUrl && supabaseAnonKey) {
    // Intentar crear cliente real
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase conectado correctamente');
  } else {
    throw new Error('Demo mode activated');
  }
} catch (error) {
  console.warn('🔄 Ejecutando en modo DEMO - Funcionalidad limitada');
  supabase = createMockSupabase();
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