import { supabase } from '../lib/supabase'
import type { Appointment } from '../lib/supabase'

export interface CreateAppointmentData {
  client_id: string
  client_name: string
  date: string
  time: string
  service_id: string
  service_name: string
  service_duration: number
  service_price: number
  notes?: string
}

export class AppointmentService {
  // Obtener todas las citas
  static async getAppointments(): Promise<{ appointments: Appointment[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (error) {
        return { appointments: [], error: error.message }
      }

      return { appointments: data || [], error: null }
    } catch (error) {
      return { appointments: [], error: 'Error de conexión' }
    }
  }

  // Obtener citas por cliente
  static async getAppointmentsByClient(clientId: string): Promise<{ appointments: Appointment[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (error) {
        return { appointments: [], error: error.message }
      }

      return { appointments: data || [], error: null }
    } catch (error) {
      return { appointments: [], error: 'Error de conexión' }
    }
  }

  // Obtener citas por fecha
  static async getAppointmentsByDate(date: string): Promise<{ appointments: Appointment[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', date)
        .order('time', { ascending: true })

      if (error) {
        return { appointments: [], error: error.message }
      }

      return { appointments: data || [], error: null }
    } catch (error) {
      return { appointments: [], error: 'Error de conexión' }
    }
  }

  // Crear cita
  static async createAppointment(appointmentData: CreateAppointmentData): Promise<{ appointment: Appointment | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single()

      if (error) {
        return { appointment: null, error: error.message }
      }

      return { appointment: data, error: null }
    } catch (error) {
      return { appointment: null, error: 'Error de conexión' }
    }
  }

  // Actualizar cita
  static async updateAppointment(id: number, updates: Partial<Appointment>): Promise<{ appointment: Appointment | null; error: string | null }> {
    console.log('AppointmentService.updateAppointment llamado:', { id, updates });
    
    try {
      // Validar que el ID sea válido
      if (!id || id <= 0) {
        console.error('ID de cita inválido:', id);
        return { appointment: null, error: 'ID de cita inválido' };
      }

      const updateData = { 
        ...updates, 
        updated_at: new Date().toISOString() 
      };
      
      // Si se está completando la cita, agregar la fecha de completado
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      console.log('Datos a actualizar:', updateData);

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      console.log('Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('Error de Supabase:', error);
        return { appointment: null, error: error.message };
      }

      if (!data) {
        console.error('No se recibieron datos de la actualización');
        return { appointment: null, error: 'No se encontró la cita para actualizar' };
      }

      console.log('Cita actualizada exitosamente:', data);
      return { appointment: data, error: null };
    } catch (error) {
      console.error('Error en updateAppointment:', error);
      return { appointment: null, error: 'Error de conexión con la base de datos' };
    }
  }

  // Cancelar cita
  static async cancelAppointment(id: number): Promise<{ appointment: Appointment | null; error: string | null }> {
    return this.updateAppointment(id, { status: 'cancelled' })
  }

  // Completar cita
  static async completeAppointment(id: number): Promise<{ appointment: Appointment | null; error: string | null }> {
    return this.updateAppointment(id, { 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
  }

  // Marcar cita en progreso
  static async startAppointment(id: number): Promise<{ appointment: Appointment | null; error: string | null }> {
    return this.updateAppointment(id, { status: 'in-progress' })
  }

  // Verificar disponibilidad de horario
  static async checkTimeSlotAvailability(date: string, time: string, duration: number): Promise<{ available: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('time, service_duration')
        .eq('date', date)
        .eq('status', 'scheduled')

      if (error) {
        return { available: false, error: error.message }
      }

      // Lógica para verificar conflictos de horarios
      const requestedStart = new Date(`2000-01-01T${time}:00`)
      const requestedEnd = new Date(requestedStart.getTime() + duration * 60000)

      const hasConflict = data?.some(appointment => {
        const appointmentStart = new Date(`2000-01-01T${appointment.time}:00`)
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.service_duration * 60000)

        return (requestedStart < appointmentEnd && requestedEnd > appointmentStart)
      })

      return { available: !hasConflict, error: null }
    } catch (error) {
      return { available: false, error: 'Error de conexión' }
    }
  }

  // Suscribirse a cambios en tiempo real
  static subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    return supabase
      .channel('appointments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments' 
        }, 
        async () => {
          const { appointments } = await this.getAppointments()
          callback(appointments)
        }
      )
      .subscribe()
  }
}