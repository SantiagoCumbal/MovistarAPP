import { supabase } from '@/src/data/services/supabaseClient';
import * as ImagePicker from 'expo-image-picker';

export class PlansUseCase {
  async obtenerPlanes() {
    const { data, error } = await supabase.from('planes_moviles').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error al obtener planes:', error);
      return [];
    }
    return data;
  }

  async buscarPorTitulo(titulo: string) {
    const { data, error } = await supabase
      .from('planes_moviles')
      .select('*')
      .ilike('titulo', `%${titulo}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error en búsqueda:', error);
      return [];
    }
    return data;
  }

  async obtenerPlanPorId(id: string) {
    try {
      const { data, error } = await supabase.from('planes_moviles').select('*').eq('id', id).single();
      if (error) {
        console.error('Error al obtener plan por id:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error al obtener plan por id (exception):', error);
      return null;
    }
  }

  async crearPlan(
    titulo: string,
    precio: number,
    datos_gb: number,
    minutos: number,
    descripcion: string | null,
    promocion: string | null,
    creadoPor: string,
    imagenUri?: string
  ) {
    const BUCKET = 'planes-imagenes';
    let uploadedPath: string | null = null;
    try {
      let imagenUrl: string | null = null;
      if (imagenUri) {
        const uploaded = await this.subirImagen(imagenUri);
        imagenUrl = uploaded.publicUrl;
        uploadedPath = uploaded.path;
      }

      const { data, error } = await supabase
        .from('planes_moviles')
        .insert({
          titulo,
          precio,
          datos_gb,
          minutos,
          descripcion,
          promocion,
          imagen_url: imagenUrl,
          creado_por: creadoPor,
        })
        .select()
        .single();

      if (error) {
        // si hubo upload previo, eliminar para no dejar objetos huérfanos
        if (uploadedPath) {
          await supabase.storage.from(BUCKET).remove([uploadedPath]);
        }
        throw error;
      }
      return { success: true, plan: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async actualizarPlan(
    id: string,
    titulo: string,
    precio: number,
    datos_gb: number,
    minutos: number,
    descripcion: string | null,
    promocion: string | null,
    nuevaImagenUri?: string
  ) {
    const BUCKET = 'planes-imagenes';
    let uploadedPath: string | null = null;
    try {
      let imagenUrl: string | null = null;
      if (nuevaImagenUri) {
        const uploaded = await this.subirImagen(nuevaImagenUri);
        imagenUrl = uploaded.publicUrl;
        uploadedPath = uploaded.path;
      }

      const { data, error } = await supabase
        .from('planes_moviles')
        .update({
          titulo,
          precio,
          datos_gb,
          minutos,
          descripcion,
          promocion,
          ...(imagenUrl && { imagen_url: imagenUrl }),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
        throw error;
      }
      return { success: true, plan: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async eliminarPlan(id: string) {
    const BUCKET = 'planes-imagenes';
    try {
      // obtener la fila para intentar eliminar la imagen asociada
      const { data: row, error: selectError } = await supabase.from('planes_moviles').select('imagen_url').eq('id', id).single();
      if (selectError) throw selectError;

      const imagenUrl: string | null = (row as any)?.imagen_url ?? null;
      if (imagenUrl) {
        try {
          // Tratar de extraer la ruta relativa dentro del bucket desde la URL pública
          // La URL pública suele contener `/object/public/{bucket}/{path}`
          const match = imagenUrl.match(new RegExp(`/object/public/${BUCKET}/(.+)$`));
          const path = match ? decodeURIComponent(match[1]) : null;
          if (path) {
            await supabase.storage.from(BUCKET).remove([path]);
          }
        } catch (e) {
          // no fatal: si falla la eliminación del archivo, continuamos con la eliminación DB
          console.warn('No se pudo eliminar la imagen del storage:', e);
        }
      }

      const { error } = await supabase.from('planes_moviles').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async subirImagen(uri: string): Promise<{ publicUrl: string; path: string }> {
    // Subir usando arrayBuffer para máxima compatibilidad
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const BUCKET = 'planes-imagenes';

    const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, arrayBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

    if (error) throw error;

    const path = (data as any).path ?? (data as any);
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path as string);
    const publicUrl = (urlData as any).publicUrl ?? (urlData as any).public_url ?? (urlData as any);
    return { publicUrl, path: path as string };
  }

  async seleccionarImagen(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Necesitamos permisos para acceder a tus fotos');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) return result.assets[0].uri;
      return null;
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      return null;
    }
  }

  async seleccionarImagenCamara(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Necesitamos permisos de cámara para tomar fotos.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
      if (!result.canceled) return result.assets[0].uri;
      return null;
    } catch (error) {
      console.error('Error al usar cámara:', error);
      return null;
    }
  }
}
