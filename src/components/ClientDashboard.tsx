import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { QueueStatus } from './QueueStatus';
import { AppointmentForm } from './AppointmentForm';
import { Calendar, Clock, Plus, User, Phone } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationStatus } from './NotificationStatus';
import { NotificationIndicator } from './NotificationIndicator';
import { ScheduleAdjustmentIndicator } from './ScheduleAdjustmentIndicator';
import type { Service } from '../lib/supabase';
import type { SimpleUser } from '../services/simpleAuth';

interface ClientDashboardProps {
  user: SimpleUser;
  appointments: any[];
  queueData: any;
  services?: Service[];
  onNewAppointment: (appointment: any) => void;
  onLogout: () => void;
}

export function ClientDashboard({ user, appointments, queueData, services = [], onNewAppointment, onLogout }: ClientDashboardProps) {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  // Configurar notificaciones para el cliente
  useNotifications({
    userId: parseInt(user.id), // Convertir string a number temporalmente
    userType: 'client',
    appointments
  });

  // Debug: Log user and appointments data
  console.log('ClientDashboard - Usuario actual:', {
    id: user?.id || 'undefined',
    fullName: user?.fullName || 'undefined',
    phone: user?.phone || 'undefined'
  });
  console.log('ClientDashboard - Todas las citas:', appointments);
  console.log('ClientDashboard - QueueData recibido:', queueData);

  // Validación defensiva
  if (!user || !appointments) {
    console.error('ClientDashboard - Datos faltantes:', { user, appointments });
    return <div>Cargando datos del usuario...</div>;
  }

  const userAppointments = (appointments || []).filter(apt => {
    if (!apt) return false;
    
    console.log('Comparando cita:', {
      apt_client_id: apt.client_id,
      apt_client_name: apt.client_name,
      user_id: user.id,
      user_fullName: user.fullName
    });
    
    return apt.client_name === user.fullName || apt.client_id === user.id;
  });

  console.log('Citas filtradas del usuario:', userAppointments);

  const nextAppointment = userAppointments
    .filter(apt => apt && apt.status === 'scheduled' && apt.date && apt.time)
    .sort((a, b) => {
      try {
        return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
      } catch (error) {
        console.error('Error al ordenar citas:', error);
        return 0;
      }
    })[0];

  const userPositionInQueue = nextAppointment ? 
    (appointments || [])
      .filter(apt => apt && apt.status === 'scheduled' && apt.date && apt.time && 
        new Date(apt.date + ' ' + apt.time) <= new Date(nextAppointment.date + ' ' + nextAppointment.time))
      .findIndex(apt => apt.id === nextAppointment.id) + 1 : undefined;

  // Calcular datos de la cola basándose en las citas reales
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = (appointments || []).filter(apt => 
    apt && apt.date === today && (apt.status === 'scheduled' || apt.status === 'in-progress')
  );
  
  const realQueueData = {
    totalInQueue: todayAppointments.length,
    currentlyServing: todayAppointments.find(apt => apt.status === 'in-progress')?.client_name || null
  };
  
  console.log('ClientDashboard - Citas de hoy:', todayAppointments.length);
  console.log('ClientDashboard - Datos de cola calculados:', realQueueData);

  const handleNewAppointment = (appointment: any) => {
    onNewAppointment({ ...appointment, clientId: user.id, clientName: user.fullName });
    setShowAppointmentForm(false);
  };

  if (showAppointmentForm) {
    console.log('ClientDashboard - Renderizando AppointmentForm');
    console.log('ClientDashboard - appointments para AppointmentForm:', appointments?.length);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <AppointmentForm
            onSubmit={handleNewAppointment}
            onCancel={() => {
              console.log('ClientDashboard - Cancelando AppointmentForm');
              setShowAppointmentForm(false);
            }}
            clientName={user.fullName}
            appointments={appointments}
            services={services}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">Bienvenido, {user.fullName}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="w-4 h-4" />
                Cliente
                {user.phone && (
                  <>
                    <Phone className="w-3 h-3 ml-2" />
                    {user.phone}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationIndicator 
                userId={parseInt(user.id)}
                userType="client"
                appointments={appointments}
                onClick={() => {
                  // Scroll hacia las notificaciones
                  const notificationElement = document.querySelector('[data-notification-status]');
                  notificationElement?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
              <Button variant="outline" onClick={onLogout}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Estado de notificaciones */}
        <div data-notification-status>
          <NotificationStatus userId={parseInt(user.id)} appointments={appointments} />
          <ScheduleAdjustmentIndicator userId={parseInt(user.id)} appointments={appointments} />
        </div>

        {/* Estado de la cola */}
        <QueueStatus
          position={userPositionInQueue}
          estimatedWaitTime={userPositionInQueue ? userPositionInQueue * 30 : undefined}
          totalInQueue={realQueueData.totalInQueue}
          currentlyServing={realQueueData.currentlyServing}
        />

        {/* Acción principal */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-lg font-semibold">¿Listo para tu próximo corte?</h2>
              <p className="text-muted-foreground">
                Agenda tu cita de manera rápida y sencilla
              </p>
              <Button 
                onClick={() => {
                  console.log('ClientDashboard - Botón "Agendar Nueva Cita" clickeado');
                  console.log('ClientDashboard - showAppointmentForm antes:', showAppointmentForm);
                  setShowAppointmentForm(true);
                  console.log('ClientDashboard - showAppointmentForm después: true');
                }}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agendar Nueva Cita
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Próxima cita */}
        {nextAppointment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Tu Próxima Cita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" data-next-appointment>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{nextAppointment.service_name || nextAppointment.service?.name || 'Servicio'}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {nextAppointment.service_duration || nextAppointment.service?.duration || 30} minutos
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatDate(nextAppointment.date)} a las {nextAppointment.time}
                  </Badge>
                </div>
                {nextAppointment.notes && (
                  <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                    <strong>Observaciones:</strong> {nextAppointment.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial */}
        {userAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userAppointments
                  .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
                  .slice(0, 5)
                  .map((appointment) => (
                    <div key={appointment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{appointment.service_name || appointment.service?.name || 'Servicio'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(appointment.date)} - {appointment.time}
                        </p>
                      </div>
                      <Badge variant={
                        appointment.status === 'completed' ? 'default' : 
                        appointment.status === 'scheduled' ? 'secondary' : 'outline'
                      }>
                        {appointment.status === 'completed' ? 'Completada' : 
                         appointment.status === 'scheduled' ? 'Agendada' : 'Cancelada'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}