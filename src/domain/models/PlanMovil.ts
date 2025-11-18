export interface PlanMovil {
    id: string;
    titulo: string;
    precio: number;
    datos_gb: number;
    minutos: number;
    descripcion?: string;
    promocion?: string;
    imagen_url?: string;
    creado_por: string; // usuario id
    created_at: string;
}
