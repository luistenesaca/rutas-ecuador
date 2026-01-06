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
  Building2,
  Phone,
  Hash,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function CooperativasList() {
  const router = useRouter();
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCooperativas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cooperativas")
        .select("*")
        .order("nombre_cooperativa", { ascending: true });

      if (error) throw error;
      setCooperativas(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCooperativas();
  }, [fetchCooperativas]);

  async function deleteCooperativa(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      const { error } = await supabase
        .from("cooperativas")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setCooperativas((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      alert("Error al eliminar: " + error.message);
    }
  }

  const filtered = cooperativas.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre_cooperativa?.toLowerCase().includes(term) ||
      c.ruc?.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#09184D] tracking-tighter italic uppercase">
            Gestión de <span className="text-[#EA2264]">Cooperativas</span>
          </h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">
            Operadoras de Transporte Nacional
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/dashboard/cooperativas/nueva")}
          className="bg-[#09184D] hover:bg-[#EA2264] text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Registrar Operadora
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o RUC..."
            className="w-full bg-gray-50 border-none py-3 pl-12 pr-4 rounded-xl text-sm font-bold text-[#09184D] outline-none focus:ring-1 ring-[#EA2264]/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="px-6 text-[10px] font-black text-gray-300 uppercase tracking-widest hidden md:block">
          {filtered.length} Empresas
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#EA2264]" size={32} />
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Sincronizando...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[3rem] py-20 flex flex-col items-center border border-dashed border-gray-200">
          <AlertCircle className="text-gray-200 mb-2" size={40} />
          <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
            Sin resultados
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-6 hover:shadow-2xl hover:shadow-[#09184D]/5 transition-all duration-500 group relative flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden">
                  {c.logo_url ? (
                    <img
                      src={c.logo_url}
                      alt="Logo"
                      className="w-full h-full object-contain "
                    />
                  ) : (
                    <Building2 className="text-gray-200" size={24} />
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/dashboard/cooperativas/editar/${c.id}`
                      )
                    }
                    className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all"
                    title="Editar"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() =>
                      deleteCooperativa(c.id, c.nombre_cooperativa)
                    }
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-black text-[#09184D]  tracking-tighter group-hover:text-[#EA2264] transition-colors">
                  {c.nombre_cooperativa}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-gray-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">RUC:</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {c.ruc || "Sin RUC"}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase">
                  <Phone size={12} className="text-[#EA2264]" />
                  {c.telefono || "---"}
                </div>
                <button
                  onClick={() =>
                    router.push(`/admin/dashboard/frecuencias?coop=${c.id}`)
                  }
                  className="w-full py-3 bg-gray-50 text-[#09184D] group-hover:bg-[#09184D] group-hover:text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={12} /> Gestionar Rutas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
