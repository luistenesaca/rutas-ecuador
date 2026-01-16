"use client";
import { useState, useEffect } from "react";
import { X, Save, Shield, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ModalEditarUsuarioProps {
  usuario: any;
  onClose: () => void;
  onRefresh: () => void; // Cambiado de onUpdate a onRefresh para coincidir con la tabla
}

export default function ModalEditarUsuario({ usuario, onClose, onRefresh }: ModalEditarUsuarioProps) {
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [nombre, setNombre] = useState(usuario.nombre_completo || "");
  const [rol, setRol] = useState(usuario.rol || "editor");
  const [cooperativaId, setCooperativaId] = useState(usuario.cooperativa_id || "");

  useEffect(() => {
    fetchCooperativas();
  }, []);

  const fetchCooperativas = async () => {
    const { data } = await supabase
      .from("cooperativas")
      .select("id, nombre_cooperativa")
      .order("nombre_cooperativa", { ascending: true });
    if (data) setCooperativas(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("perfiles")
        .update({
          nombre_completo: nombre,
          rol: rol,
          cooperativa_id: rol === "admin" ? null : (cooperativaId || null),
        })
        .eq("id", usuario.id);

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Perfil actualizado");
      
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#09184D]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-3xl font-black text-[#09184D] tracking-tighter uppercase italic">
                Editar <span className="text-[#EA2264]">Perfil</span>
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                UUID: {usuario.id.slice(0, 18)}...
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <X size={24} />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-100">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
              <h4 className="text-xl font-black text-[#09184D] uppercase">¡Cambios Guardados!</h4>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Nombre Completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#09184D] focus:ring-2 focus:ring-[#EA2264]/20 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Rol de Acceso</label>
                <div className="relative">
                  <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EA2264]" />
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#09184D] appearance-none outline-none focus:ring-2 focus:ring-[#EA2264]/20 cursor-pointer"
                  >
                    <option value="editor">Editor Cooperativa</option>
                    <option value="admin">Administrador General</option>
                  </select>
                </div>
              </div>

              {rol !== "admin" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Asignar Cooperativa</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EA2264]" />
                    <select
                      value={cooperativaId}
                      onChange={(e) => setCooperativaId(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#09184D] appearance-none outline-none focus:ring-2 focus:ring-[#EA2264]/20 cursor-pointer"
                    >
                      <option value="">Sin asignar (Acceso Global)</option>
                      {cooperativas.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre_cooperativa}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#09184D] text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#EA2264] transition-all shadow-xl shadow-[#09184D]/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {loading ? "Sincronizando..." : "Actualizar Datos"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}