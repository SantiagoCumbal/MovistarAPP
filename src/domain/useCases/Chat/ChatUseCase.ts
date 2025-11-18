import { supabase } from "@/src/data/services/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { EventoEscritura, Mensaje } from "../../models/Chat";

export class ChatUseCase {
    private channel: RealtimeChannel | null = null;
    private typingChannel: RealtimeChannel | null = null;
    private conversacionChannel: RealtimeChannel | null = null;

    // ======================================================
    //  Obtener mensajes (con sender y receiver completos)
    // ======================================================
    async obtenerMensajes(limite: number = 50): Promise<Mensaje[]> {
        try {
        const { data, error } = await supabase
            .from("mensajes_chat")
            .select(`
            *,
            sender:usuarios!mensajes_chat_sender_id_fkey(id, nombre, email, rol),
            receiver:usuarios!mensajes_chat_receiver_id_fkey(id, nombre, email, rol)
            `)
            .order("created_at", { ascending: false })
            .limit(limite);

        if (error) throw error;

        const mensajesFormateados = (data || []).map((m: any) => ({
            id: m.id,
            contenido: m.contenido,
            sender_id: m.sender_id,
            receiver_id: m.receiver_id,
            created_at: m.created_at,
            // Incluimos tanto sender como receiver para facilitar el inbox
            sender: m.sender,
            receiver: m.receiver,
            usuario: m.sender,
        }));

        return mensajesFormateados.reverse();
        } catch (error) {
        console.error("Error al obtener mensajes:", error);
        return [];
        }
    }

    // ======================================================
    //  Obtener conversación 1:1 filtrada por otro usuario
    // ======================================================
    async obtenerConversacionConUsuario(otroUsuarioId: string): Promise<Mensaje[]> {
        try {
            const { data: authData, error: authErr } = await supabase.auth.getUser();
            if (authErr) throw authErr;
            const me = authData.user;
            if (!me) return [];

            const { data, error } = await supabase
                .from("mensajes_chat")
                .select(`
                    *,
                    sender:usuarios!mensajes_chat_sender_id_fkey(id, nombre, email, rol),
                    receiver:usuarios!mensajes_chat_receiver_id_fkey(id, nombre, email, rol)
                `)
                .or(`and(sender_id.eq.${me.id},receiver_id.eq.${otroUsuarioId}),and(sender_id.eq.${otroUsuarioId},receiver_id.eq.${me.id})`)
                .order("created_at", { ascending: true });

            if (error) throw error;

            return (data || []).map((m: any) => ({
                id: m.id,
                contenido: m.contenido,
                sender_id: m.sender_id,
                receiver_id: m.receiver_id,
                created_at: m.created_at,
                sender: m.sender,
                receiver: m.receiver,
                usuario: m.sender,
            }));
        } catch (e) {
            console.error("Error obtener conversacion:", e);
            return [];
        }
    }

    // ======================================================
    //  Enviar mensaje (sender -> receiver)
    // ======================================================
    async enviarMensaje(contenido: string, receiverId: string) {
        try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const user = authData.user;
        if (!user) return { success: false, error: "Usuario no autenticado" };

        const { error } = await supabase.from("mensajes_chat").insert({
            contenido,
            sender_id: user.id,
            receiver_id: receiverId,
        });

        if (error) throw error;

        return { success: true };
        } catch (error: any) {
        console.error("Error al enviar mensaje:", error);
        return { success: false, error: error.message || String(error) };
        }
    }

    //--------------------------------------------------------
    // Suscribirse al realtime de mensajes
    //--------------------------------------------------------
    suscribirseAMensajes(callback: (mensaje: Mensaje) => void) {
        this.channel = supabase.channel("mensajes-realtime");

        this.channel
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "mensajes_chat" },
            async (payload) => {
            try {
                // obtener mensaje completo con join
                const { data, error } = await supabase
                .from("mensajes_chat")
                .select(`
                    *,
                    sender:usuarios!mensajes_chat_sender_id_fkey(id, nombre, email, rol),
                    receiver:usuarios!mensajes_chat_receiver_id_fkey(id, nombre, email, rol)
                `)
                .eq("id", payload.new.id)
                .single();

                if (error || !data) {
                // fallback mínimo
                const fallback: Mensaje = {
                    id: payload.new.id,
                    contenido: payload.new.contenido,
                    sender_id: payload.new.sender_id,
                    receiver_id: payload.new.receiver_id,
                    created_at: payload.new.created_at,
                    sender: null,
                    receiver: null,
                    usuario: {
                    email: "Desconocido",
                    rol: "usuario",
                    },
                };
                callback(fallback);
                return;
                }

                const mensaje: Mensaje = {
                id: data.id,
                contenido: data.contenido,
                sender_id: data.sender_id,
                receiver_id: data.receiver_id,
                created_at: data.created_at,
                sender: data.sender,
                receiver: data.receiver,
                usuario: data.sender, // información del remitente
                };

                callback(mensaje);
            } catch (err) {
                console.error("Error en payload realtime:", err);
            }
            }
        )
        .subscribe((status) => {
            console.log("Estado suscripción mensajes:", status);
        });

        return () => {
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }
        };
    }

    // ------------------------------------------------------
    // Suscribirse a UNA conversación 1:1
    // ------------------------------------------------------
    suscribirseAConversacion(otroUsuarioId: string, callback: (mensaje: Mensaje) => void) {
        this.conversacionChannel = supabase.channel(`conv-${otroUsuarioId}`);

        this.conversacionChannel
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "mensajes_chat" },
                async (payload) => {
                    try {
                        const nuevo = payload.new;
                        const { data: authData } = await supabase.auth.getUser();
                        const me = authData?.user;
                        if (!me) return;
                        // Filtrar solo mensajes de la pareja
                        const pertenece = (
                            (nuevo.sender_id === me.id && nuevo.receiver_id === otroUsuarioId) ||
                            (nuevo.sender_id === otroUsuarioId && nuevo.receiver_id === me.id)
                        );
                        if (!pertenece) return;

                        const { data, error } = await supabase
                            .from("mensajes_chat")
                            .select(`
                                *,
                                sender:usuarios!mensajes_chat_sender_id_fkey(id, nombre, email, rol),
                                receiver:usuarios!mensajes_chat_receiver_id_fkey(id, nombre, email, rol)
                            `)
                            .eq("id", nuevo.id)
                            .single();
                        if (error || !data) return;

                        const mensaje: Mensaje = {
                            id: data.id,
                            contenido: data.contenido,
                            sender_id: data.sender_id,
                            receiver_id: data.receiver_id,
                            created_at: data.created_at,
                            usuario: data.sender,
                        };
                        callback(mensaje);
                    } catch (err) {
                        console.error("Error realtime conversacion:", err);
                    }
                }
            )
            .subscribe();

        return () => {
            if (this.conversacionChannel) {
                supabase.removeChannel(this.conversacionChannel);
                this.conversacionChannel = null;
            }
        };
    }

    // ======================================================
    //  Notificar "escribiendo..."
    // ======================================================
    async notificarEscribiendo() {
        try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) return;

        if (!this.typingChannel) {
            this.typingChannel = supabase.channel("typing-channel");
            this.typingChannel.subscribe();
        }

        await this.typingChannel.send({
            type: "broadcast",
            event: "typing",
            payload: {
            usuario_id: user.id,
            usuario_email: user.email,
            timestamp: Date.now(),
            },
        });
        } catch (error) {
        console.error("Error al notificar escribiendo:", error);
        }
    }

    //--------------------------------------------------------
    // Suscripción a eventos de escritura (typing)
    //--------------------------------------------------------
    suscribirseAEscritura(callback: (evento: EventoEscritura) => void) {
        if (!this.typingChannel) {
        this.typingChannel = supabase.channel("typing-channel");
        }

        this.typingChannel
        .on("broadcast", { event: "typing" }, ({ payload }) =>
            callback(payload as EventoEscritura)
        )
        .subscribe((status) => {
            console.log("Estado typing subscription:", status);
        });

        return () => {
        if (this.typingChannel) {
            supabase.removeChannel(this.typingChannel);
            this.typingChannel = null;
        }
        };
    }

    // ======================================================
    //  Eliminar mensaje (solo si el RLS lo permite)
    // ======================================================
    async eliminarMensaje(mensajeId: string) {
        try {
        const { error } = await supabase
            .from("mensajes_chat")
            .delete()
            .eq("id", mensajeId);

        if (error) throw error;
        return { success: true };
        } catch (error: any) {
        console.error("Error al eliminar mensaje:", error);
        return { success: false, error: error.message || String(error) };
        }
    }
}
