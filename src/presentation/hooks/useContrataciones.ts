import { ContratacionesUseCase } from '@/src/domain/useCases/contrataciones/ContratacionesUseCase';
import { useState } from 'react';

const usecase = new ContratacionesUseCase();

export function useContrataciones() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listarPorUsuario = async (usuarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await usecase.obtenerPorUsuario(usuarioId);
      if (res.success) {
        setItems(res.data ?? []);
      } else {
        setError(res.error ?? 'Error desconocido');
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const listarTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usecase.obtenerTodas();
      if (res.success) {
        setItems(res.data ?? []);
      } else {
        setError(res.error ?? 'Error desconocido');
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const crear = async (usuarioId: string, planId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await usecase.crearContratacion(usuarioId, planId);
      if (res.success) {
        // refrescar lista
        await listarPorUsuario(usuarioId);
      } else {
        setError(res.error ?? 'Error creando contratación');
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id: string, estado: 'pendiente' | 'aceptada' | 'rechazada') => {
    setLoading(true);
    setError(null);
    try {
      const res = await usecase.actualizarEstado(id, estado);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, error, listarPorUsuario, listarTodos, crear, cambiarEstado, setItems } as const;
}

export default useContrataciones;
