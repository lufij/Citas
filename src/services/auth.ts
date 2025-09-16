import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/supabase'

export interface LoginCredentials {
  email: string
  password: string
  name?: string
  phone?: string
  userType?: 'client' | 'admin'
}

export interface User {
  id: string
  name: string
  phone?: string
  type: 'client' | 'admin'
}

export class AuthService {
  // Registrar nuevo usuario
  static async signUp(credentials: LoginCredentials): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            phone: credentials.phone,
            user_type: credentials.userType || 'client'
          }
        }
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (data.user) {
        // Crear perfil del usuario
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: credentials.name!,
            phone: credentials.phone,
            user_type: credentials.userType || 'client'
          })

        if (profileError) {
          return { user: null, error: profileError.message }
        }

        return {
          user: {
            id: data.user.id,
            name: credentials.name!,
            phone: credentials.phone,
            type: credentials.userType || 'client'
          },
          error: null
        }
      }

      return { user: null, error: 'Error al crear usuario' }
    } catch (error) {
      return { user: null, error: 'Error de conexión' }
    }
  }

  // Iniciar sesión
  static async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (data.user) {
        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          return { user: null, error: 'Error al obtener perfil de usuario' }
        }

        return {
          user: {
            id: profile.id,
            name: profile.name,
            phone: profile.phone,
            type: profile.user_type
          },
          error: null
        }
      }

      return { user: null, error: 'Error al iniciar sesión' }
    } catch (error) {
      return { user: null, error: 'Error de conexión' }
    }
  }

  // Cerrar sesión
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      return { error: 'Error de conexión' }
    }
  }

  // Obtener usuario actual
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return null

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile) return null

      return {
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        type: profile.user_type
      }
    } catch (error) {
      return null
    }
  }

  // Escuchar cambios de autenticación
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}