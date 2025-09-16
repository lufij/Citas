import { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { toast, Toaster } from 'sonner';
import { SimpleAuthService } from './services/simpleAuth';
import { ServiceService } from './services/serviceService';
import { AppointmentService } from './services/appointments';
import type { SimpleUser } from './services/simpleAuth';
import type { Service } from './lib/supabase';
import type { Appointment } from './lib/supabase';

function App() {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Inicializar aplicación
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setError(null);
      
      // Verificar si hay usuario autenticado
      const currentUser = SimpleAuthService.getCurrentUser();
      setUser(currentUser);
      
      // Cargar servicios
      await loadServices();
      
      // Cargar citas si hay usuario
      if (currentUser) {
        await loadAppointments();
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
      
      // Verificar si es un error de configuración de Supabase
      if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
        setError('Error de configuración: Faltan credenciales de Supabase. Verifica el archivo .env');
        toast.error('Error de configuración de la base de datos');
      } else {
        setError('Error al conectar con la base de datos. Verifica tu conexión.');
        toast.error('Error al inicializar la aplicación');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar servicios desde Supabase
  const loadServices = async () => {
    const { services: loadedServices, error } = await ServiceService.getServices();
    if (error) {
      toast.error('Error al cargar servicios: ' + error);
    } else {
      setServices(loadedServices);
    }
  };

  // Cargar citas desde Supabase
  const loadAppointments = async () => {
    console.log('App.tsx - Cargando citas...');
    const { appointments: loadedAppointments, error } = await AppointmentService.getAppointments();
    if (error) {
      console.error('App.tsx - Error al cargar citas:', error);
      toast.error('Error al cargar citas: ' + error);
    } else {
      console.log('App.tsx - Citas cargadas:', loadedAppointments?.length, 'citas');
      console.log('App.tsx - Detalle de citas:', loadedAppointments?.map(apt => ({
        id: apt.id,
        date: apt.date, 
        time: apt.time,
        client: apt.client_name,
        status: apt.status
      })));
      setAppointments(loadedAppointments);
    }
  };

  // Manejar login
  const handleLogin = async (loggedUser: SimpleUser) => {
    setUser(loggedUser);
    await loadAppointments();
  };

  // Manejar logout
  const handleLogout = async () => {
    SimpleAuthService.logout();
    setUser(null);
    setAppointments([]);
    toast.success('Sesión cerrada exitosamente');
  };

  // Crear nueva cita
  const handleNewAppointment = async (appointmentData: any) => {
    if (!user) return;

    try {
      const newAppointmentData = {
        client_id: user.id,
        client_name: appointmentData.clientName || user.fullName,
        client_phone: user.phone,
        date: appointmentData.date,
        time: appointmentData.time,
        service_id: appointmentData.service.id,
        service_name: appointmentData.service.name,
        service_duration: appointmentData.service.duration,
        service_price: appointmentData.service.price,
        notes: appointmentData.notes
      };

      const { appointment, error } = await AppointmentService.createAppointment(newAppointmentData);
      
      if (error) {
        toast.error('Error al crear cita: ' + error);
      } else if (appointment) {
        setAppointments([...appointments, appointment]);
        toast.success('Cita creada exitosamente');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // Actualizar cita
  const handleUpdateAppointment = async (appointmentId: number, updates: Partial<Appointment>) => {
    console.log('Actualizando cita:', { appointmentId, updates });
    
    try {
      const { appointment, error } = await AppointmentService.updateAppointment(appointmentId, updates);
      console.log('Resultado de actualización:', { appointment, error });
      
      if (error) {
        console.error('Error al actualizar:', error);
        toast.error('Error al actualizar cita: ' + error);
        return;
      } 
      
      if (appointment) {
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? appointment : apt
        ));
        
        if (updates.status === 'completed') {
          toast.success('Cita completada exitosamente');
        } else if (updates.status === 'cancelled') {
          toast.success('Cita cancelada');
        } else {
          toast.success('Cita actualizada');
        }
      } else {
        console.error('No se recibió la cita actualizada');
        toast.error('No se pudo actualizar la cita');
      }
    } catch (error) {
      console.error('Error en handleUpdateAppointment:', error);
      toast.error('Error de conexión al actualizar la cita');
    }
  };

  // Actualizar servicios
  const handleServicesUpdate = async (updatedServices: Service[]) => {
    setServices(updatedServices);
    await loadServices(); // Recargar desde la base de datos
  };

  // Datos de cola (simulación)
  const queueData = {
    currentNumber: 15,
    totalWaiting: appointments.filter(apt => apt.status === 'scheduled').length,
    estimatedWait: appointments.filter(apt => apt.status === 'scheduled').length * 30, // 30 min promedio
    averageServiceTime: 35
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error de Conexión
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      initializeApp();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginForm onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      {user.type === 'client' ? (
        <>
          {console.log('App.tsx - Pasando', appointments?.length, 'citas a ClientDashboard')}
          <ClientDashboard
            user={user}
            appointments={appointments}
            queueData={queueData}
            services={services.filter(s => s.active)}
            onNewAppointment={handleNewAppointment}
            onLogout={handleLogout}
          />
        </>
      ) : (
        <AdminDashboard
          user={user}
          appointments={appointments}
          services={services}
          onUpdateAppointment={handleUpdateAppointment}
          onNewAppointment={handleNewAppointment}
          onServicesUpdate={handleServicesUpdate}
          onLogout={handleLogout}
        />
      )}
      <Toaster position="top-right" />
    </>
  );
}

export default App;