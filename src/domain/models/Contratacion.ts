export interface Contratacion {
    id: string;
    usuario_id: string;
    plan_id: string;
    estado: "pendiente" | "aceptada" | "rechazada";
    created_at: string;

    // Opcional: Joins (si decides hacer relaciones más adelante)
    usuario?: {
        email: string;
        rol: string;
    };

    plan?: {
        nombre: string;
        precio: number;
        gigas: number;
        minutos: number;
        descripcion: string;
        promocion: string | null;
    };
}
