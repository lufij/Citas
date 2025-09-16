import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { formatDate, toDateString } from '../utils/dateUtils';
import { formatPrice } from '../utils/currency';
import { calculateNextAvailableTime, getAvailableTimeSlots, getClientsBeforeTime, getWaitTimeBeforeTime, type Appointment } from '../utils/appointmentUtils';
import type { Service } from './ServiceManagement';

interface AppointmentFormProps {
  onSubmit: (appointment: any) => void;
  onCancel: () => void;
  clientName?: string;
  appointments?: Appointment[];
  services?: Service[];
}

export function AppointmentForm({ onSubmit, onCancel, clientName, appointments = [], services = [] }: AppointmentFormProps) {
  // Debug: Log para verificar la estructura de los servicios
  console.log('AppointmentForm - Servicios recibidos:', services);
  console.log('AppointmentForm - Estructura del primer servicio:', services[0]);
  
  // Inicializar con la fecha de hoy, asegurándonos de que sea válida
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Debug detallado de la fecha
    console.log('AppointmentForm - Fecha del sistema:', new Date());
    console.log('AppointmentForm - Fecha normalizada:', today);
    console.log('AppointmentForm - Fecha string:', today.toDateString());
    console.log('AppointmentForm - Fecha ISO:', today.toISOString().split('T')[0]);
    
    return today;
  };
  
  const [date, setDate] = useState<Date>(getTodayDate());
  const [time, setTime] = useState('');
  const [service, setService] = useState('');
  const [notes, setNotes] = useState('');

  // Calcular slots de tiempo disponibles para la fecha seleccionada
  const availableTimeSlots = React.useMemo(() => {
    try {
      return getAvailableTimeSlots(appointments || [], date);
    } catch (error) {
      console.error('Error calculando slots disponibles:', error);
      return [];
    }
  }, [appointments, date]);

  // Efecto para calcular y establecer la hora default cuando cambia la fecha o appointments
  useEffect(() => {
    if (date) {
      try {
        console.log('=== DEBUG: Calculando hora automática ===');
        console.log('Fecha seleccionada:', date.toDateString());
        console.log('Total de citas recibidas:', appointments?.length);
        console.log('Detalle de citas:', appointments?.map(apt => ({ 
          id: apt.id, 
          date: apt.date, 
          time: apt.time, 
          status: apt.status,
          client: apt.clientName 
        })));
        console.log('Es hoy?:', toDateString(date) === toDateString(new Date()));
        
        const nextAvailableTime = calculateNextAvailableTime(appointments || [], date);
        console.log('Hora sugerida por calculateNextAvailableTime:', nextAvailableTime);
        
        const currentAvailableSlots = getAvailableTimeSlots(appointments || [], date);
        console.log('Slots disponibles:', currentAvailableSlots);
        console.log('¿Hora sugerida está en slots?:', currentAvailableSlots.includes(nextAvailableTime));
        
        console.log('Hora actual seleccionada:', time);
        console.log('¿Debe establecer nueva hora?:', !time || !currentAvailableSlots.includes(time));
        
        // Establecer la hora automáticamente si:
        // - No hay hora seleccionada, O
        // - La hora actual ya no está disponible en los slots
        if (!time || !currentAvailableSlots.includes(time)) {
          console.log('Estableciendo nueva hora:', nextAvailableTime);
          setTime(nextAvailableTime);
        } else {
          console.log('Manteniendo hora actual:', time);
        }
      } catch (error) {
        console.error('Error en useEffect de AppointmentForm:', error);
        setTime('09:00'); // Fallback a una hora por defecto
      }
    }
  }, [date, appointments, time]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && time && service) {
      // Validar que la fecha no sea pasada
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        console.error('AppointmentForm - No se puede agendar en fechas pasadas');
        alert('No se puede agendar una cita en una fecha pasada. Por favor selecciona una fecha actual o futura.');
        return;
      }
      
      const selectedService = services.find(s => s.id === service);
      console.log('AppointmentForm - Servicio seleccionado:', selectedService);
      
      if (!selectedService) {
        console.error('AppointmentForm - No se encontró el servicio seleccionado');
        return;
      }
      
      const appointmentDate = toDateString(date);
      console.log('AppointmentForm - Fecha de la cita:', appointmentDate);
      
      const appointment = {
        id: Date.now(),
        clientName,
        date: appointmentDate,
        time,
        service: selectedService,
        notes,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };
      
      console.log('AppointmentForm - Cita a enviar:', appointment);
      onSubmit(appointment);
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selectedDate = new Date(newDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      console.log('handleDateChange - Fecha seleccionada:', selectedDate.toDateString());
      console.log('handleDateChange - Fecha de hoy:', today.toDateString());
      
      // Validar que no sea una fecha pasada
      if (selectedDate < today) {
        console.warn('handleDateChange - Fecha pasada detectada, usando hoy');
        setDate(today);
      } else {
        setDate(newDate);
      }
      
      // Limpiar la hora seleccionada para que se recalcule automáticamente
      setTime('');
    }
  };

  const selectedService = services.find(s => s.id === service);

  // Validación: Si no hay servicios disponibles
  if (!services || services.length === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Agendar Nueva Cita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No hay servicios disponibles en este momento.</p>
            <Button variant="outline" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Agendar Nueva Cita</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Servicio</Label>
            <Select value={service} onValueChange={setService} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((srv) => (
                  <SelectItem key={srv.id} value={srv.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{srv.name || 'Servicio sin nombre'}</span>
                      <span className="text-sm text-muted-foreground ml-4">
                        {srv.duration || 30}min - {formatPrice(srv.price || 0)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duración: {selectedService.duration || 30} minutos
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {date ? formatDate(date) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  disabled={(date: Date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const selectedDate = new Date(date);
                    selectedDate.setHours(0, 0, 0, 0);
                    
                    // Debug: Log para verificar las fechas
                    console.log('Calendar - Fecha seleccionada:', selectedDate.toDateString());
                    console.log('Calendar - Fecha de hoy:', today.toDateString());
                    console.log('Calendar - ¿Es fecha pasada?:', selectedDate < today);
                    console.log('Calendar - ¿Es hoy?:', selectedDate.getTime() === today.getTime());
                    
                    // Deshabilitar solo fechas ANTES de hoy (no incluir hoy)
                    const isPastDate = selectedDate < today;
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Domingo o Sábado
                    
                    console.log('Calendar - ¿Deshabilitar?:', isPastDate || isWeekend);
                    
                    return isPastDate || isWeekend;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Hora</Label>
            <Select value={time} onValueChange={setTime} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una hora" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                    {slot === calculateNextAvailableTime(appointments, date) && (
                      <span className="ml-2 text-xs text-green-600">(Recomendado)</span>
                    )}
                  </SelectItem>
                ))}
                {availableTimeSlots.length === 0 && (
                  <SelectItem value="" disabled>
                    No hay horarios disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {time && time === calculateNextAvailableTime(appointments, date) && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  Próxima hora disponible
                  {(() => {
                    const clientsBefore = getClientsBeforeTime(appointments, date, time);
                    const waitTime = getWaitTimeBeforeTime(appointments, date, time);
                    if (clientsBefore > 0) {
                      return ` (${clientsBefore} cliente${clientsBefore > 1 ? 's' : ''} antes, ~${waitTime} min de espera)`;
                    } else {
                      return ' (sin espera)';
                    }
                  })()}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones (opcional)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Alguna preferencia especial..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Confirmar Cita
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}