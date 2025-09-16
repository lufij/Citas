import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { 
  getTodayAppointmentsForClient,
  calculateTimeDeviation,
  calculateAdjustedTime,
  type Appointment 
} from '../utils/appointmentUtils';

interface ScheduleAdjustmentIndicatorProps {
  userId: number;
  appointments: Appointment[];
}

interface ScheduleAdjustment {
  type: 'early' | 'late';
  minutes: number;
  adjustedTime: string;
  reason: string;
}

export function ScheduleAdjustmentIndicator({ userId, appointments }: ScheduleAdjustmentIndicatorProps) {
  const [adjustment, setAdjustment] = useState<ScheduleAdjustment | null>(null);

  useEffect(() => {
    const todayAppointments = getTodayAppointmentsForClient(appointments, userId);
    const nextAppointment = todayAppointments[0];
    
    if (!nextAppointment) {
      setAdjustment(null);
      return;
    }

    // Buscar citas completadas antes de la siguiente cita del usuario
    const completedEarlier = appointments.filter(apt => 
      apt.date === nextAppointment.date &&
      apt.status === 'completed' &&
      apt.time < nextAppointment.time
    );

    // Calcular el ajuste total basado en las citas completadas
    let totalAdjustment = 0;
    let hasEarlyCompletion = false;
    let hasLateCompletion = false;

    completedEarlier.forEach(completedApt => {
      const deviation = calculateTimeDeviation(completedApt);
      if (deviation.type === 'early') {
        totalAdjustment -= deviation.minutes;
        hasEarlyCompletion = true;
      } else if (deviation.type === 'late') {
        totalAdjustment += deviation.minutes;
        hasLateCompletion = true;
      }
    });

    if (Math.abs(totalAdjustment) >= 3) { // Solo mostrar si el ajuste es significativo
      const adjustedTime = calculateAdjustedTime(nextAppointment.time, totalAdjustment);
      
      setAdjustment({
        type: totalAdjustment < 0 ? 'early' : 'late',
        minutes: Math.abs(totalAdjustment),
        adjustedTime,
        reason: hasEarlyCompletion && hasLateCompletion 
          ? 'Ajustes mixtos en el horario' 
          : hasEarlyCompletion 
            ? 'Citas anteriores terminaron antes'
            : 'Retrasos en citas anteriores'
      });
    } else {
      setAdjustment(null);
    }
  }, [userId, appointments]);

  if (!adjustment) {
    return null;
  }

  const IconComponent = adjustment.type === 'early' ? TrendingUp : TrendingDown;
  const bgColor = adjustment.type === 'early' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';
  const textColor = adjustment.type === 'early' ? 'text-green-700' : 'text-orange-700';
  const badgeVariant = adjustment.type === 'early' ? 'default' : 'secondary';

  return (
    <Card className={`border-l-4 ${bgColor} ${adjustment.type === 'early' ? 'border-l-green-500' : 'border-l-orange-500'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <IconComponent className={`w-5 h-5 ${adjustment.type === 'early' ? 'text-green-600' : 'text-orange-600'}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium">
                {adjustment.type === 'early' ? '🎉 ¡Tu cita se adelantó!' : '⏰ Tu cita tiene un pequeño retraso'}
              </p>
              <Badge variant={badgeVariant}>
                {adjustment.minutes} min
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {adjustment.reason}
            </p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm">
                <strong>Nueva hora estimada:</strong> {adjustment.adjustedTime}
              </p>
            </div>
          </div>
        </div>
        
        <div className={`mt-3 p-2 rounded text-sm ${bgColor.replace('50', '100')} ${textColor}`}>
          {adjustment.type === 'early' ? (
            <>
              <CheckCircle className="w-4 h-4 inline mr-1" />
              <strong>¡Genial!</strong> Tendrás más tiempo libre después de tu cita.
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 inline mr-1" />
              <strong>Nota:</strong> Te recomendamos llegar a la hora original por si el horario se normaliza.
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}