import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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