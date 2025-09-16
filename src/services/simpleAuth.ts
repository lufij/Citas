import { supabase } from '../lib/supabase'

export interface SimpleUser {
  id: string
  phone: string
  firstName: string
  lastName: string
  fullName: string
  type: 'client' | 'admin'
}

export interface LoginData {
  phone: string
  firstName: string
  lastName: string
}

export class SimpleAuthService {
  
  // Login o registro automático por número de teléfono
  static async loginOrRegister(data: LoginData): Promise<{ user: SimpleUser | null; error: string | null }> {
    try {
      const cleanPhone = data.phone.trim();
      const firstName = data.firstName.trim();
      const lastName = data.lastName.trim();

      if (!cleanPhone || !firstName || !lastName) {
        return { user: null, error: 'Por favor completa todos los campos' };
      }

      // Verificar si el usuario ya existe
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhone)
        .single();

      if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows found
        return { user: null, error: 'Error al buscar usuario: ' + searchError.message };
      }

      let user: SimpleUser;

      if (existingUser) {
        // Usuario existe - hacer login
        user = {
          id: existingUser.id,
          phone: existingUser.phone,
          firstName: existingUser.first_name,
          lastName: existingUser.last_name,
          fullName: `${existingUser.first_name} ${existingUser.last_name}`,
          type: existingUser.user_type
        };
      } else {
        // Usuario no existe - crear nuevo
        const userType = cleanPhone === '42243067' ? 'admin' : 'client';
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            phone: cleanPhone,
            first_name: firstName,
            last_name: lastName,
            user_type: userType
          })
          .select()
          .single();

        if (createError) {
          return { user: null, error: 'Error al crear usuario: ' + createError.message };
        }

        user = {
          id: newUser.id,
          phone: newUser.phone,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          fullName: `${newUser.first_name} ${newUser.last_name}`,
          type: newUser.user_type
        };
      }

      // Guardar en localStorage para persistencia
      localStorage.setItem('barberia-user', JSON.stringify(user));

      return { user, error: null };
    } catch (error) {
      return { user: null, error: 'Error de conexión' };
    }
  }

  // Obtener usuario actual desde localStorage
  static getCurrentUser(): SimpleUser | null {
    try {
      const stored = localStorage.getItem('barberia-user');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Cerrar sesión
  static logout(): void {
    localStorage.removeItem('barberia-user');
  }

  // Verificar si un número es administrador
  static isAdminPhone(phone: string): boolean {
    return phone.trim() === '42243067';
  }

  // Obtener todos los usuarios (solo para admin)
  static async getAllUsers(): Promise<{ users: SimpleUser[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { users: [], error: error.message };
      }

      const users = data.map(user => ({
        id: user.id,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        type: user.user_type
      }));

      return { users, error: null };
    } catch (error) {
      return { users: [], error: 'Error de conexión' };
    }
  }

  // Buscar usuario por teléfono
  static async findUserByPhone(phone: string): Promise<{ user: SimpleUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { user: null, error: null }; // Usuario no encontrado
        }
        return { user: null, error: error.message };
      }

      const user: SimpleUser = {
        id: data.id,
        phone: data.phone,
        firstName: data.first_name,
        lastName: data.last_name,
        fullName: `${data.first_name} ${data.last_name}`,
        type: data.user_type
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: 'Error de conexión' };
    }
  }
}