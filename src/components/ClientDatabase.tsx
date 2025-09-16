import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Search, 
  Phone, 
  User, 
  Calendar, 
  DollarSign,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientData {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  created_at: string;
  total_appointments: number;
  completed_appointments: number;
  total_spent: number;
  last_appointment: string | null;
  upcoming_appointments: number;
}

export function ClientDatabase() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    avgSpending: 0
  });

  useEffect(() => {
    loadClientsData();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const loadClientsData = async () => {
    try {
      setLoading(true);

      // Obtener todos los clientes con estadísticas
      const { data: clientsData, error: clientsError } = await supabase
        .from('users')
        .select('*')
        .eq('user_type', 'client');

      if (clientsError) throw clientsError;

      // Para cada cliente, obtener estadísticas de citas
      const enrichedClients = await Promise.all(
        clientsData.map(async (client) => {
          const { data: appointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('client_id', client.id);

          if (appointmentsError) throw appointmentsError;

          const totalAppointments = appointments?.length || 0;
          const completedAppointments = appointments?.filter(apt => apt.status === 'completed').length || 0;
          const upcomingAppointments = appointments?.filter(apt => 
            apt.status === 'scheduled' && new Date(apt.date + 'T' + apt.time) > new Date()
          ).length || 0;
          
          const totalSpent = appointments
            ?.filter(apt => apt.status === 'completed')
            .reduce((sum, apt) => sum + parseFloat(apt.service_price || '0'), 0) || 0;

          const lastAppointment = appointments
            ?.filter(apt => apt.status === 'completed')
            .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())[0];

          return {
            ...client,
            total_appointments: totalAppointments,
            completed_appointments: completedAppointments,
            upcoming_appointments: upcomingAppointments,
            total_spent: totalSpent,
            last_appointment: lastAppointment ? lastAppointment.date : null
          };
        })
      );

      setClients(enrichedClients);

      // Calcular estadísticas globales
      const totalClients = enrichedClients.length;
      const activeClients = enrichedClients.filter(c => c.upcoming_appointments > 0 || 
        (c.last_appointment && new Date(c.last_appointment) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      ).length;
      const totalRevenue = enrichedClients.reduce((sum, c) => sum + c.total_spent, 0);
      const avgSpending = totalClients > 0 ? totalRevenue / totalClients : 0;

      setStats({
        totalClients,
        activeClients,
        totalRevenue,
        avgSpending
      });

    } catch (error) {
      console.error('Error loading clients data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchTerm) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client => 
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredClients(filtered);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Cargando base de datos de clientes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-purple-600">₡{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Gasto Promedio</p>
                <p className="text-2xl font-bold text-orange-600">₡{Math.round(stats.avgSpending).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Base de Datos de Clientes</span>
            <Badge variant="secondary" className="ml-2">
              {filteredClients.length} clientes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o número de teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabla de Clientes */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Cliente</th>
                  <th className="text-left p-3 font-semibold">Teléfono</th>
                  <th className="text-left p-3 font-semibold">Total Citas</th>
                  <th className="text-left p-3 font-semibold">Completadas</th>
                  <th className="text-left p-3 font-semibold">Próximas</th>
                  <th className="text-left p-3 font-semibold">Total Gastado</th>
                  <th className="text-left p-3 font-semibold">Última Visita</th>
                  <th className="text-left p-3 font-semibold">Cliente Desde</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {client.first_name} {client.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{client.phone}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {client.total_appointments}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {client.completed_appointments}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        {client.upcoming_appointments}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-purple-600">
                        ₡{client.total_spent.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3">
                      {client.last_appointment ? (
                        <span className="text-sm text-gray-600">
                          {format(new Date(client.last_appointment), 'dd MMM yyyy', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Sin visitas</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-600">
                        {format(new Date(client.created_at), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados.'}
              </div>
            )}
          </div>

          {/* Botón para recargar */}
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={loadClientsData} 
              variant="outline"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar Datos'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}