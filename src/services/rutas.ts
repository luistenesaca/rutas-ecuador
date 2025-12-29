import { supabase } from '../lib/supabase';

export const buscarBuses = async (origenId: number, destinoId: number) => {
  const { data, error } = await supabase
    .from('paradas_frecuencia')
    .select(`
      frecuencia_id,
      orden,
      precio_acumulado,
      hora_estimada,
      frecuencias (
        denominacion_ruta,
        tipo_servicio,
        cooperativas (nombre_cooperativa, logo_url)
      )
    `)
    .in('terminal_id', [origenId, destinoId]);

  if (error) throw error;
  return data;
};