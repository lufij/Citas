import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Scissors, Loader2, Phone, User } from 'lucide-react';
import { SimpleAuthService } from '../services/simpleAuth';
import { toast } from 'sonner';
import type { SimpleUser } from '../services/simpleAuth';
import { BarberLogo } from './BarberLogo';

interface LoginFormProps {
  onLogin: (user: SimpleUser) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const { user, error } = await SimpleAuthService.loginOrRegister({
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      if (error) {
        toast.error(error);
        return;
      }

      if (user) {
        if (user.type === 'admin') {
          toast.success(`¡Bienvenido Administrador, ${user.fullName}!`);
        } else {
          toast.success(`¡Bienvenido, ${user.fullName}!`);
        }
        onLogin(user);
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-2xl">Aplicación Control de Citas</CardTitle>
            <CardDescription>
              Ingresa tu número y datos para acceder
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Número de Celular
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: 42243067"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                style={{ fontSize: '16px' }} // Previene zoom en móviles
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-medium">ℹ️ ¿Cómo funciona?</p>
              <p className="mt-1">
                Si ya tienes cuenta, solo ingresa tu número. 
                Si es tu primera vez, se creará automáticamente.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                fontSize: '16px',
                padding: '12px'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ingresar a Aplicación Control de Citas'
              )}
            </Button>
          </form>

          {/* Botón de acceso administrador demo */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const demoAdmin = {
                    id: 'admin-demo',
                    phone: '00000000',
                    fullName: 'Administrador Demo',
                    firstName: 'Administrador',
                    lastName: 'Demo',
                    type: 'admin' as const
                  };
                  
                  toast.success('¡Bienvenido Administrador Demo!');
                  onLogin(demoAdmin);
                } catch (error) {
                  toast.error('Error de acceso demo');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <Scissors className="mr-2 h-4 w-4" />
              Acceso Administrador Demo
            </Button>
          </div>

          {/* Crédito del desarrollador */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Aplicación creada por Luis Interiano
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}