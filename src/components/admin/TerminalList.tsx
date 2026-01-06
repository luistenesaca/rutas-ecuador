"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit3, Trash2, MapPin, Navigation, Loader2, Building2 } from "lucide-react";

export default function TerminalesList() {
  const router = useRouter();
  const [terminales, setTerminales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTerminales = async () => {
    // Join con la tabla ciudades para traer el nombre
    const { data } = await supabase
      .from("terminales")
      .select(`
        *,
        ciudades (nombre_ciudad)
      `)
      .order("nombre_terminal");
    setTerminales(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTerminales(); }, []);

  const filtered = terminales.filter(t => 
    t.nombre_terminal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ciudades?.nombre_ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-[#09184D] tracking-tighter uppercase italic">
            Red de <span className="text-[#EA2264]">Paradas</span>
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Gestión de puntos de embarque</p>
        </div>
        <button onClick={() => router.push("/admin/dashboard/terminales/nuevo")} className="bg-[#09184D] text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={18} strokeWidth={3} /> Nuevo Punto
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input type="text" placeholder="Buscar por nombre o ciudad..." className="w-full bg-gray-50 border-none py-3 pl-14 pr-4 rounded-xl text-sm font-bold text-[#09184D]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="py-20 text-center animate-bounce text-[#EA2264] font-black uppercase text-[10px]">Cargando puntos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-[#EA2264]/20 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${t.es_parada_oficial ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-[#EA2264]'}`}>
                  {t.es_parada_oficial ? <MapPin size={22} /> : <Building2 size={22} />}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/admin/dashboard/terminales/editar/${t.id}`)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                  <button className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>

              <div>
                <span className="text-[8px] font-black text-[#EA2264] uppercase tracking-[0.2em]">{t.es_parada_oficial ? "Parada Oficial" : "Terminal Principal"}</span>
                <h3 className="text-xl font-black text-[#09184D] uppercase italic leading-none mt-1 group-hover:text-[#EA2264] transition-colors">{t.nombre_terminal}</h3>
                {t.alias_terminal && <p className="text-[10px] font-bold text-gray-400 mt-1 italic">"{t.alias_terminal}"</p>}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <Navigation size={12} className="text-[#EA2264]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.ciudades?.nombre_ciudad || "Sin ciudad"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}