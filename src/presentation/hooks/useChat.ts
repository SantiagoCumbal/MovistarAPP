import { EventoEscritura, Mensaje } from "@/src/domain/models/Chat";
import { ChatUseCase } from "@/src/domain/useCases/Chat/ChatUseCase";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";

const chatUseCase = new ChatUseCase();

export const useChat = () => {
    const { usuario } = useAuth();
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [conversacion, setConversacion] = useState<Mensaje[]>([]);
    const [currentReceiver, setCurrentReceiver] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [usuariosEscribiendo, setUsuariosEscribiendo] = useState<Map<string, EventoEscritura>>(new Map());

    // Usamos el tipo cross-env para timeouts
    const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const cargarMensajes = useCallback(async () => {
        setCargando(true);
        const mensajesObtenidos = await chatUseCase.obtenerMensajes();
        setMensajes(mensajesObtenidos);
        setCargando(false);
    }, []);

    const cargarConversacionCon = useCallback(async (otroUsuarioId: string) => {
        setCargando(true);
        // limpiar suscripción previa de conversación
        try {
            if (typeof (cargarConversacionCon as any).__unsubscribe === 'function') {
                (cargarConversacionCon as any).__unsubscribe();
            }
        } catch (err) {
            console.warn('Error cleaning previous conversation subscription', err);
        }

        const mensajesObtenidos = await chatUseCase.obtenerConversacionConUsuario(otroUsuarioId);
        setConversacion(mensajesObtenidos);
        setCurrentReceiver(otroUsuarioId);

        // Suscribirse a la conversación 1:1 para recibir mensajes en tiempo real
        const desuscribir = chatUseCase.suscribirseAConversacion(otroUsuarioId, (nuevoMensaje) => {
            setConversacion((prev) => {
                // si ya existe por id, no duplicar
                if (prev.some((m) => m.id === nuevoMensaje.id)) return prev;

                // si existe un mensaje optimista (id empieza por tmp-) con mismo contenido y mismo sender, reemplazarlo
                const idx = prev.findIndex((m) => m.id?.toString().startsWith('tmp-') && m.contenido === nuevoMensaje.contenido && m.sender_id === nuevoMensaje.sender_id);
                if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = nuevoMensaje;
                    return copy;
                }

                return [...prev, nuevoMensaje];
            });
        });

        // guardar el unsubscribe en la misma función para que podamos limpiarlo en próximas llamadas
        (cargarConversacionCon as any).__unsubscribe = desuscribir;

        setCargando(false);
        return mensajesObtenidos;
    }, []);

    // Ahora requiere receiverId para chats 1:1
    const enviarMensaje = useCallback(async (contenido: string, receiverId: string) => {
        if (!contenido.trim()) return { success: false, error: "El mensaje está vacío" };

        setEnviando(true);
        // Optimistic UI: añadir mensaje temporalmente
        const tempId = `tmp-${Date.now()}`;
        const optimist: Mensaje = {
            id: tempId as any,
            contenido,
            sender_id: usuario?.id ?? 'unknown',
            receiver_id: receiverId,
            created_at: new Date().toISOString(),
            usuario: { email: usuario?.email ?? '', rol: usuario?.rol ?? 'usuario' },
        };

        setConversacion((prev) => [...prev, optimist]);

        const resultado = await chatUseCase.enviarMensaje(contenido, receiverId);

        // No recargamos explícitamente; la suscripción en tiempo real reemplazará el optimista
        setEnviando(false);

        return resultado;
    }, [usuario]);

    const eliminarMensaje = useCallback(async (mensajeId: string) => {
        const resultado = await chatUseCase.eliminarMensaje(mensajeId);
        if (resultado.success) {
        setMensajes((prev) => prev.filter((m) => m.id !== mensajeId));
        }
        return resultado;
    }, []);

    const notificarEscribiendo = useCallback(() => {
        if (usuario?.email) {
        chatUseCase.notificarEscribiendo();
        }
    }, [usuario]);

    const manejarEventoEscritura = useCallback((evento: EventoEscritura) => {
        if (evento.usuario_id === usuario?.id) return;

        setUsuariosEscribiendo((prev) => {
        const nuevo = new Map(prev);
        nuevo.set(evento.usuario_id, evento);
        return nuevo;
        });

        const timeoutAnterior = timeoutRefs.current.get(evento.usuario_id);
        if (timeoutAnterior) clearTimeout(timeoutAnterior);

        const nuevoTimeout = setTimeout(() => {
        setUsuariosEscribiendo((prev) => {
            const nuevo = new Map(prev);
            nuevo.delete(evento.usuario_id);
            return nuevo;
        });
        timeoutRefs.current.delete(evento.usuario_id);
        }, 2000);

        timeoutRefs.current.set(evento.usuario_id, nuevoTimeout);
    }, [usuario?.id]);

    useEffect(() => {
        const localTimeouts = timeoutRefs.current;
        cargarMensajes();

        const desuscribirMensajes = chatUseCase.suscribirseAMensajes((nuevoMensaje) => {
        setMensajes((prev) => {
            if (prev.some((m) => m.id === nuevoMensaje.id)) return prev;
            return [...prev, nuevoMensaje];
        });
        });

        const desuscribirEscritura = chatUseCase.suscribirseAEscritura(manejarEventoEscritura);

        return () => {
        if (typeof desuscribirMensajes === 'function') desuscribirMensajes();
        if (typeof desuscribirEscritura === 'function') desuscribirEscritura();

        // limpiar suscripción de conversación si existe
        try {
            if (typeof (cargarConversacionCon as any).__unsubscribe === 'function') {
                (cargarConversacionCon as any).__unsubscribe();
            }
        } catch (err) {
            console.warn('Error cleaning conversation subscription on unmount', err);
        }

        const timeouts = Array.from(localTimeouts.values());
        timeouts.forEach((t) => clearTimeout(t));
        localTimeouts.clear();
        };
    }, [cargarMensajes, manejarEventoEscritura, cargarConversacionCon]);

    return {
        mensajes,
        conversacion,
        currentReceiver,
        cargando,
        enviando,
        enviarMensaje, // ahora requiere (contenido, receiverId)
        eliminarMensaje,
        recargarMensajes: cargarMensajes,
        cargarConversacionCon,
        cerrarConversacion: () => {
            try {
                if (typeof (cargarConversacionCon as any).__unsubscribe === 'function') {
                    (cargarConversacionCon as any).__unsubscribe();
                }
            } catch {
                // ignore
            }
            setConversacion([]);
            setCurrentReceiver(null);
        },
        notificarEscribiendo,
        usuariosEscribiendo: Array.from(usuariosEscribiendo.values()),
    };
};
