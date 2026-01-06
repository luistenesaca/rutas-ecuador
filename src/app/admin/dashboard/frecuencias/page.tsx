"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  Clock,
  MapPin,
  Copy, // Añadido para la función de clonar
} from "lucide-react";

export default function FrecuenciasAdmin() {
  const router = useRouter();
  const [frecuencias, setFrecuencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFrecuencias = useCallback(async (isMounted: boolean) => {
    setLoading(true);
    try {
      const { data: frecs, error } = await supabase
        .from("frecuencias")
        .select(`
          *, 
          cooperativas(nombre_cooperativa),
          paradas_frecuencia(
            id, 
            hora_estimada, 
            orden
          )
        `)
        .order("id", { ascending: false });

      if (error) throw error;

      if (isMounted && frecs) {
        const frecsProcesadas = frecs.map((f) => {
          const paradas = f.paradas_frecuencia || [];
          const paradaSalida = paradas.find((p: any) => p.orden === 1);

          let horaLimpia = "--:--";
          if (paradaSalida?.hora_estimada) {
            horaLimpia = paradaSalida.hora_estimada.slice(0, 5);
          }

          return {
            ...f,
            hora_salida_prioritaria: horaLimpia,
            ruta_display: f.denominacion_ruta && f.denominacion_ruta.trim() !== "" 
              ? f.denominacion_ruta 
              : `RUTA #${f.id}`,
            num_paradas: paradas.length,
          };
        });

        setFrecuencias(frecsProcesadas);
      }
    } catch (err) {
      console.error("Error en fetch:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchFrecuencias(isMounted);
    return () => { isMounted = false; };
  }, [fetchFrecuencias]);

  // FUNCIÓN PARA CLONAR
  const clonarFrecuencia = (id: number) => {
    // Redirige a la página de nueva frecuencia enviando el ID original como parámetro
    router.push(`/admin/dashboard/frecuencias/nueva?clonar=${id}`);
  };

  async function deleteFrecuencia(id: number) {
    if (!confirm("¿Eliminar esta frecuencia?")) return;
    try {
      const { error } = await supabase.from("frecuencias").delete().eq("id", id);
      if (error) throw error;
      setFrecuencias(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      alert("Error al eliminar.");
    }
  }

  const filteredFrecuencias = frecuencias.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      f.cooperativas?.nombre_cooperativa?.toLowerCase().includes(term) ||
      f.ruta_display?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#09184D] tracking-tighter italic uppercase">
            Control de <span className="text-[#EA2264]">Frecuencias</span>
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Panel Administrativo</p>
        </div>
        
        <button
          onClick={() => router.push("/admin/dashboard/frecuencias/nueva")}
          className="bg-[#09184D] hover:bg-[#EA2264] transition-colors text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} strokeWidth={3} />
          Nueva Frecuencia
        </button>
      </div>

      {/* BUSCADOR Y CONTADOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por cooperativa o ruta..."
            className="w-full bg-white border border-gray-200 py-2.5 pl-10 pr-4 rounded-xl text-sm font-medium text-[#09184D] outline-none focus:border-[#EA2264] transition-all placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-100 px-4 py-2 rounded-lg">
          {filteredFrecuencias.length} Frecuencias encontradas
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#EA2264]" size={32} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Cargando datos...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Salida</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Ruta</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Operadora</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Servicio</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFrecuencias.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5 font-bold text-[#09184D]">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#EA2264]" />
                        {f.hora_salida_prioritaria}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-[#09184D] uppercase">
                        {f.ruta_display}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                        <MapPin size={10} />
                        {f.num_paradas} Paradas
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-600">
                        {f.cooperativas?.nombre_cooperativa || "---"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-xs font-bold text-gray-500 uppercase italic">
                      {f.tipo_servicio}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        {/* BOTÓN CLONAR */}
                        <button
                          onClick={() => clonarFrecuencia(f.id)}
                          title="Clonar Frecuencia"
                          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Copy size={16} />
                        </button>

                        <button
                          onClick={() => router.push(`/admin/dashboard/frecuencias/editar/${f.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        
                        <button 
                          onClick={() => deleteFrecuencia(f.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}