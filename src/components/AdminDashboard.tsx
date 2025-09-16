import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, TrendingUp, Play, X, Check, Settings } from 'lucide-react';
import { formatDate, getWeekStart, getWeekEnd, getMonthStart, getMonthEnd, toDateString } from '../utils/dateUtils';
import { formatPrice } from '../utils/currency';
import { useNotifications } from '../hooks/useNotifications';
import { useScheduleUpdates } from '../hooks/useScheduleUpdates';
import { NotificationIndicator } from './NotificationIndicator';
import { AdminAppointmentForm } from './AdminAppointmentForm';
import { ServiceManagement } from './ServiceManagement';
import { ClientDatabase } from './ClientDatabase';
import type { Service } from '../lib/supabase';

// Agregar estilos CSS para la animación
const pulseStyle = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }
`;

interface AdminDashboardProps {
  user: any;
  appointments: any[];
  services: Service[];
  onUpdateAppointment: (appointmentId: number, updates: any) => void;
  onNewAppointment: (appointment: any) => void;
  onServicesUpdate: (services: Service[]) => void;
  onLogout: () => void;
}

export function AdminDashboard({ 
  user, 
  appointments, 
  services,
  onUpdateAppointment, 
  onNewAppointment, 
  onServicesUpdate,
  onLogout 
}: AdminDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showServiceManagement, setShowServiceManagement] = useState(false);

  // Configurar notificaciones para el administrador
  useNotifications({
    userId: user.id,
    userType: 'admin',
    appointments,
    onNewAppointment: (appointment) => {
      // Callback adicional cuando se recibe una nueva cita
      console.log('Nueva cita recibida en admin:', appointment);
    }
  });

  // Configurar actualizaciones automáticas de horario
  useScheduleUpdates({
    appointments,
    onScheduleChange: (affectedAppointments, adjustment) => {
      console.log('Horarios actualizados:', { affectedAppointments, adjustment });
    }
  });

  // Extraer clientes únicos para el formulario de citas
  const existingClients = Array.from(
    new Map(
      appointments.map(apt => [
        apt.client_id || apt.clientId, 
        { 
          id: apt.client_id || apt.clientId, 
          name: apt.client_name || apt.clientName, 
          phone: apt.client_phone || apt.phone 
        }
      ])
    ).values()
  );

  const today = new Date();
  const todayString = toDateString(today);
  const todayAppointments = appointments.filter(apt => apt.date === todayString);
  const scheduledToday = todayAppointments.filter(apt => apt.status === 'scheduled');
  const completedToday = todayAppointments.filter(apt => apt.status === 'completed');

  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);
  const weekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate >= weekStart && aptDate <= weekEnd;
  });

  const monthStart = getMonthStart(today);
  const monthEnd = getMonthEnd(today);
  const monthAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate >= monthStart && aptDate <= monthEnd;
  });

  // Función de ordenamiento inteligente para citas
  const sortAppointmentsByPriority = (appointments: any[]) => {
    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    return appointments.sort((a, b) => {
      // Definir prioridades de status (menor número = mayor prioridad)
      const statusPriority: { [key: string]: number } = {
        'in-progress': 1,  // En progreso - MÁXIMA PRIORIDAD (se mantiene arriba)
        'pending': 2,      // Pendientes de aprobar - ALTA PRIORIDAD
        'scheduled': 3,    // Programadas - MEDIA PRIORIDAD
        'completed': 4,    // Completadas - BAJA PRIORIDAD
        'cancelled': 5     // Canceladas - MÍNIMA PRIORIDAD
      };

      const aPriority = statusPriority[a.status] || 999;
      const bPriority = statusPriority[b.status] || 999;

      // Si tienen diferente prioridad de status, ordenar por prioridad
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Si tienen el mismo status, ordenar por hora
      // Para status 'scheduled', las citas más próximas a la hora actual van primero
      if (a.status === 'scheduled' && b.status === 'scheduled') {
        const aTimeMinutes = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
        const bTimeMinutes = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1]);
        
        // Si es hoy, priorizar citas que están cerca de la hora actual
        if (a.date === todayString && b.date === todayString) {
          const aTimeDiff = Math.abs(aTimeMinutes - currentTimeMinutes);
          const bTimeDiff = Math.abs(bTimeMinutes - currentTimeMinutes);
          
          // Si una cita ya pasó y otra no, la que no pasó va primero
          const aHasPassed = aTimeMinutes < currentTimeMinutes;
          const bHasPassed = bTimeMinutes < currentTimeMinutes;
          
          if (aHasPassed !== bHasPassed) {
            return aHasPassed ? 1 : -1;
          }
          
          // Si ambas están en el futuro, la más próxima va primero
          if (!aHasPassed && !bHasPassed) {
            return aTimeMinutes - bTimeMinutes;
          }
        }
        
        // Para fechas futuras o citas pasadas, ordenar por hora normal
        return aTimeMinutes - bTimeMinutes;
      }

      // Para otros status, ordenar por hora normalmente
      return a.time.localeCompare(b.time);
    });
  };

  const handleStatusChange = (appointmentId: number, newStatus: string) => {
    console.log('AdminDashboard: Cambiando estado de cita:', { appointmentId, newStatus });
    
    try {
      if (!appointmentId || appointmentId <= 0) {
        console.error('ID de cita inválido:', appointmentId);
        return;
      }
      
      if (!newStatus) {
        console.error('Estado nuevo inválido:', newStatus);
        return;
      }
      
      onUpdateAppointment(appointmentId, { status: newStatus });
    } catch (error) {
      console.error('Error al cambiar estado de cita:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 font-medium">📅 Agendada</Badge>;
      case 'in-progress':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-sm">⏳ En Proceso</Badge>;
      case 'completed':
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-sm">✅ Completada</Badge>;
      case 'cancelled':
        return <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200 font-medium">❌ Cancelada</Badge>;
      default:
        return <Badge variant="outline" className="font-medium">{status}</Badge>;
    }
  };

  const renderAppointmentCard = (appointment: any) => {
    const duration = appointment.service_duration || appointment.service?.duration || 30; // Fallback a 30 min
    const serviceName = appointment.service_name || appointment.service?.name || 'Servicio';
    
    const expectedEndTime = new Date(`${appointment.date} ${appointment.time}`);
    expectedEndTime.setMinutes(expectedEndTime.getMinutes() + duration);
    const expectedEndTimeStr = expectedEndTime.toTimeString().slice(0, 5);

    const getCardStyle = (status: string) => {
      switch (status) {
        case 'in-progress':
          return 'border-l-4 border-l-blue-500 border-blue-100 bg-gradient-to-r from-blue-50/50 to-white shadow-lg hover:shadow-xl transition-all duration-300';
        case 'completed':
          return 'border-l-4 border-l-green-500 border-green-100 bg-gradient-to-r from-green-50/50 to-white shadow-md opacity-90';
        case 'cancelled':
          return 'border-l-4 border-l-red-500 border-red-100 bg-gradient-to-r from-red-50/50 to-white shadow-sm opacity-75';
        default:
          return 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1';
      }
    };

    return (
      <Card key={appointment.id} className={`mb-4 ${getCardStyle(appointment.status)}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold">{appointment.client_name}</p>
              <p className="text-sm text-muted-foreground">{serviceName}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {appointment.time} - {expectedEndTimeStr} ({duration} min)
              </p>
              {appointment.status === 'in-progress' && (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#1d4ed8',
                    background: 'linear-gradient(to right, #eff6ff, #dbeafe)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    fontWeight: '500'
                  }}
                >
                  <div 
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }}
                  ></div>
                  <span>En proceso desde las {appointment.time}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              {getStatusBadge(appointment.status)}
              <p className="text-sm text-muted-foreground mt-1">
                {formatPrice(appointment.service_price || appointment.service?.price || 0)}
              </p>
            </div>
          </div>

          {appointment.notes && (
            <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded mb-3">
              <strong>Observaciones:</strong> {appointment.notes}
            </p>
          )}

          <div className="flex gap-2">
            {appointment.status === 'scheduled' && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => handleStatusChange(appointment.id, 'in-progress')}
                  style={{
                    background: 'linear-gradient(to right, #22c55e, #16a34a)',
                    color: 'white',
                    fontWeight: '500',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #15803d)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #22c55e, #16a34a)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Iniciar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                  style={{
                    border: '2px solid #fca5a5',
                    color: '#b91c1c',
                    backgroundColor: 'white',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                    e.currentTarget.style.borderColor = '#f87171';
                    e.currentTarget.style.color = '#991b1b';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#fca5a5';
                    e.currentTarget.style.color = '#b91c1c';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </>
            )}
            {appointment.status === 'in-progress' && (
              <Button 
                size="sm"
                onClick={() => handleStatusChange(appointment.id, 'completed')}
                style={{
                  background: 'linear-gradient(to right, #10b981, #059669)',
                  color: 'white',
                  fontWeight: '500',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #059669)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                <Check className="w-4 h-4 mr-1" />
                Completado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseStyle }} />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">Bienvenido, {user.name || `${user.first_name} ${user.last_name}` || user.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationIndicator 
                userType="admin"
                appointments={appointments}
                onClick={() => {
                  // Cambiar a la tab de hoy para ver citas pendientes
                  const todayTab = document.querySelector('[value="today"]');
                  if (todayTab instanceof HTMLElement) {
                    todayTab.click();
                  }
                }}
              />
              <Button 
                variant="outline" 
                onClick={() => setShowServiceManagement(true)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Métricas del día */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Citas Hoy</p>
                  <p className="text-2xl font-semibold">{todayAppointments.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-semibold">{scheduledToday.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                  <p className="text-2xl font-semibold">{completedToday.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Hoy</p>
                  <p className="text-2xl font-semibold">
                    {formatPrice(completedToday.reduce((sum, apt) => sum + (apt.service_price || apt.service?.price || 0), 0))}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes vistas */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 h-auto">
            <TabsTrigger value="today" className="text-xs md:text-sm p-2">📅 Hoy</TabsTrigger>
            <TabsTrigger value="week" className="text-xs md:text-sm p-2">📊 Semana</TabsTrigger>
            <TabsTrigger value="month" className="text-xs md:text-sm p-2">📈 Mes</TabsTrigger>
            <TabsTrigger value="clients" className="text-xs md:text-sm p-2 bg-blue-50 border-blue-200">
              👥 Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Citas de Hoy - {formatDate(today)}
                  </CardTitle>
                  <AdminAppointmentForm
                    appointments={appointments}
                    services={services.filter(s => s.active)}
                    onNewAppointment={onNewAppointment}
                    existingClients={existingClients}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay citas programadas para hoy
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sortAppointmentsByPriority(todayAppointments)
                      .map(renderAppointmentCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Resumen Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-semibold">{weekAppointments.length}</p>
                    <p className="text-sm text-muted-foreground">Total Citas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">
                      {weekAppointments.filter(apt => apt.status === 'completed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Completadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">
                      {formatPrice(weekAppointments
                        .filter(apt => apt.status === 'completed')
                        .reduce((sum, apt) => sum + (apt.service_price || apt.service?.price || 0), 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">
                      {Math.round(weekAppointments.filter(apt => apt.status === 'completed').length / 7 * 10) / 10}
                    </p>
                    <p className="text-sm text-muted-foreground">Promedio/día</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Estadísticas Mensuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold">{monthAppointments.length}</p>
                    <p className="text-sm text-muted-foreground">Total Citas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">
                      {monthAppointments.filter(apt => apt.status === 'completed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Completadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">
                      {formatPrice(monthAppointments
                        .filter(apt => apt.status === 'completed')
                        .reduce((sum, apt) => sum + (apt.service_price || apt.service?.price || 0), 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">
                      {monthAppointments.length > 0 ? 
                        Math.round((monthAppointments.filter(apt => apt.status === 'completed').length / monthAppointments.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Tasa Completado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <ClientDatabase />
          </TabsContent>
        </Tabs>
      </div>
    </div>

    {/* Modal de Gestión de Servicios */}
    {showServiceManagement && (
      <Dialog open={showServiceManagement} onOpenChange={setShowServiceManagement}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gestión de Servicios
            </DialogTitle>
          </DialogHeader>
          <ServiceManagement
            services={services}
            onServicesUpdate={onServicesUpdate}
          />
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}