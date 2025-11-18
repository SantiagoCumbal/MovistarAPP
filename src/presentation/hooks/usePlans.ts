import { PlansUseCase } from '@/src/domain/useCases/plans/PlansUseCase';
import { useEffect, useState } from 'react';

const plansUseCase = new PlansUseCase();

export function usePlans() {
  const [planes, setPlanes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPlanes();
  }, []);

  const cargarPlanes = async () => {
    setCargando(true);
    const data = await plansUseCase.obtenerPlanes();
    setPlanes(data);
    setCargando(false);
  };

  const buscar = async (q: string) => {
    setCargando(true);
    const data = await plansUseCase.buscarPorTitulo(q);
    setPlanes(data);
    setCargando(false);
  };

  const crear = async (
    titulo: string,
    precio: number,
    datos_gb: number,
    minutos: number,
    descripcion: string | null,
    promocion: string | null,
    creadoPor: string,
    imagenUri?: string
  ) => {
    const resultado = await plansUseCase.crearPlan(titulo, precio, datos_gb, minutos, descripcion, promocion, creadoPor, imagenUri);
    if (resultado.success) await cargarPlanes();
    return resultado;
  };

  const actualizar = async (
    id: string,
    titulo: string,
    precio: number,
    datos_gb: number,
    minutos: number,
    descripcion: string | null,
    promocion: string | null,
    nuevaImagenUri?: string
  ) => {
    const resultado = await plansUseCase.actualizarPlan(id, titulo, precio, datos_gb, minutos, descripcion, promocion, nuevaImagenUri);
    if (resultado.success) await cargarPlanes();
    return resultado;
  };

  const eliminar = async (id: string) => {
    const resultado = await plansUseCase.eliminarPlan(id);
    if (resultado.success) await cargarPlanes();
    return resultado;
  };

  const seleccionarImagen = async () => {
    return await plansUseCase.seleccionarImagen();
  };

  const seleccionarImagenCamara = async () => {
    return await plansUseCase.seleccionarImagenCamara();
  };

  return {
    planes,
    cargando,
    cargarPlanes,
    buscar,
    crear,
    actualizar,
    eliminar,
    seleccionarImagen,
    seleccionarImagenCamara,
  };
}
