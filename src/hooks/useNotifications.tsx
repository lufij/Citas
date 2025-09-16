import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Bell, Clock, Calendar } from 'lucide-react';
import {
  getTodayAppointmentsForClient,
  getTodayScheduledAppointments,
  shouldShowNotification,
  markNotificationAsShown,
  generateNotificationKey,
  cleanOldNotifications,
  getMinutesUntilAppointment,
  type Appointment
} from '../utils/appointmentUtils';
import {
  isNotificationEnabledForTime,
  isVibrationEnabled,
  isSoundEnabled,
  isInAppNotificationEnabled
} from '../utils/notificationSettings';

export interface UseNotificationsOptions {
  userId?: number;
  userType: 'client' | 'admin';
  appointments: Appointment[];
  onNewAppointment?: (appointment: Appointment) => void;
}

export function useNotifications({ 
  userId, 
  userType, 
  appointments,
  onNewAppointment 
}: UseNotificationsOptions) {
  const previousAppointmentsRef = useRef<Appointment[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Detectar nuevas citas para administradores
  useEffect(() => {
    if (userType === 'admin' && isInitializedRef.current) {
      const previousIds = new Set(previousAppointmentsRef.current.map(apt => apt.id));
      const newAppointments = appointments.filter(apt => !previousIds.has(apt.id));
      
      newAppointments.forEach(appointment => {
        // Solo notificar citas programadas (no las de ejemplo que ya existían)
        if (appointment.status === 'scheduled') {
          const clientName = (appointment as any).client_name || appointment.clientName || 'Cliente';
          const serviceName = (appointment as any).service_name || (appointment as any).service?.name || 'Servicio';
          
          toast.success('¡Nueva cita agendada!', {
            description: `${clientName} - ${serviceName}`,
            icon: <Calendar className="w-4 h-4" />,
            duration: 5000,
            action: {
              label: 'Ver detalles',
              onClick: () => {
                // Aquí podrías abrir un modal o navegar a los detalles
                console.log('Ver detalles de cita:', appointment.id);
              }
            }
          });
          
          // Ejecutar callback si existe
          onNewAppointment?.(appointment);
        }
      });
    }
    
    previousAppointmentsRef.current = appointments;
    isInitializedRef.current = true;
  }, [appointments, userType, onNewAppointment]);

  // Sistema de alertas para clientes
  useEffect(() => {
    if (userType !== 'client' || !userId) return;

    // Limpiar notificaciones antiguas al iniciar
    cleanOldNotifications();

    const checkAppointmentAlerts = () => {
      const todayAppointments = getTodayAppointmentsForClient(appointments, userId);
      
      todayAppointments.forEach(appointment => {
        // Alertas de proximidad: 20, 10 y 5 minutos
        const alertTimes = [20, 10, 5];
        
        alertTimes.forEach(minutes => {
          const notificationKey = generateNotificationKey(appointment.id, minutes, 'client');
          
          if (shouldShowNotification(appointment, minutes, notificationKey) && 
              isNotificationEnabledForTime(minutes) && 
              isInAppNotificationEnabled()) {
            const minutesUntil = getMinutesUntilAppointment(appointment);
            
            // Personalizar mensaje según el tiempo restante
            let message = '';
            let description = '';
            let urgency: 'default' | 'warning' | 'error' = 'default';
            
            if (minutes === 20) {
              message = '⏰ Tu cita se acerca';
              const serviceName = (appointment as any).service_name || (appointment as any).service?.name || 'Servicio';
              description = `${serviceName} en ${minutesUntil} minutos`;
              urgency = 'default';
            } else if (minutes === 10) {
              message = '🔔 ¡Prepárate!';
              description = `Tu cita es en ${minutesUntil} minutos. Es hora de dirigirte a la barbería.`;
              urgency = 'warning';
            } else if (minutes === 5) {
              message = '🚨 ¡Tu turno está muy cerca!';
              const serviceName = (appointment as any).service_name || (appointment as any).service?.name || 'Servicio';
              description = `${serviceName} en ${minutesUntil} minutos. ¡Ya deberías estar aquí!`;
              urgency = 'error';
            }
            
            // Mostrar toast con estilo apropiado
            const toastOptions = {
              description,
              icon: <Clock className="w-4 h-4" />,
              duration: minutes === 5 ? 10000 : 7000, // Más tiempo para alertas urgentes
              action: {
                label: 'Ver cita',
                onClick: () => {
                  // Scroll hacia la sección de próxima cita o abrir detalles
                  const nextAppointmentElement = document.querySelector('[data-next-appointment]');
                  nextAppointmentElement?.scrollIntoView({ behavior: 'smooth' });
                }
              }
            };

            if (urgency === 'error') {
              toast.error(message, toastOptions);
            } else if (urgency === 'warning') {
              toast.warning(message, toastOptions);
            } else {
              toast.info(message, toastOptions);
            }
            
            // Marcar como mostrada
            markNotificationAsShown(notificationKey);
            
            // Opcional: Vibración en dispositivos móviles
            if (isVibrationEnabled() && 'vibrate' in navigator) {
              const pattern = minutes === 5 ? [200, 100, 200, 100, 200] : [200, 100, 200];
              navigator.vibrate(pattern);
            }

            // Opcional: Sonido de notificación (si está disponible)
            if (isSoundEnabled()) {
              try {
                // Crear un beep simple
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
              } catch (error) {
                // Silenciar errores de audio
              }
            }
          }
        });
      });
    };

    // Verificar inmediatamente
    checkAppointmentAlerts();
    
    // Configurar intervalo para verificar cada minuto
    intervalRef.current = setInterval(checkAppointmentAlerts, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userType, userId, appointments]);

  // Alertas adicionales para administradores sobre citas próximas
  useEffect(() => {
    if (userType !== 'admin') return;

    const checkUpcomingAppointments = () => {
      const todayAppointments = getTodayScheduledAppointments(appointments);
      
      todayAppointments.forEach(appointment => {
        const minutesUntil = getMinutesUntilAppointment(appointment);
        
        // Alerta para admin cuando queden 5 minutos para una cita
        if (minutesUntil <= 5 && minutesUntil > 4) {
          const notificationKey = generateNotificationKey(appointment.id, 5, 'admin');
          
          if (shouldShowNotification(appointment, 5, notificationKey)) {
            const clientName = (appointment as any).client_name || appointment.clientName || 'Cliente';
            const serviceName = (appointment as any).service_name || (appointment as any).service?.name || 'Servicio';
            
            toast.info('📋 Cliente próximo', {
              description: `${clientName} tiene cita en ${minutesUntil} minutos - ${serviceName}`,
              icon: <Bell className="w-4 h-4" />,
              duration: 6000,
              action: {
                label: 'Preparar',
                onClick: () => {
                  console.log('Preparar para cliente:', clientName);
                }
              }
            });
            
            markNotificationAsShown(notificationKey);
          }
        }
      });
    };

    // Verificar inmediatamente
    checkUpcomingAppointments();
    
    // Configurar intervalo para verificar cada minuto
    const adminInterval = setInterval(checkUpcomingAppointments, 60000);

    return () => {
      clearInterval(adminInterval);
    };
  }, [userType, appointments]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}