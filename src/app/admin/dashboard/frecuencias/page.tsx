"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  Clock,
  MapPin,
  Copy,
  Filter,
  ChevronDown,
  X,
  Bus
} from "lucide-react";

export default function FrecuenciasAdmin() {
  const router = useRouter();
  const [frecuencias, setFrecuencias] = useState<any[]>([]);
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- NUEVO: Estado para el perfil del usuario ---
  const [userProfile, setUserProfile] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCooperativa, setSelectedCooperativa] = useState("");
  const [showCoopDropdown, setShowCoopDropdown] = useState(false);
  const [coopSearchTerm, setCoopSearchTerm] = useState("");
  const coopRef = useRef<HTMLDivElement>(null);

  const fetchInitialData = useCallback(async (isMounted: boolean) => {
    setLoading(true);
    try {
      // 1. Obtener el usuario y su rol ANTES de cargar datos
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("perfiles")
        .select("rol, cooperativa_id")
        .eq("id", user?.id)
        .single();
      
      if (isMounted) setUserProfile(profile);

      // 2. Cargar Cooperativas (Solo si es admin las necesita todas para el filtro)
      const { data: coops } = await supabase
        .from("cooperativas")
        .select("id, nombre_cooperativa")
        .order("nombre_cooperativa");

      if (isMounted) setCooperativas(coops || []);

      // 3. Cargar Frecuencias con FILTRO DE ROL
      let query = supabase
        .from("frecuencias")
        .select(`
          *, 
          cooperativas(id, nombre_cooperativa),
          paradas_frecuencia(id, hora_estimada, orden)
        `);

      // LÓGICA DE FILTRO: Si no es admin, filtrar por su cooperativa
      if (profile?.rol !== "admin" && profile?.cooperativa_id) {
        query = query.eq("cooperativa_id", profile.cooperativa_id);
      }

      const { data: frecs, error } = await query.order("id", { ascending: false });

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
            ruta_display: f.denominacion_ruta?.trim() || `RUTA #${f.id}`,
            num_paradas: paradas.length,
          };
        });
        setFrecuencias(frecsProcesadas);
      }
    } catch (err: any) {
      toast.error("Error al cargar datos");
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchInitialData(isMounted);

    const handleClickOutside = (event: MouseEvent) => {
      if (coopRef.current && !coopRef.current.contains(event.target as Node)) {
        setShowCoopDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchInitialData]);

  // --- MANTENEMOS TUS FUNCIONES TAL CUAL ---
  const clonarFrecuencia = (id: number) => {
    router.push(`/admin/dashboard/frecuencias/nueva?clonar=${id}`);
  };

  async function deleteFrecuencia(id: number) {
    if (!confirm("¿Eliminar esta frecuencia permanentemente?")) return;
    try {
      const { error } = await supabase.from("frecuencias").delete().eq("id", id);
      if (error) throw error;
      setFrecuencias((prev) => prev.filter((f) => f.id !== id));
      toast.success("Frecuencia eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  }

  const filteredCoopOptions = cooperativas.filter((c) =>
    c.nombre_cooperativa.toLowerCase().includes(coopSearchTerm.toLowerCase())
  );

  const selectedCoopName = cooperativas.find(
    (c) => c.id.toString() === selectedCooperativa
  )?.nombre_cooperativa;

  const filteredFrecuencias = frecuencias.filter((f) => {
    const term = searchTerm.toLowerCase();
    const matchText = f.ruta_display?.toLowerCase().includes(term);
    const matchCooperativa = selectedCooperativa
      ? f.cooperativa_id?.toString() === selectedCooperativa
      : true;

    return matchText && matchCooperativa;
  });

  return (
    <div className="space-y-6">
      {/* HEADER - TU DISEÑO ORIGINAL */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#09184D] tracking-tighter italic uppercase">
            Control de <span className="text-[#EA2264]">Frecuencias</span>
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            {userProfile?.rol === 'admin' ? 'Panel Administrativo' : 'Gestión de Cooperativa'}
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/dashboard/frecuencias/nueva")}
          className="bg-[#09184D] hover:bg-[#EA2264] transition-colors text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl"
        >
          <Plus size={16} strokeWidth={3} />
          Nueva Frecuencia
        </button>
      </div>

      {/* ÁREA DE FILTROS - TU DISEÑO ORIGINAL */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* BUSCADOR TEXTO */}
        <div className={`relative ${userProfile?.rol === 'admin' ? 'md:col-span-7' : 'md:col-span-12'}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre de ruta..."
            className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl text-sm font-bold text-[#09184D] shadow-sm outline-none focus:ring-2 ring-[#EA2264]/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* DROPDOWN COOPERATIVAS - SOLO VISIBLE PARA ADMIN */}
        {userProfile?.rol === "admin" && (
          <div className="relative md:col-span-5" ref={coopRef}>
            <div
              onClick={() => setShowCoopDropdown(!showCoopDropdown)}
              className={`w-full bg-white border border-gray-100 py-4 px-5 rounded-2xl text-sm font-bold flex justify-between items-center cursor-pointer transition-all shadow-sm ${
                selectedCooperativa ? "text-[#EA2264]" : "text-gray-400"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Bus size={16} />
                <span className="truncate">{selectedCoopName || "Filtrar por Cooperativa"}</span>
              </div>
              {selectedCooperativa ? (
                <X size={16} onClick={(e) => { e.stopPropagation(); setSelectedCooperativa(""); }} className="hover:text-red-500" />
              ) : (
                <ChevronDown size={16} className={`transition-transform duration-300 ${showCoopDropdown ? "rotate-180" : ""}`} />
              )}
            </div>
            
            {showCoopDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Escribir nombre..."
                    className="w-full p-2.5 bg-white rounded-xl text-xs font-bold outline-none border border-gray-100 focus:border-[#EA2264]/30"
                    value={coopSearchTerm}
                    onChange={(e) => setCoopSearchTerm(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <div onClick={() => { setSelectedCooperativa(""); setShowCoopDropdown(false); }} className="p-4 text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-50">Mostrar todas</div>
                  {filteredCoopOptions.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedCooperativa(c.id.toString()); setShowCoopDropdown(false); setCoopSearchTerm(""); }}
                      className={`p-4 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer hover:bg-[#09184D] hover:text-white ${selectedCooperativa === c.id.toString() ? "bg-[#EA2264]/5 text-[#EA2264]" : "text-[#09184D]"}`}
                    >
                      {c.nombre_cooperativa}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TABLA - TU DISEÑO ORIGINAL */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#EA2264]" size={32} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Cargando datos...</span>
          </div>
        ) : filteredFrecuencias.length === 0 ? (
          <div className="p-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No hay datos</div>
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
                      <div className="text-sm font-bold text-[#09184D] uppercase">{f.ruta_display}</div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                        <MapPin size={10} /> {f.num_paradas} Paradas
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-600">{f.cooperativas?.nombre_cooperativa || "---"}</span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-gray-500 uppercase italic">{f.tipo_servicio}</td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => clonarFrecuencia(f.id)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"><Copy size={16} /></button>
                        <button onClick={() => router.push(`/admin/dashboard/frecuencias/editar/${f.id}`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                        <button onClick={() => deleteFrecuencia(f.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
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