import { supabase } from '../lib/supabase'
import type { Service } from '../lib/supabase'

export class ServiceService {
  // Obtener todos los servicios
  static async getServices(): Promise<{ services: Service[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        return { services: [], error: error.message }
      }

      return { services: data || [], error: null }
    } catch (error) {
      return { services: [], error: 'Error de conexión' }
    }
  }

  // Obtener servicios activos
  static async getActiveServices(): Promise<{ services: Service[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (error) {
        return { services: [], error: error.message }
      }

      return { services: data || [], error: null }
    } catch (error) {
      return { services: [], error: 'Error de conexión' }
    }
  }

  // Crear servicio
  static async createService(service: Omit<Service, 'created_at' | 'updated_at'>): Promise<{ service: Service | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()

      if (error) {
        return { service: null, error: error.message }
      }

      return { service: data, error: null }
    } catch (error) {
      return { service: null, error: 'Error de conexión' }
    }
  }

  // Actualizar servicio
  static async updateService(id: string, updates: Partial<Service>): Promise<{ service: Service | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { service: null, error: error.message }
      }

      return { service: data, error: null }
    } catch (error) {
      return { service: null, error: 'Error de conexión' }
    }
  }

  // Eliminar servicio
  static async deleteService(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      return { error: error?.message || null }
    } catch (error) {
      return { error: 'Error de conexión' }
    }
  }

  // Activar/desactivar servicio
  static async toggleService(id: string, active: boolean): Promise<{ service: Service | null; error: string | null }> {
    return this.updateService(id, { active })
  }
}