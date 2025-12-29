'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 1. Definimos la estructura de los datos que vienen de la consulta JOIN
interface ParadaItinerario {
  orden: number;
  hora_estimada: string;
  precio_acumulado: number;
  terminales: {
    nombre_terminal: string;
    ciudades: {
      nombre_ciudad: string;
    } | null;
  } | null;
}

interface ItinerarioProps {
  frecuenciaId: number;
}

export function Itinerario({ frecuenciaId }: ItinerarioProps) {
  // 2. Tipamos el estado como un arreglo de ParadaItinerario
  const [paradas, setParadas] = useState<ParadaItinerario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItinerario = async () => {
      // Especificamos el tipado en la consulta de Supabase
      const { data, error } = await supabase
        .from('paradas_frecuencia')
        .select(`
          orden, 
          hora_estimada, 
          precio_acumulado,
          terminales (
            nombre_terminal, 
            ciudades (nombre_ciudad)
          )
        `)
        .eq('frecuencia_id', frecuenciaId)
        .order('orden', { ascending: true });
      
      if (error) {
        console.error('Error cargando itinerario:', error);
      } else {
        // Hacemos un cast seguro de los datos
        setParadas((data as unknown as ParadaItinerario[]) || []);
      }
      setLoading(false);
    };

    fetchItinerario();
  }, [frecuenciaId]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 flex justify-center items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-xs text-gray-400 font-medium">Cargando itinerario de viaje...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-b-2xl border-t border-gray-100">
      <h4 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">
        Itinerario de viaje
      </h4>
      <div className="relative">
        {paradas.map((p, index) => (
          <div key={index} className="flex items-start gap-4 group">
            {/* Indicador visual de línea de tiempo */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 ${
                index === 0 ? 'bg-blue-600 border-blue-200' : 'bg-white border-gray-300'
              } z-10 transition-colors group-hover:border-blue-400`}></div>
              {index !== paradas.length - 1 && (
                <div className="w-[2px] h-12 bg-gradient-to-b from-gray-200 to-gray-100 -mt-1 -mb-1"></div>
              )}
            </div>

            {/* Información de la Parada */}
            <div className="flex-1 pb-6">
              <div className="flex justify-between items-baseline">
                <p className="font-bold text-gray-700 text-sm">
                  {p.terminales?.ciudades?.nombre_ciudad || 'Ciudad no definida'}
                </p>
                <div className="flex items-center gap-2">
                
                  <p className="text-xs font-mono font-bold text-blue-600">
                    {p.hora_estimada.slice(0, 5)}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">
                {p.terminales?.nombre_terminal || 'Terminal no definida'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}