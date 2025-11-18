import { useEffect, useState } from "react";
import { Usuario } from "../../domain/models/Usuario";
import { AuthUseCase } from "../../domain/useCases/auth/AuthUseCase";

const authUseCase = new AuthUseCase();

// Estado global en memoria para compartir la sesión "invitado" entre
// múltiples instancias del hook `useAuth` dentro de la misma ejecución.
let globalGuest: Usuario | null = null;
let globalGuestSubscribers: (() => void)[] = [];

function setGlobalGuest(g: Usuario | null) {
  globalGuest = g;
  globalGuestSubscribers.forEach((cb) => cb());
}

function getGlobalGuest() {
  return globalGuest;
}

function subscribeGlobalGuest(cb: () => void) {
  globalGuestSubscribers.push(cb);
  return () => {
    globalGuestSubscribers = globalGuestSubscribers.filter((s) => s !== cb);
  };
}

/**
 * useAuth - Hook personalizado para manejar el estado de autenticación de la aplicación.
 * Mantiene tres estados principales:
 *  - usuario: datos del usuario real (o el objeto invitado cuando corresponde)
 *  - cargando: bandera de carga inicial
 *  - invitado: booleano que indica que la sesión actual es una sesión de invitado en memoria
 */
export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [invitado, setInvitado] = useState(false);

  useEffect(() => {
    const cargarSesionInicial = async () => {
      setCargando(true);
      try {
        const usuarioActual = await authUseCase.obtenerUsuarioActual();
        if (usuarioActual) {
          setUsuario(usuarioActual);
          setInvitado(false);
        } else {
          setUsuario(null);
          setInvitado(false);
        }
      } catch (error) {
        console.log("Error al cargar sesión inicial:", error);
        setUsuario(null);
        setInvitado(false);
      } finally {
        setCargando(false);
      }
    };

    cargarSesionInicial();

    // Si hay un invitado almacenado en el singleton global, restáuralo en esta instancia
    const g = getGlobalGuest();
    if (g) {
      setUsuario(g);
      setInvitado(true);
    }

    // Suscribir a cambios de sesión en Supabase.
    // Si llega un usuario real, lo seteamos; si llega null, dejamos la app sin sesión
    // (la sesión invitado no se restaura automáticamente desde storage).
    const { data: subscription } = authUseCase.onAuthStateChange((user) => {
      if (user) {
        // Si hay un usuario real, limpiar cualquier invitado global
        setGlobalGuest(null);
        setUsuario(user);
        setInvitado(false);
      } else {
        setUsuario(null);
        setInvitado(false);
      }
    });

    const unsubGlobal = subscribeGlobalGuest(async () => {
      const gg = getGlobalGuest();
      if (gg) {
        setUsuario(gg);
        setInvitado(true);
        return;
      }
      // Si ya no hay invitado global, comprobar si hay un usuario real en Supabase
      const u = await authUseCase.obtenerUsuarioActual();
      if (u) {
        setUsuario(u);
        setInvitado(false);
      } else {
        setUsuario(null);
        setInvitado(false);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
      unsubGlobal();
    };
  }, []);

  const registrar = async (
    email: string,
    password: string,
    nombre: string,
    telefono: string
  ) => {
    const resultado = await authUseCase.registrar(email, password, nombre, telefono);
    return resultado;
  };

  const iniciarSesion = async (email: string, password: string) => {
    const resultado = await authUseCase.iniciarSesion(email, password);
    return resultado;
  };

  const resetPassword = async (email: string) => {
    const resultado = await authUseCase.resetPassword(email);
    return resultado;
  };

  const cerrarSesion = async () => {
    const resultado = await authUseCase.cerrarSesion();
    // Limpiar estado local
    setGlobalGuest(null);
    setUsuario(null);
    setInvitado(false);
    return resultado;
  };

  // Invitado en memoria solamente (no persistimos en storage)
  const iniciarComoInvitado = () => {
    const invitadoObj: Usuario = {
      id: `guest-${Date.now()}`,
      email: "",
      nombre: "Invitado",
      telefono: "",
      rol: "usuario",
    };
    // Guardar en el singleton global para que todas las instancias del hook
    // lo vean mientras la app esté abierta.
    setGlobalGuest(invitadoObj);
    setUsuario(invitadoObj);
    setInvitado(true);
    return invitadoObj;
  };

  return {
    usuario,
    cargando,
    registrar,
    iniciarSesion,
    resetPassword,
    cerrarSesion,
    iniciarComoInvitado,
    es: usuario?.rol === "asesor",
    esInvitado: invitado,
  } as const;
}