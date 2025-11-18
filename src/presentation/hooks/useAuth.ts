import { useEffect, useState } from "react";
// Ya no necesitamos AsyncStorage, ya que Supabase lo maneja internamente.
import { Usuario } from "../../domain/models/Usuario";
import { AuthUseCase } from "../../domain/useCases/auth/AuthUseCase";

const authUseCase = new AuthUseCase();

/**
 * useAuth - Hook personalizado para manejar el estado de autenticación de la aplicación.
 * Confía en el listener de Supabase para mantener el estado sincronizado en tiempo real.
 */
export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Función específica para la carga inicial de la app
  const cargarSesionInicial = async () => {
    setCargando(true);
    try {
      // Intenta obtener la sesión completa. Si el token está en el storage (persistido),
      // Supabase lo usa y obtiene el usuario completo de la base de datos.
      const usuarioActual = await authUseCase.obtenerUsuarioActual();
      setUsuario(usuarioActual);
    } catch (error) {
      // Manejo de errores de carga
      console.log("Error al cargar sesión inicial:", error);
      setUsuario(null);
    } finally {
      // La carga inicial siempre termina el proceso de "cargando".
      setCargando(false);
    }
  };

  useEffect(() => {
    // 1. Cargar sesión guardada al montar el componente
    cargarSesionInicial();

    // 2. Escuchar cambios de sesión en Supabase (listener en tiempo real)
    // El listener es crucial, ya que se dispara tras `signIn`, `signUp`, y `signOut`.
    const { data: subscription } = authUseCase.onAuthStateChange((user) => {
      // El listener es la única fuente de verdad para el estado 'usuario'.
      setUsuario(user);
    });

    // Limpieza: Desuscribirse al desmontar
    return () => subscription.subscription.unsubscribe();
  }, []); // Dependencias vacías: solo se ejecuta una vez al inicio

  const registrar = async (
    email: string,
    password: string,
    nombre: string,
    telefono: string
  ) => {
    const resultado = await authUseCase.registrar(email, password, nombre, telefono);
    // Si el registro fue exitoso, el onAuthStateChange actualizará 'usuario' por nosotros.
    // No necesitamos llamar a setUsuario() aquí.
    return resultado;
  };

  const iniciarSesion = async (email: string, password: string) => {
    const resultado = await authUseCase.iniciarSesion(email, password);
    // Si el inicio de sesión fue exitoso, el onAuthStateChange actualizará 'usuario' por nosotros.
    // No necesitamos llamar a setUsuario() aquí.
    return resultado;
  };

  const resetPassword = async (email: string) => {
    const resultado = await authUseCase.resetPassword(email);
    return resultado;
  };

  const cerrarSesion = async () => {
    const resultado = await authUseCase.cerrarSesion();
    // Cuando el cierre de sesión es exitoso, el onAuthStateChange enviará 'null',
    // actualizando el estado `usuario` automáticamente.
    return resultado;
  };

  return {
    usuario,
    cargando,
    registrar,
    iniciarSesion,
    resetPassword,
    cerrarSesion,
    es: usuario?.rol === "asesor",
  };
}