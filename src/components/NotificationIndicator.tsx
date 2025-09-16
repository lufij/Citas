import { Bell, BellRing } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  getTodayAppointmentsForClient, 
  getMinutesUntilAppointment,
  type Appointment 
} from '../utils/appointmentUtils';

interface NotificationIndicatorProps {
  userId?: number;
  userType: 'client' | 'admin';
  appointments: Appointment[];
  onClick?: () => void;
}

export function NotificationIndicator({ userId, userType, appointments, onClick }: NotificationIndicatorProps) {
  let hasActiveNotifications = false;
  let notificationCount = 0;

  if (userType === 'client' && userId) {
    const todayAppointments = getTodayAppointmentsForClient(appointments, userId);
    const upcomingAppointments = todayAppointments.filter(apt => {
      const minutesUntil = getMinutesUntilAppointment(apt);
      return minutesUntil > 0 && minutesUntil <= 30; // Próximas 30 minutos
    });
    
    hasActiveNotifications = upcomingAppointments.length > 0;
    notificationCount = upcomingAppointments.length;
  }

  if (userType === 'admin') {
    // Para admin, mostrar citas que requieren atención
    const today = new Date().toISOString().split('T')[0];
    const pendingAppointments = appointments.filter(apt => 
      apt.date === today && apt.status === 'scheduled'
    );
    
    hasActiveNotifications = pendingAppointments.length > 0;
    notificationCount = pendingAppointments.length;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative"
      onClick={onClick}
    >
      {hasActiveNotifications ? (
        <BellRing className="w-5 h-5" />
      ) : (
        <Bell className="w-5 h-5" />
      )}
      
      {notificationCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
        >
          {notificationCount > 9 ? '9+' : notificationCount}
        </Badge>
      )}
    </Button>
  );
}