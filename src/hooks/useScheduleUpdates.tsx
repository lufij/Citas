import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import {
  calculateTimeDeviation,
  getSubsequentAppointments,
  calculateAdjustedTime,
  type Appointment
} from '../utils/appointmentUtils';

interface UseScheduleUpdatesOptions {
  appointments: Appointment[];
  onScheduleChange?: (affectedAppointments: Appointment[], adjustment: { type: 'early' | 'late'; minutes: number }) => void;
}

export function useScheduleUpdates({ appointments, onScheduleChange }: UseScheduleUpdatesOptions) {
  const previousAppointmentsRef = useRef<Appointment[]>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      previousAppointmentsRef.current = appointments;
      isInitializedRef.current = true;
      return;
    }

    // Detectar citas que cambiaron de estado a 'completed'
    const previousMap = new Map(previousAppointmentsRef.current.map(apt => [apt.id, apt]));
    const newlyCompleted = appointments.filter(apt => {
      const previous = previousMap.get(apt.id);
      return apt.status === 'completed' && previous && previous.status !== 'completed';
    });

    // Procesar cada cita completada para calcular desviaciones de tiempo
    newlyCompleted.forEach(completedAppointment => {
      const timeDeviation = calculateTimeDeviation(completedAppointment);
      
      if (timeDeviation.type !== 'on-time') {
        const subsequentAppointments = getSubsequentAppointments(appointments, completedAppointment);
        
        if (subsequentAppointments.length > 0) {
          // Calcular el ajuste para las citas siguientes
          const adjustmentMinutes = timeDeviation.type === 'early' 
            ? -timeDeviation.minutes 
            : timeDeviation.minutes;

          // Notificar a clientes afectados
          subsequentAppointments.forEach(appointment => {
            const newTime = calculateAdjustedTime(appointment.time, adjustmentMinutes);
            
            if (timeDeviation.type === 'early') {
              toast.success('¡Buenas noticias! Tu cita se adelantó', {
                description: `Tu cita de ${(appointment as any).service_name || appointment.service?.name || 'servicio'} ahora será aproximadamente a las ${newTime}. Te adelantaste ${timeDeviation.minutes} minutos.`,
                icon: <TrendingUp className="w-4 h-4" />,
                duration: 8000,
                action: {
                  label: 'Ver detalles',
                  onClick: () => {
                    console.log('Ver detalles de adelanto para:', appointment.clientName);
                  }
                }
              });
            } else {
              toast.warning('Pequeño retraso en tu cita', {
                description: `Tu cita de ${(appointment as any).service_name || appointment.service?.name || 'servicio'} se retrasará aproximadamente ${timeDeviation.minutes} minutos. Nueva hora estimada: ${newTime}`,
                icon: <TrendingDown className="w-4 h-4" />,
                duration: 10000,
                action: {
                  label: 'Ver detalles',
                  onClick: () => {
                    console.log('Ver detalles de retraso para:', appointment.clientName);
                  }
                }
              });
            }
          });

          // Ejecutar callback si existe
          onScheduleChange?.(subsequentAppointments, {
            type: timeDeviation.type,
            minutes: timeDeviation.minutes
          });

          // Notificación para el administrador
          const affectedCount = subsequentAppointments.length;
          const timeChange = timeDeviation.type === 'early' ? 'adelantó' : 'retrasó';
          
          toast.info(`Horarios actualizados`, {
            description: `Se ${timeChange} ${affectedCount} cita${affectedCount > 1 ? 's' : ''} por ${timeDeviation.minutes} minutos tras completar la cita de ${completedAppointment.clientName}`,
            icon: <Clock className="w-4 h-4" />,
            duration: 6000
          });
        }
      }
    });

    // Detectar citas que han estado 'in-progress' por mucho tiempo (posible retraso)
    const currentTime = new Date();
    const longRunningAppointments = appointments.filter(apt => {
      const previous = previousMap.get(apt.id);
      if (apt.status !== 'in-progress' || !previous) return false;

      const startTime = new Date(`${apt.date} ${apt.time}`);
      const duration = (apt as any).service_duration || apt.service?.duration || 30;
      const expectedDuration = duration * 60 * 1000; // en milisegundos
      const expectedEndTime = new Date(startTime.getTime() + expectedDuration);
      
      // Si ya pasó el tiempo esperado + 5 minutos de gracia
      return currentTime.getTime() > expectedEndTime.getTime() + (5 * 60 * 1000);
    });

    // Notificar sobre retrasos en progreso
    longRunningAppointments.forEach(delayedAppointment => {
      const startTime = new Date(`${delayedAppointment.date} ${delayedAppointment.time}`);
      const duration = (delayedAppointment as any).service_duration || delayedAppointment.service?.duration || 30;
      const expectedDuration = duration * 60 * 1000;
      const expectedEndTime = new Date(startTime.getTime() + expectedDuration);
      const delayMinutes = Math.round((currentTime.getTime() - expectedEndTime.getTime()) / (1000 * 60));
      
      if (delayMinutes > 0 && delayMinutes % 5 === 0) { // Notificar cada 5 minutos
        const subsequentAppointments = getSubsequentAppointments(appointments, delayedAppointment);
        
        if (subsequentAppointments.length > 0) {
          // Notificar retraso en progreso
          subsequentAppointments.forEach(appointment => {
            const adjustedTime = calculateAdjustedTime(appointment.time, delayMinutes);
            
            toast.warning('Retraso en progreso', {
              description: `Tu cita puede retrasarse aproximadamente ${delayMinutes} minutos. Hora estimada actualizada: ${adjustedTime}`,
              icon: <Clock className="w-4 h-4" />,
              duration: 8000
            });
          });

          // Notificar al administrador
          toast.warning('Cita retrasándose', {
            description: `${delayedAppointment.clientName} lleva ${delayMinutes} min extra. ${subsequentAppointments.length} citas posteriores afectadas.`,
            icon: <Clock className="w-4 h-4" />,
            duration: 6000,
            action: {
              label: 'Ver calendario',
              onClick: () => {
                console.log('Revisar calendario para:', delayedAppointment.id);
              }
            }
          });
        }
      }
    });

    previousAppointmentsRef.current = appointments;
  }, [appointments, onScheduleChange]);

  // Función manual para calcular y mostrar tiempos ajustados
  const calculateScheduleImpact = (completedAppointment: Appointment, actualCompletionTime?: Date) => {
    const timeDeviation = calculateTimeDeviation(completedAppointment, actualCompletionTime);
    const subsequentAppointments = getSubsequentAppointments(appointments, completedAppointment);
    
    return {
      deviation: timeDeviation,
      affectedAppointments: subsequentAppointments.map(apt => ({
        ...apt,
        adjustedTime: calculateAdjustedTime(
          apt.time, 
          timeDeviation.type === 'early' ? -timeDeviation.minutes : timeDeviation.minutes
        )
      }))
    };
  };

  return {
    calculateScheduleImpact
  };
}