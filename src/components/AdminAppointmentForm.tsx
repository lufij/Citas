import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { UserPlus, Clock, Calendar, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import { findNextAvailableSlot, isTimeSlotAvailable } from '../utils/appointmentUtils';
import { toDateString } from '../utils/dateUtils';
import { formatPrice } from '../utils/currency';
import type { Service } from './ServiceManagement';

interface AdminAppointmentFormProps {
  appointments: any[];
  services?: Service[];
  onNewAppointment: (appointment: any) => void;
  existingClients?: { id: number; name: string; phone?: string }[];
}

export function AdminAppointmentForm({ appointments, services = [], onNewAppointment, existingClients = [] }: AdminAppointmentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNewClient, setIsNewClient] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [notes, setNotes] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');

  // Calcular tiempo sugerido cuando cambie el servicio o la fecha
  const calculateSuggestedTime = () => {
    if (selectedService) {
      const suggested = findNextAvailableSlot(
        appointments,
        selectedDate,
        selectedService.duration
      );
      setSuggestedTime(suggested);
      if (suggested && !selectedTime) {
        setSelectedTime(suggested);
      }
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s: Service) => s.id === serviceId);
    setSelectedService(service || null);
    // Recalcular tiempo sugerido
    if (service) {
      const suggested = findNextAvailableSlot(
        appointments,
        selectedDate,
        service.duration
      );
      setSuggestedTime(suggested);
      setSelectedTime(suggested);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setSuggestedTime('');
    // Recalcular tiempo sugerido
    if (selectedService) {
      const suggested = findNextAvailableSlot(
        appointments,
        date,
        selectedService.duration
      );
      setSuggestedTime(suggested);
      setSelectedTime(suggested);
    }
  };

  const validateForm = () => {
    if (isNewClient) {
      if (!clientName.trim()) {
        toast.error('Por favor ingresa el nombre del cliente');
        return false;
      }
    } else {
      if (!selectedClientId) {
        toast.error('Por favor selecciona un cliente existente');
        return false;
      }
    }

    if (!selectedService) {
      toast.error('Por favor selecciona un servicio');
      return false;
    }

    if (!selectedTime) {
      toast.error('Por favor selecciona una hora');
      return false;
    }

    // Validar disponibilidad del horario
    if (!isTimeSlotAvailable(appointments, selectedDate, selectedTime, selectedService.duration)) {
      toast.error('El horario seleccionado no está disponible');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const selectedClient = isNewClient 
      ? { id: Date.now(), name: clientName.trim(), phone: clientPhone.trim() }
      : existingClients.find(c => c.id === selectedClientId);

    if (!selectedClient || !selectedService) return;

    const newAppointment = {
      id: Date.now(),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date: selectedDate,
      time: selectedTime,
      service: selectedService,
      notes: notes.trim(),
      status: 'scheduled' as const,
      createdAt: new Date().toISOString()
    };

    onNewAppointment(newAppointment);
    
    // Reset form
    setIsNewClient(true);
    setSelectedClientId(null);
    setClientName('');
    setClientPhone('');
    setSelectedTime('');
    setSelectedService(null);
    setNotes('');
    setSuggestedTime('');
    setIsOpen(false);

    toast.success('¡Cita agregada exitosamente!', {
      description: `${selectedClient.name} - ${selectedService.name} a las ${selectedTime}`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Agregar Cita Walk-in
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nueva Cita Walk-in
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selección de cliente */}
          <div className="space-y-3">
            <Label>Cliente</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isNewClient ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNewClient(true)}
              >
                Nuevo Cliente
              </Button>
              <Button
                type="button"
                variant={!isNewClient ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNewClient(false)}
                disabled={existingClients.length === 0}
              >
                Cliente Existente
              </Button>
            </div>

            {isNewClient ? (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="clientName">Nombre completo</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre del cliente"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientPhone">Teléfono (opcional)</Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>
            ) : (
              <Select value={selectedClientId?.toString()} onValueChange={(value: string) => setSelectedClientId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente existente" />
                </SelectTrigger>
                <SelectContent>
                  {existingClients.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{client.name}</span>
                        {client.phone && (
                          <>
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{client.phone}</span>
                          </>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Fecha */}
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={toDateString(new Date())}
              required
            />
          </div>

          {/* Servicio */}
          <div>
            <Label>Servicio</Label>
            <Select value={selectedService?.id} onValueChange={handleServiceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service: Service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p>{service.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.duration} min
                        </p>
                      </div>
                      <Badge variant="outline">
                        {formatPrice(service.price)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hora sugerida */}
          {suggestedTime && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">
                    <strong>Sugerencia:</strong> Próximo horario disponible: {suggestedTime}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hora manual */}
          <div>
            <Label htmlFor="time">Hora</Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              min="09:00"
              max="18:00"
              step="300" // 5 minutos
              required
            />
            {selectedTime && selectedService && !isTimeSlotAvailable(appointments, selectedDate, selectedTime, selectedService.duration) && (
              <p className="text-sm text-red-600 mt-1">
                ⚠️ Este horario no está disponible
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notes">Observaciones (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales para la cita..."
              rows={2}
            />
          </div>

          {/* Resumen */}
          {selectedService && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Resumen de la cita</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1 text-sm">
                <p><strong>Servicio:</strong> {selectedService.name}</p>
                <p><strong>Duración:</strong> {selectedService.duration} minutos</p>
                <p><strong>Precio:</strong> {formatPrice(selectedService.price)}</p>
                {selectedTime && (
                  <p><strong>Horario:</strong> {selectedTime} - {
                    (() => {
                      const endTime = new Date(`2000-01-01 ${selectedTime}`);
                      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);
                      return endTime.toTimeString().slice(0, 5);
                    })()
                  }</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Agregar Cita
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}