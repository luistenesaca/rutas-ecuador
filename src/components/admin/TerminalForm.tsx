"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Navigation, ArrowLeft, Loader2, 
  CheckCircle2, Search, ChevronDown 
} from "lucide-react";

export default function TerminalForm({ id }: { id?: string }) {
  const router = useRouter();
  const isEdit = Boolean(id);
  
  // 1. Control de montaje para evitar Hydration Mismatch
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  
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

  const [selectedCityName, setSelectedCityName] = useState("");

  useEffect(() => {
    setMounted(true); // El componente ya está en el cliente
    const initData = async () => {
      try {
        // CORRECCIÓN: Quitamos el alias "nombre_city" para que coincida con el resto del código
        const { data: catCiudades, error: cityError } = await supabase
          .from("ciudades")
          .select("id, nombre_ciudad")
          .order("nombre_ciudad");
        
        if (cityError) throw cityError;
        setCiudades(catCiudades || []);

        if (isEdit && id) {
          const { data, error } = await supabase
            .from("terminales")
            .select("*, ciudades(nombre_ciudad)")
            .eq("id", id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setFormData({
              nombre_terminal: data.nombre_terminal ?? "",
              ciudad_id: data.ciudad_id ?? "",
              direccion_terminal: data.direccion_terminal ?? "",
              alias_terminal: data.alias_terminal ?? "",
              es_parada_oficial: data.es_parada_oficial ?? false
            });
            setSelectedCityName(data.ciudades?.nombre_ciudad ?? "");
          }
        }
      } catch (err: any) {
        toast.error("Error de carga", { description: err.message });
      } finally {
        setFetching(false);
      }
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

  // Búsqueda segura con opcional chaining
  const ciudadesFiltradas = ciudades.filter(c => 
    (c.nombre_ciudad ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCity = (ciudad: any) => {
    setFormData(prev => ({ ...prev, ciudad_id: ciudad.id }));
    setSelectedCityName(ciudad.nombre_ciudad);
    setSearchTerm("");
    setShowDropdown(false);
    toast.info(`Ciudad: ${ciudad.nombre_ciudad}`, { duration: 1500 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ciudad_id) {
      return toast.warning("Selección requerida", { description: "Debes elegir una ciudad de la lista." });
    }
    
    setLoading(true);
    try {
      const { error } = isEdit 
        ? await supabase.from("terminales").update(formData).eq("id", id)
        : await supabase.from("terminales").insert([formData]);

      if (error) throw error;

      toast.success(isEdit ? "Punto actualizado" : "Punto registrado");
      router.push("/admin/dashboard/terminales");
      router.refresh();
    } catch (error: any) {
      toast.error("Error al guardar", { description: error.message });
      setLoading(false);
    }
  };

  // Evitar renderizado de servidor para prevenir errores de hidratación
  if (!mounted) return null;

  if (fetching) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#EA2264]" size={40} />
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sincronizando Red...</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <button 
        type="button" 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-gray-400 hover:text-[#09184D] text-[10px] font-black uppercase tracking-widest transition-all group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver
      </button>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
        <div className="space-y-8">
          <h3 className="text-2xl font-black text-[#09184D] uppercase italic flex items-center gap-3 tracking-tighter">
            <Navigation className="text-[#EA2264]" size={28} /> {isEdit ? "Editar" : "Nuevo"} Punto de Red
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nombre Oficial</label>
              <input 
                required 
                type="text" 
                value={formData.nombre_terminal} 
                onChange={(e) => setFormData({...formData, nombre_terminal: e.target.value})} 
                className="w-full bg-gray-50 border-none p-5 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none" 
                placeholder="Ej: Terminal Terrestre de Guayaquil" 
              />
            </div>

            {/* BUSCADOR DE CIUDADES */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Ciudad</label>
              <div 
                onClick={() => setShowDropdown(!showDropdown)}
                className={`w-full p-5 rounded-2xl font-bold flex justify-between items-center cursor-pointer transition-all ${
                  showDropdown ? 'bg-white ring-2 ring-[#EA2264]/20 shadow-lg' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className={selectedCityName ? "text-[#09184D]" : "text-gray-400"}>
                  {selectedCityName || "Seleccionar ciudad..."}
                </span>
                <ChevronDown size={18} className={`text-[#EA2264] transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
              </div>

              {showDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                    <Search size={16} className="text-[#EA2264]" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Buscar ciudad..."
                      className="bg-transparent border-none w-full text-xs font-bold outline-none text-[#09184D]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {ciudadesFiltradas.length > 0 ? (
                      ciudadesFiltradas.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => handleSelectCity(c)}
                          className="p-4 hover:bg-[#09184D] hover:text-white cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between group"
                        >
                          {c.nombre_ciudad}
                          <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-[10px] text-gray-400 uppercase font-black text-center">Sin resultados</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Alias */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Alias / Nombre Corto</label>
              <input 
                type="text" 
                value={formData.alias_terminal} 
                onChange={(e) => setFormData({...formData, alias_terminal: e.target.value})} 
                className="w-full bg-gray-50 border-none p-5 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none" 
                placeholder="Ej: Terminal Pascuales" 
              />
            </div>

            {/* Dirección */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Dirección Detallada</label>
              <input 
                type="text" 
                value={formData.direccion_terminal} 
                onChange={(e) => setFormData({...formData, direccion_terminal: e.target.value})} 
                className="w-full bg-gray-50 border-none p-5 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none" 
                placeholder="Av. Benjamin Rosales..." 
              />
            </div>

            {/* Checkbox Parada */}
            <div className="md:col-span-2">
              <label 
                htmlFor="es_parada" 
                className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer select-none ${
                  formData.es_parada_oficial 
                  ? 'bg-[#EA2264]/5 border-[#EA2264]/20 shadow-inner' 
                  : 'bg-gray-50 border-transparent hover:border-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  formData.es_parada_oficial ? 'bg-[#EA2264] border-[#EA2264]' : 'bg-white border-gray-200'
                }`}>
                  {formData.es_parada_oficial && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  id="es_parada"
                  hidden
                  checked={formData.es_parada_oficial} 
                  onChange={(e) => setFormData({...formData, es_parada_oficial: e.target.checked})}
                />
                <div>
                  <p className="text-[10px] font-black text-[#09184D] uppercase tracking-widest">Parada Oficial en Ruta</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Activar si no es un terminal principal</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={16} />}
          {loading ? "Sincronizando..." : "Confirmar Punto de Red"}
        </button>
      </div>
    </form>
  );
}