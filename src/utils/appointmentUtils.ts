import { toDateString } from './dateUtils';

export interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  date: string;
  time: string;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

/**
 * Convierte un string de hora a minutos
 * Ejemplo: "09:30" -> 570 minutos
 */
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convierte minutos a string de hora
 * Ejemplo: 570 -> "09:30"
 */
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Redondea una hora al siguiente slot de 30 minutos
 * Ejemplo: "09:15" -> "09:30", "09:35" -> "10:00"
 */
const roundToNextSlot = (timeStr: string): string => {
  const minutes = timeToMinutes(timeStr);
  const remainder = minutes % 30;
  
  if (remainder === 0) {
    return timeStr;
  }
  
  const nextSlot = minutes + (30 - remainder);
  return minutesToTime(nextSlot);
};

/**
 * Calcula cuántos clientes hay antes de una hora específica en el día
 */
export const getClientsBeforeTime = (
  appointments: Appointment[],
  selectedDate: Date,
  targetTime: string
): number => {
  const dateStr = toDateString(selectedDate);
  const targetMinutes = timeToMinutes(targetTime);
  
  return appointments.filter(apt => 
    apt.date === dateStr && 
    (apt.status === 'scheduled' || apt.status === 'in-progress') &&
    timeToMinutes(apt.time) < targetMinutes
  ).length;
};

/**
 * Calcula el tiempo total de espera antes de una hora específica
 */
export const getWaitTimeBeforeTime = (
  appointments: Appointment[],
  selectedDate: Date,
  targetTime: string
): number => {
  const dateStr = toDateString(selectedDate);
  const targetMinutes = timeToMinutes(targetTime);
  
  const appointmentsBefore = appointments.filter(apt => 
    apt.date === dateStr && 
    (apt.status === 'scheduled' || apt.status === 'in-progress') &&
    timeToMinutes(apt.time) < targetMinutes
  );
  
  return appointmentsBefore.reduce((total, apt) => total + ((apt as any).service_duration || apt.service?.duration || 30), 0);
};

/**
 * Calcula la próxima hora disponible basándose en las citas existentes
 */
export const calculateNextAvailableTime = (
  appointments: Appointment[], 
  selectedDate: Date,
  currentTime?: Date
): string => {
  const dateStr = toDateString(selectedDate);
  const now = currentTime || new Date();
  
  console.log('=== calculateNextAvailableTime DEBUG ===');
  console.log('Fecha seleccionada:', dateStr);
  console.log('Fecha de hoy:', toDateString(now));
  console.log('¿Es hoy?:', dateStr === toDateString(now));
  
  // Si la fecha seleccionada es hoy, usar la hora actual como base
  // Si es una fecha futura, empezar desde las 9:00 AM
  let baseTime: string;
  
  if (dateStr === toDateString(now)) {
    // Es hoy, usar hora actual
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    baseTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    console.log('Es hoy - Hora actual del sistema:', baseTime);
    
    // Si es antes de las 9 AM, empezar a las 9 AM
    if (timeToMinutes(baseTime) < timeToMinutes('09:00')) {
      baseTime = '09:00';
      console.log('Antes de las 9 AM, usando:', baseTime);
    }
    // Si es después de las 6:30 PM, no hay horarios disponibles hoy
    else if (timeToMinutes(baseTime) >= timeToMinutes('18:30')) {
      console.log('Después de las 18:30, devolviendo 09:00 para mañana');
      return '09:00'; // Retornar primera hora del día siguiente
    }
    console.log('Hora base calculada para hoy:', baseTime);
  } else {
    // Es una fecha futura, empezar a las 9:00 AM
    baseTime = '09:00';
    console.log('Es fecha futura, usando:', baseTime);
  }
  
  // Obtener citas del día seleccionado que están programadas o en progreso
  const dayAppointments = appointments.filter(apt => 
    apt.date === dateStr && 
    (apt.status === 'scheduled' || apt.status === 'in-progress')
  );
  
  // Si no hay citas ese día, redondear la hora base al siguiente slot
  if (dayAppointments.length === 0) {
    return roundToNextSlot(baseTime);
  }
  
  // Calcular el tiempo total que se necesita para completar todas las citas pendientes
  let totalDuration = 0;
  let latestEndTime = timeToMinutes(baseTime);
  
  // Encontrar la hora más tarde en que terminaría una cita
  dayAppointments.forEach(apt => {
    const aptStartTime = timeToMinutes(apt.time);
    const aptDuration = (apt as any).service_duration || apt.service?.duration || 30;
    const aptEndTime = aptStartTime + aptDuration;
    
    if (aptEndTime > latestEndTime) {
      latestEndTime = aptEndTime;
    }
    
    // Si la cita está programada para después de la hora base, sumar su duración
    if (aptStartTime >= timeToMinutes(baseTime)) {
      const aptDuration = (apt as any).service_duration || apt.service?.duration || 30;
      totalDuration += aptDuration;
    }
  });
  
  // La próxima hora disponible es la hora base + tiempo total de citas pendientes
  // O la hora más tarde en que termina una cita, lo que sea mayor
  const calculatedTime = Math.max(
    timeToMinutes(baseTime) + totalDuration,
    latestEndTime
  );
  
  const nextAvailableTime = minutesToTime(calculatedTime);
  console.log('Hora calculada (antes de verificar horario laboral):', nextAvailableTime);
  
  // Verificar que esté dentro del horario laboral (9:00 AM - 6:30 PM)
  if (timeToMinutes(nextAvailableTime) >= timeToMinutes('18:30')) {
    console.log('Hora muy tarde, devolviendo 09:00');
    return '09:00'; // Si es muy tarde, retornar primera hora del día siguiente
  }
  
  const finalTime = roundToNextSlot(nextAvailableTime);
  console.log('Hora final sugerida:', finalTime);
  return finalTime;
};

/**
 * Genera los slots de tiempo disponibles para un día específico
 */
export const getAvailableTimeSlots = (
  appointments: Appointment[],
  selectedDate: Date
): string[] => {
  console.log('🔍 [getAvailableTimeSlots] Starting calculation');
  console.log('Selected date:', selectedDate);
  console.log('Appointments received:', appointments.length);
  
  const allSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];
  
  const dateStr = toDateString(selectedDate);
  const now = new Date();
  const nowDateStr = toDateString(now);
  
  console.log('Date string:', dateStr);
  console.log('Now date string:', nowDateStr);
  console.log('Is today?', dateStr === nowDateStr);
  
  // Filtrar slots que ya pasaron si es hoy
  let availableSlots = allSlots;
  if (dateStr === nowDateStr) {
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    console.log('Current time minutes:', currentTimeMinutes);
    console.log('Current time:', now.toLocaleTimeString());
    
    availableSlots = allSlots.filter(slot => {
      const slotMinutes = timeToMinutes(slot);
      const isAvailable = slotMinutes > currentTimeMinutes;
      console.log(`Slot ${slot} (${slotMinutes}min) - Available: ${isAvailable}`);
      return isAvailable;
    });
    
    console.log('Available slots after time filter:', availableSlots);
  } else {
    console.log('Future date - all slots initially available');
  }
  
  // Filtrar slots que están ocupados
  const occupiedSlots = appointments
    .filter(apt => {
      const matches = apt.date === dateStr && 
        (apt.status === 'scheduled' || apt.status === 'in-progress');
      console.log(`Appointment ${apt.id}: date=${apt.date}, status=${apt.status}, matches=${matches}`);
      return matches;
    })
    .map(apt => apt.time);
  
  console.log('Occupied slots:', occupiedSlots);
  
  const finalSlots = availableSlots.filter(slot => !occupiedSlots.includes(slot));
  console.log('Final available slots:', finalSlots);
  
  return finalSlots;
};

/**
 * Calcula los minutos restantes hasta una cita específica
 */
export const getMinutesUntilAppointment = (appointment: Appointment, currentTime?: Date): number => {
  const now = currentTime || new Date();
  const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
  
  const diffMs = appointmentDateTime.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Verifica si una cita es para hoy
 */
export const isAppointmentToday = (appointment: Appointment): boolean => {
  const today = toDateString(new Date());
  return appointment.date === today;
};

/**
 * Obtiene las citas de un cliente que están programadas para hoy
 */
export const getTodayAppointmentsForClient = (
  appointments: Appointment[],
  clientId: number
): Appointment[] => {
  const today = toDateString(new Date());
  
  console.log('🔍 getTodayAppointmentsForClient - Buscando citas para cliente:', clientId);
  console.log('🔍 Fecha de hoy:', today);
  console.log('🔍 Total de citas recibidas:', appointments.length);
  
  const filtered = appointments.filter(apt => {
    // Soporte para ambos formatos de campo cliente
    const aptClientId = apt.clientId || (apt as any).client_id;
    const matches = aptClientId == clientId && // Usar == para comparar string vs number
      apt.date === today &&
      apt.status === 'scheduled';
      
    console.log(`🔍 Cita ${apt.id}: client_id=${(apt as any).client_id}, clientId=${apt.clientId}, date=${apt.date}, status=${apt.status}, matches=${matches}`);
    return matches;
  }).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  
  console.log('🔍 Citas encontradas para el cliente:', filtered.length);
  return filtered;
};

/**
 * Obtiene todas las citas programadas para hoy
 */
export const getTodayScheduledAppointments = (appointments: Appointment[]): Appointment[] => {
  const today = toDateString(new Date());
  
  return appointments.filter(apt => 
    apt.date === today &&
    apt.status === 'scheduled'
  ).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
};

/**
 * Verifica si es necesario mostrar una alerta para una cita
 */
export const shouldShowNotification = (
  appointment: Appointment,
  minutesBefore: number,
  notificationKey: string
): boolean => {
  const minutesUntil = getMinutesUntilAppointment(appointment);
  
  // Verificar si está en el rango de tiempo correcto (ej: entre 20-19 min para alerta de 20 min)
  const isInRange = minutesUntil <= minutesBefore && minutesUntil > (minutesBefore - 1);
  
  if (!isInRange) return false;
  
  // Verificar si ya se mostró esta notificación
  const alreadyShown = localStorage.getItem(notificationKey);
  return !alreadyShown;
};

/**
 * Marca una notificación como mostrada
 */
export const markNotificationAsShown = (notificationKey: string): void => {
  localStorage.setItem(notificationKey, 'true');
};

/**
 * Limpia notificaciones antiguas del localStorage
 */
export const cleanOldNotifications = (): void => {
  const keys = Object.keys(localStorage);
  const today = toDateString(new Date());
  
  keys.forEach(key => {
    if (key.startsWith('notification_') && !key.includes(today)) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * Genera una clave única para una notificación
 */
export const generateNotificationKey = (
  appointmentId: number,
  minutesBefore: number,
  type: 'client' | 'admin' = 'client'
): string => {
  const today = toDateString(new Date());
  return `notification_${type}_${appointmentId}_${minutesBefore}min_${today}`;
};

/**
 * Calcula la hora de finalización esperada de una cita
 */
export const getExpectedEndTime = (appointment: Appointment): Date => {
  const startDateTime = new Date(`${appointment.date} ${appointment.time}`);
  const duration = (appointment as any).service_duration || appointment.service?.duration || 30;
  return new Date(startDateTime.getTime() + duration * 60 * 1000);
};

/**
 * Calcula si una cita se completó antes o después del tiempo esperado
 */
export const calculateTimeDeviation = (
  appointment: Appointment,
  completedAt?: Date
): { type: 'early' | 'late' | 'on-time'; minutes: number } => {
  const expectedEndTime = getExpectedEndTime(appointment);
  
  // Usar completedAt del appointment si está disponible, sino usar el parámetro o la fecha actual
  const actualCompletionTime = appointment.completedAt 
    ? new Date(appointment.completedAt)
    : completedAt || new Date();
  
  const diffMs = actualCompletionTime.getTime() - expectedEndTime.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < -2) {
    return { type: 'early', minutes: Math.abs(diffMinutes) };
  } else if (diffMinutes > 2) {
    return { type: 'late', minutes: diffMinutes };
  } else {
    return { type: 'on-time', minutes: 0 };
  }
};

/**
 * Obtiene todas las citas posteriores a una cita dada en el mismo día
 */
export const getSubsequentAppointments = (
  appointments: Appointment[],
  referenceAppointment: Appointment
): Appointment[] => {
  const referenceTimeMinutes = timeToMinutes(referenceAppointment.time);
  
  return appointments.filter(apt => 
    apt.date === referenceAppointment.date &&
    apt.id !== referenceAppointment.id &&
    apt.status === 'scheduled' &&
    timeToMinutes(apt.time) > referenceTimeMinutes
  ).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
};

/**
 * Calcula la nueva hora estimada para una cita basada en adelantos/retrasos
 */
export const calculateAdjustedTime = (
  originalTime: string,
  adjustmentMinutes: number
): string => {
  const originalMinutes = timeToMinutes(originalTime);
  const adjustedMinutes = originalMinutes + adjustmentMinutes;
  
  // Convertir de vuelta a formato HH:MM
  const hours = Math.floor(adjustedMinutes / 60);
  const minutes = adjustedMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Encuentra el próximo slot disponible para una nueva cita
 */
export const findNextAvailableSlot = (
  appointments: Appointment[],
  date: string,
  serviceDuration: number,
  startFromTime: string = '09:00'
): string => {
  const existingAppointments = appointments
    .filter(apt => apt.date === date && apt.status !== 'cancelled')
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  let currentTime = timeToMinutes(startFromTime);
  const endOfDay = timeToMinutes('18:00'); // Asumiendo que la barbería cierra a las 6 PM

  for (const appointment of existingAppointments) {
    const aptStartTime = timeToMinutes(appointment.time);
    const aptDuration = (appointment as any).service_duration || appointment.service?.duration || 30;
    const aptEndTime = aptStartTime + aptDuration;

    // Si hay espacio antes de esta cita
    if (currentTime + serviceDuration <= aptStartTime) {
      break;
    }

    // Mover el tiempo actual después de esta cita
    currentTime = Math.max(currentTime, aptEndTime);
  }

  // Verificar que no se pase del horario de trabajo
  if (currentTime + serviceDuration > endOfDay) {
    return ''; // No hay slots disponibles
  }

  const hours = Math.floor(currentTime / 60);
  const minutes = currentTime % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Valida si un horario está disponible
 */
export const isTimeSlotAvailable = (
  appointments: Appointment[],
  date: string,
  time: string,
  duration: number,
  excludeAppointmentId?: number
): boolean => {
  const newStartTime = timeToMinutes(time);
  const newEndTime = newStartTime + duration;

  const conflictingAppointments = appointments.filter(apt => 
    apt.date === date &&
    apt.status !== 'cancelled' &&
    apt.id !== excludeAppointmentId
  );

  for (const appointment of conflictingAppointments) {
    const existingStartTime = timeToMinutes(appointment.time);
    const existingDuration = (appointment as any).service_duration || appointment.service?.duration || 30;
    const existingEndTime = existingStartTime + existingDuration;

    // Verificar solapamiento
    if (
      (newStartTime < existingEndTime && newEndTime > existingStartTime)
    ) {
      return false;
    }
  }

  return true;
};