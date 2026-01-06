"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  MapPin, Navigation, ArrowLeft, Loader2, 
  CheckCircle2, Search, ChevronDown, X 
} from "lucide-react";

export default function TerminalForm({ id }: { id?: string }) {
  const router = useRouter();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  
  // Estados para el buscador de ciudades
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nombre_terminal: "",
    ciudad_id: "",
    direccion_terminal: "",
    alias_terminal: "",
    es_parada_oficial: false
  });

  // Estado para mostrar el nombre de la ciudad seleccionada en el input
  const [selectedCityName, setSelectedCityName] = useState("");

  useEffect(() => {
    const initData = async () => {
      // 1. Cargar Ciudades
      const { data: catCiudades } = await supabase
        .from("ciudades")
        .select("id, nombre_ciudad")
        .order("nombre_ciudad");
      setCiudades(catCiudades || []);

      // 2. Si es edición, cargar el terminal y el nombre de su ciudad
      if (isEdit && id) {
        const { data, error } = await supabase
          .from("terminales")
          .select("*, ciudades(nombre_ciudad)")
          .eq("id", id)
          .single();
        
        if (data && !error) {
          setFormData({
            nombre_terminal: data.nombre_terminal,
            ciudad_id: data.ciudad_id,
            direccion_terminal: data.direccion_terminal,
            alias_terminal: data.alias_terminal,
            es_parada_oficial: data.es_parada_oficial
          });
          setSelectedCityName(data.ciudades?.nombre_ciudad || "");
        }
      }
      setFetching(false);
    };
    initData();
  }, [id, isEdit]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ciudadesFiltradas = ciudades.filter(c => 
    c.nombre_ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCity = (ciudad: any) => {
    setFormData({ ...formData, ciudad_id: ciudad.id });
    setSelectedCityName(ciudad.nombre_ciudad);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ciudad_id) return alert("Por favor selecciona una ciudad");
    setLoading(true);

    try {
      const { error } = isEdit 
        ? await supabase.from("terminales").update(formData).eq("id", id)
        : await supabase.from("terminales").insert([formData]);

      if (error) throw error;
      router.push("/admin/dashboard/terminales");
      router.refresh();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-20 text-center animate-pulse font-black text-gray-400">CARGANDO...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-[#EA2264] text-[10px] font-black uppercase tracking-widest transition-all">
        <ArrowLeft size={14} /> Volver
      </button>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
        <div className="space-y-8">
          <h3 className="text-2xl font-black text-[#09184D] uppercase italic flex items-center gap-3 tracking-tighter">
            <Navigation className="text-[#EA2264]" /> {isEdit ? "Editar" : "Nuevo"} Punto de Red
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nombre Oficial</label>
              <input required type="text" value={formData.nombre_terminal} onChange={(e) => setFormData({...formData, nombre_terminal: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-[#09184D]" placeholder="Ej: Terminal Terrestre de Guayaquil" />
            </div>

            {/* BUSCADOR DE CIUDADES */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Ciudad (Busca y Selecciona)</label>
              <div 
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-[#09184D] flex justify-between items-center cursor-pointer group"
              >
                <span className={selectedCityName ? "text-[#09184D]" : "text-gray-400"}>
                  {selectedCityName || "Seleccionar ciudad..."}
                </span>
                <ChevronDown size={18} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </div>

              {showDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Search size={14} className="text-gray-400" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Escribe para buscar..."
                      className="bg-transparent border-none p-1 w-full text-xs font-bold outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {ciudadesFiltradas.length > 0 ? (
                      ciudadesFiltradas.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => handleSelectCity(c)}
                          className="p-4 hover:bg-[#EA2264] hover:text-white cursor-pointer text-xs font-black uppercase tracking-widest transition-colors"
                        >
                          {c.nombre_ciudad}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-[10px] text-gray-400 uppercase font-black text-center">No hay resultados</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Alias / Nombre Corto</label>
              <input type="text" value={formData.alias_terminal} onChange={(e) => setFormData({...formData, alias_terminal: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-[#09184D]" placeholder="Ej: Terminal Pascuales" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Dirección Detallada</label>
              <input type="text" value={formData.direccion_terminal} onChange={(e) => setFormData({...formData, direccion_terminal: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-[#09184D]" placeholder="Av. Benjamin Rosales..." />
            </div>

            <div className="md:col-span-2 flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <input 
                type="checkbox" 
                id="es_parada"
                checked={formData.es_parada_oficial} 
                onChange={(e) => setFormData({...formData, es_parada_oficial: e.target.checked})}
                className="w-5 h-5 accent-[#EA2264] cursor-pointer"
              />
              <label htmlFor="es_parada" className="text-[10px] font-black text-[#09184D] uppercase tracking-widest cursor-pointer select-none">
                ¿Es una parada oficial en ruta?
              </label>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] transition-all shadow-xl flex items-center justify-center gap-3">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={16} />}
          {loading ? "Sincronizando..." : "Confirmar Punto"}
        </button>
      </div>
    </form>
  );
}