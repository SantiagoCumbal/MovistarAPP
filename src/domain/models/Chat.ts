export interface Mensaje {
    id: string;
    contenido: string;
    sender_id: string;     // quién envía
    receiver_id: string;   // quién recibe
    created_at: string;

    // Datos opcionales del usuario (cuando haces JOIN)
    usuario?: {
        email: string;
        rol: string;
    };

    // Información completa del sender y receiver cuando se realiza JOIN
    sender?: {
        id?: string;
        nombre?: string;
        email?: string;
        rol?: string;
    } | null;
    receiver?: {
        id?: string;
        nombre?: string;
        email?: string;
        rol?: string;
    } | null;
}

export interface EventoEscritura {
    usuario_id: string;
    usuario_email: string;
    timestamp: number;
}
