"use client";
import { useState, useEffect } from "react";
import { 
  Search, Shield, User, Building2, Loader2, 
  Edit2, UserPlus, Trash2 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Importación de tus dos modales separados
import ModalCrearUsuario from "./ModalCrearUsuario";
import ModalEditarUsuario from "./ModalEditarUsuario";

export default function UsuariosTable() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // ESTADOS PARA CONTROL DE MODALES
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("perfiles")
        .select(`
          id, 
          nombre_completo, 
          rol, 
          cooperativa_id,
          cooperativas (nombre_cooperativa)
        `)
        .order("nombre_completo", { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err: any) {
      toast.error("Error al cargar usuarios: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el modal de edición pasando los datos del usuario
  const handleAbrirEdicion = (user: any) => {
    setUsuarioSeleccionado(user);
    setShowEditarModal(true);
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;

    try {
      setIsDeleting(id);
      const { error } = await supabase.from("perfiles").delete().eq("id", id);
      if (error) throw error;

      setUsuarios(usuarios.filter((u) => u.id !== id));
      toast.success("Perfil eliminado correctamente");
    } catch (err: any) {
      toast.error("Error al eliminar: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* CABECERA: Búsqueda y Botón Añadir */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o rol..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-[#EA2264]/10 transition-all font-bold text-xs text-[#09184D]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowCrearModal(true)}
          className="w-full md:w-auto bg-[#09184D] hover:bg-[#EA2264] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
        >
          <UserPlus size={18} /> Añadir Colaborador
        </button>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-[#09184D]/5 border border-gray-50 overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-[#EA2264]" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Colaborador</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Rol / Permisos</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Empresa</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuariosFiltrados.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#09184D] group-hover:bg-[#EA2264] group-hover:text-white transition-all">
                          <User size={18} />
                        </div>
                        <span className="font-black text-sm text-[#09184D] uppercase tracking-tight">{user.nombre_completo}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        user.rol === 'admin' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                        <Building2 size={14} className="text-[#EA2264]" />
                        {user.cooperativas?.nombre_cooperativa || "Acceso Global"}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAbrirEdicion(user)}
                          className="p-3 text-slate-300 hover:text-[#09184D] hover:bg-white rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminar(user.id, user.nombre_completo)}
                          disabled={isDeleting === user.id}
                          className="p-3 text-slate-300 hover:text-[#EA2264] hover:bg-white rounded-xl transition-all disabled:opacity-20"
                        >
                          {isDeleting === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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

      {/* --- RENDERIZADO DE MODALES --- */}

      {showCrearModal && (
        <ModalCrearUsuario
          onClose={() => setShowCrearModal(false)}
          onRefresh={fetchUsuarios}
        />
      )}

      {showEditarModal && usuarioSeleccionado && (
        <ModalEditarUsuario
          usuario={usuarioSeleccionado}
          onClose={() => {
            setShowEditarModal(false);
            setUsuarioSeleccionado(null);
          }}
          onRefresh={fetchUsuarios}
        />
      )}
    </div>
  );
}