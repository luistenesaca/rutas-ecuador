"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Plus, Search, Edit3, Trash2, MapPin, 
  Navigation, Loader2, Building2, AlertCircle, Globe 
} from "lucide-react";

export default function TerminalesList() {
  const router = useRouter();
  const [terminales, setTerminales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTerminales = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("terminales")
        .select(`
          *,
          ciudades (
            nombre_ciudad,
            provincias (
              nombre_provincia,
              paises (nombre_pais)
            )
          )
        `)
        .order("nombre_terminal");
      
      if (error) throw error;
      setTerminales(data || []);
    } catch (err: any) {
      toast.error("Error al cargar puntos", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTerminales(); }, [fetchTerminales]);

  async function deleteTerminal(id: string, nombre: string) {
    if (!confirm(`¿Eliminar el punto "${nombre}"?`)) return;
    const toastId = toast.loading("Eliminando punto...");
    try {
      const { error } = await supabase.from("terminales").delete().eq("id", id);
      if (error) throw error;
      setTerminales((prev) => prev.filter((t) => t.id !== id));
      toast.success("Punto eliminado", { id: toastId });
    } catch (err: any) {
      toast.error("No se pudo eliminar", { id: toastId, description: err.message });
    }
  }

  const filtered = terminales.filter(t => {
    const term = searchTerm.toLowerCase();
    const nombreTerminal = (t.nombre_terminal ?? "").toLowerCase();
    const nombreCiudad = (t.ciudades?.nombre_ciudad ?? "").toLowerCase();
    const nombrePais = (t.ciudades?.provincias?.paises?.nombre_pais ?? "").toLowerCase();

    return nombreTerminal.includes(term) || nombreCiudad.includes(term) || nombrePais.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#09184D] tracking-tighter uppercase italic">
            Red de <span className="text-[#EA2264]">Paradas</span>
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Gestión de puntos internacionales y terminales
          </p>
        </div>
        <button 
          onClick={() => router.push("/admin/dashboard/terminales/nuevo")} 
          className="bg-[#09184D] hover:bg-[#EA2264] text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Nuevo Punto
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por terminal, ciudad o país..." 
          className="w-full bg-gray-50 border-none py-3 pl-14 pr-4 rounded-xl text-sm font-bold text-[#09184D] outline-none focus:ring-1 ring-[#EA2264]/20 transition-all" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#EA2264]" size={32} />
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sincronizando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[3rem] py-20 flex flex-col items-center border border-dashed border-gray-200">
          <AlertCircle className="text-gray-200 mb-2" size={40} />
          <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Sin coincidencias</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:shadow-2xl hover:shadow-[#09184D]/5 transition-all duration-500 group flex flex-col">
              
              <div className="flex justify-between items-start mb-6">
                {/* LÓGICA CORREGIDA: Si es_parada_oficial es TRUE -> Building (Terminal), si no MapPin (Parada) */}
                <div className={`p-4 rounded-2xl transition-colors ${t.es_parada_oficial ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-[#EA2264]'}`}>
                  {t.es_parada_oficial ? <Building2 size={22} /> : <MapPin size={22} />}
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => router.push(`/admin/dashboard/terminales/editar/${t.id}`)} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => deleteTerminal(t.id, t.nombre_terminal)} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                {/* LÓGICA CORREGIDA DE ETIQUETAS */}
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] italic ${t.es_parada_oficial ? 'text-blue-500' : 'text-[#EA2264]'}`}>
                  {t.es_parada_oficial ? "Terminal Principal" : "Parada en Ruta"}
                </span>
                <h3 className="text-xl font-black text-[#09184D] uppercase italic leading-none mt-1 group-hover:text-[#EA2264] transition-colors line-clamp-2">
                  {t.nombre_terminal ?? "Punto sin nombre"}
                </h3>
              </div>

              {/* FOOTER: CIUDAD, PAÍS */}
              <div className="mt-6 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2 text-gray-500">
                  <Navigation size={12} className="text-[#EA2264]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {t.ciudades?.nombre_ciudad || "Sin Ciudad"}, {t.ciudades?.provincias?.paises?.nombre_pais || "Sin País"}
                  </span>
                </div>                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}