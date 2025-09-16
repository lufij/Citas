import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, Clock, CheckCircle } from 'lucide-react';
import { 
  getTodayAppointmentsForClient, 
  getMinutesUntilAppointment,
  type Appointment 
} from '../utils/appointmentUtils';

interface NotificationStatusProps {
  userId: number;
  appointments: Appointment[];
}

export function NotificationStatus({ userId, appointments }: NotificationStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar la hora cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const todayAppointments = getTodayAppointmentsForClient(appointments, userId);
  
  if (todayAppointments.length === 0) {
    return null;
  }

  const nextAppointment = todayAppointments[0];
  const minutesUntil = getMinutesUntilAppointment(nextAppointment, currentTime);

  // Solo mostrar si la cita es en las próximas 2 horas
  if (minutesUntil > 120 || minutesUntil < 0) {
    return null;
  }

  const getNotificationLevel = (minutes: number) => {
    if (minutes <= 5) return { level: 'urgent', color: 'destructive', icon: Bell };
    if (minutes <= 10) return { level: 'warning', color: 'secondary', icon: Clock };
    if (minutes <= 20) return { level: 'info', color: 'outline', icon: Bell };
    return { level: 'normal', color: 'outline', icon: CheckCircle };
  };

  const notification = getNotificationLevel(minutesUntil);
  const IconComponent = notification.icon;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <IconComponent className={`w-5 h-5 ${
            notification.level === 'urgent' ? 'text-red-500' :
            notification.level === 'warning' ? 'text-orange-500' :
            'text-blue-500'
          }`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {notification.level === 'urgent' && '🚨 ¡Tu cita es muy pronto!'}
                {notification.level === 'warning' && '⏰ Tu cita se acerca'}
                {notification.level === 'info' && '🔔 Cita próxima'}
                {notification.level === 'normal' && '📅 Tienes una cita hoy'}
              </p>
              <Badge variant={notification.color as any}>
                {minutesUntil} min
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {(nextAppointment as any).service_name || nextAppointment.service?.name || 'Servicio'} a las {nextAppointment.time}
              {notification.level === 'urgent' && ' - ¡Deberías estar en camino!'}
              {notification.level === 'warning' && ' - Es hora de prepararte'}
            </p>
          </div>
        </div>
        
        {notification.level === 'urgent' && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            💡 <strong>Consejo:</strong> Si no puedes llegar a tiempo, llama para reagendar tu cita.
          </div>
        )}
        
        {notification.level === 'warning' && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
            🚶‍♂️ <strong>Recordatorio:</strong> Es recomendable llegar 5 minutos antes de tu cita.
          </div>
        )}
      </CardContent>
    </Card>
  );
}