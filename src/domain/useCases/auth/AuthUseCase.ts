import { supabase } from "@/src/data/services/supabaseClient";
import { Usuario } from "../../models/Usuario";

/**
 * AuthUseCase - Caso de Uso de Autenticación
 *
 * Maneja registro, inicio/cierre de sesión y obtención de usuario actual.
 */
export class AuthUseCase {
  /**
   * Registrar nuevo usuario
   */
  async registrar(
    email: string,
    password: string,
    nombre: string,
    telefono: string
  ) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Upsert en la tabla `usuarios` sin establecer rol: el rol se asigna por defecto desde Supabase/DB (trigger)
      const upsertPayload = {
        id: authData.user.id,
        // fallback to the provided email param if authData.user.email is null
        email: authData.user.email ?? email,
        nombre: nombre || null,
        telefono: telefono || null,
        rol: 'usuario', // evitar condición de carrera con el trigger y la columna NOT NULL
      };

      const { error: upsertError } = await supabase.from("usuarios").upsert(upsertPayload, { onConflict: "id" });

      if (upsertError) throw upsertError;

      return { success: true, user: await this.obtenerUsuarioActual() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Iniciar sesión
   */
  async iniciarSesion(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Obtener datos completos del usuario desde la tabla
      const usuarioCompleto = await this.obtenerUsuarioActual();

      return { success: true, user: usuarioCompleto };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar email de restablecimiento de contraseña
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cargar sesión actual (al abrir la app)
   */
  async cargarSesion(): Promise<Usuario | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const usuarioCompleto = await this.obtenerUsuarioActual();
      return usuarioCompleto;
    } catch (error) {
      console.log("Error al cargar sesión:", error);
      return null;
    }
  }

  /**
   * Cerrar sesión
   */
  async cerrarSesion() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener usuario actual con todos sus datos
   */
  async obtenerUsuarioActual(): Promise<Usuario | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as Usuario;
    } catch (error) {
      console.log("Error al obtener usuario:", error);
      return null;
    }
  }

  /**
   * Escuchar cambios de autenticación en tiempo real
   */
  onAuthStateChange(callback: (usuario: Usuario | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const usuario = await this.obtenerUsuarioActual();
        callback(usuario);
      } else {
        callback(null);
      }
    });
  }
}
