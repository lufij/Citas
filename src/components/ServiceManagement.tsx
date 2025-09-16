import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Plus, Edit, Trash2, Save, X, Settings } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { ServiceService } from '../services/serviceService';
import { toast } from 'sonner';
import type { Service } from '../lib/supabase';

interface ServiceManagementProps {
  services: Service[];
  onServicesUpdate: (services: Service[]) => void;
}

export function ServiceManagement({ services, onServicesUpdate }: ServiceManagementProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({ name: '', duration: '', price: '', description: '' });
    setEditingService(null);
    setShowAddForm(false);
  };

  const handleSaveService = async () => {
    if (!formData.name.trim() || !formData.duration || !formData.price) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const serviceData = {
      id: editingService?.id || `service_${Date.now()}`,
      name: formData.name.trim(),
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      description: formData.description.trim() || undefined,
      active: editingService?.active ?? true
    };

    // Validación
    if (serviceData.duration <= 0 || serviceData.price <= 0) {
      toast.error('La duración y el precio deben ser mayores a 0');
      return;
    }

    try {
      if (editingService) {
        // Editar servicio existente
        const { service, error } = await ServiceService.updateService(editingService.id, serviceData);
        if (error) {
          toast.error('Error al actualizar servicio: ' + error);
          return;
        }
        
        if (service) {
          const updatedServices = services.map(s => s.id === service.id ? service : s);
          onServicesUpdate(updatedServices);
          toast.success('Servicio actualizado exitosamente');
        }
      } else {
        // Crear nuevo servicio
        const { service, error } = await ServiceService.createService(serviceData);
        if (error) {
          toast.error('Error al crear servicio: ' + error);
          return;
        }
        
        if (service) {
          onServicesUpdate([...services, service]);
          toast.success('Servicio creado exitosamente');
        }
      }
      
      resetForm();
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
      description: service.description || ''
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const { service: updatedService, error } = await ServiceService.toggleService(service.id, !service.active);
      
      if (error) {
        toast.error('Error al cambiar estado del servicio: ' + error);
        return;
      }
      
      if (updatedService) {
        const updatedServices = services.map(s => s.id === service.id ? updatedService : s);
        onServicesUpdate(updatedServices);
        
        toast.success(updatedService.active ? 'Servicio activado' : 'Servicio desactivado');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`¿Estás seguro de eliminar el servicio "${service.name}"?`)) {
      return;
    }

    try {
      const { error } = await ServiceService.deleteService(service.id);
      
      if (error) {
        toast.error('Error al eliminar servicio: ' + error);
        return;
      }
      
      const updatedServices = services.filter(s => s.id !== service.id);
      onServicesUpdate(updatedServices);
      toast.success('Servicio eliminado exitosamente');
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: 'none',
          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
        }}
      >
        <Settings className="w-4 h-4 mr-2" />
        Configurar Servicios
      </Button>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gestión de Servicios
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botón agregar servicio */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Servicios de la Barbería</h3>
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>

          {/* Formulario para agregar/editar servicio */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service-name">Nombre del Servicio</Label>
                    <Input
                      id="service-name"
                      placeholder="Ej: Corte básico"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-duration">Duración (minutos)</Label>
                    <Input
                      id="service-duration"
                      type="number"
                      placeholder="30"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="service-price">Precio</Label>
                  <Input
                    id="service-price"
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="service-description">Descripción (opcional)</Label>
                  <Textarea
                    id="service-description"
                    placeholder="Descripción del servicio..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveService}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingService ? 'Actualizar' : 'Guardar'} Servicio
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de servicios */}
          <div className="grid gap-4">
            {services.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay servicios configurados
              </p>
            ) : (
              services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{service.name}</h4>
                          <Badge variant={service.active ? 'default' : 'secondary'}>
                            {service.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>{service.duration} min • {formatPrice(service.price)}</span>
                          {service.description && (
                            <p className="mt-1">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={service.active ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleActive(service)}
                        >
                          {service.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteService(service)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}