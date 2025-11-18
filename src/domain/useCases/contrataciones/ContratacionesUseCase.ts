import { supabase } from '@/src/data/services/supabaseClient';

export class ContratacionesUseCase {
  async crearContratacion(usuarioId: string, planId: string) {
    try {
      const { data, error } = await supabase
        .from('contrataciones')
        .insert({ usuario_id: usuarioId, plan_id: planId })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, contratacion: data };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }

  async obtenerPorUsuario(usuarioId: string) {
    try {
      const { data, error } = await supabase
        .from('contrataciones')
        .select('id, estado, created_at, usuarios(id, nombre), planes_moviles(id, titulo, precio, datos_gb, minutos, promocion, imagen_url)')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false });

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }

  async actualizarEstado(id: string, estado: 'pendiente' | 'aceptada' | 'rechazada') {
    try {
      const { data, error } = await supabase
        .from('contrataciones')
        .update({ estado })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, contratacion: data };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }

  async obtenerTodas() {
    try {
      const { data, error } = await supabase
        .from('contrataciones')
        .select('id, estado, created_at, usuarios(id, nombre), planes_moviles(id, titulo, precio, datos_gb, minutos, promocion, imagen_url)')
        .order('created_at', { ascending: false });

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }
}
