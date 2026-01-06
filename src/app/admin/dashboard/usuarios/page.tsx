"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, UserPlus, Building2, Search, Mail, 
  CheckCircle2, X, Loader2, Shield, Trash2, Edit 
} from "lucide-react";

export default function UsuariosPage() {
  // --- ESTADOS ---
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Estado para el formulario de nuevo usuario
  const [nuevoUser, setNuevoUser] = useState({
    email: "",
    password: "",
    nombre: "",
    rol: "vendedor",
    cooperativa_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [perfRes, coopRes] = await Promise.all([
        supabase.from("perfiles").select("*, cooperativas(nombre_cooperativa)").order('nombre_completo'),
        supabase.from("cooperativas").select("id, nombre_cooperativa").order('nombre_cooperativa')
      ]);
      setUsuarios(perfRes.data || []);
      setCooperativas(coopRes.data || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);

    try {
      // Llamada a la API Route que creamos en /api/admin/crear-usuario/route.ts
      const res = await fetch('/api/admin/crear-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUser),
      });

      const resultado = await res.json();

      if (!res.ok) throw new Error(resultado.error);

      alert("✅ Usuario registrado exitosamente");
      setShowModal(false);
      setNuevoUser({ email: "", password: "", nombre: "", rol: "vendedor", cooperativa_id: "" });
      fetchData(); 
    } catch (error: any) {
      alert("❌ Error: " + error.message);
    } finally {
      setCreando(false);
    }
  };

  const eliminarPerfil = async (id: string) => {
    if(!confirm("¿Estás seguro de eliminar este perfil? El acceso del usuario será revocado.")) return;
    
    const { error } = await supabase.from("perfiles").delete().eq("id", id);
    if (error) alert("Error al eliminar");
    else fetchData();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
        <div>
          <h2 className="text-4xl font-black text-[#09184D] tracking-tighter italic uppercase">
            Gestión de <span className="text-[#EA2264]">Usuarios</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-8 h-[2px] bg-[#EA2264]"></span>
            <p className="text-gray-400 text-[10px] font-black tracking-[0.2em] uppercase">Control administrativo de accesos</p>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#09184D] hover:bg-[#EA2264] text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#09184D]/20 active:scale-95"
        >
          <UserPlus size={16} strokeWidth={3} /> Registrar Nuevo
        </button>
      </div>

      {/* BUSCADOR Y LISTADO */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
          <Search className="text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="BUSCAR POR NOMBRE O ROL..."
            className="bg-transparent w-full font-bold text-xs outline-none uppercase tracking-widest text-[#09184D]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/50">
                <th className="p-6">Colaborador</th>
                <th className="p-6">Rol / Nivel</th>
                <th className="p-6">Asignación</th>
                <th className="p-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
  {usuarios
    .filter(u => {
      // Normalizamos los datos para evitar errores con nulos
      const nombre = (u.nombre_completo || "").toLowerCase();
      const rol = (u.rol || "").toLowerCase();
      const term = busqueda.toLowerCase();
      
      return nombre.includes(term) || rol.includes(term);
    })
    .map((u) => (
    <tr key={u.id} className="hover:bg-gray-50/50 transition-all">
      <td className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#09184D] text-white flex items-center justify-center font-black text-xs uppercase">
            {u.nombre_completo?.charAt(0) || <Users size={14}/>}
          </div>
          <div>
            <p className="font-black text-[#09184D] text-xs uppercase">
              {u.nombre_completo || "Usuario sin nombre"}
            </p>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-tighter italic">
              ID: {u.id.slice(0,8)}
            </p>
          </div>
        </div>
      </td>
      <td className="p-6">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${u.rol === 'admin' ? 'bg-red-50 text-[#EA2264]' : 'bg-blue-50 text-blue-600'}`}>
          <Shield size={12} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-widest">{u.rol}</span>
        </div>
      </td>
      <td className="p-6">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-gray-300" />
          <span className="text-[10px] font-bold text-gray-500 uppercase italic">
            {u.cooperativas?.nombre_cooperativa || "Acceso Maestro"}
          </span>
        </div>
      </td>
      <td className="p-6 text-center">
        <button 
          onClick={() => eliminarPerfil(u.id)} 
          className="text-gray-300 hover:text-red-500 transition-colors p-2"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </div>

      {/* MODAL (El mismo del paso anterior) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#09184D]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 relative border border-white/20">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-[#EA2264] transition-all hover:rotate-90">
              <X size={24} />
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-[#09184D] uppercase italic leading-none">Nuevo <span className="text-[#EA2264]">Perfil</span></h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Configuración de credenciales</p>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nombre Completo</label>
                <input required type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-[#EA2264]/10 transition-all" 
                  value={nuevoUser.nombre} onChange={e => setNuevoUser({...nuevoUser, nombre: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Correo Electrónico</label>
                <input required type="email" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-[#EA2264]/10" 
                  value={nuevoUser.email} onChange={e => setNuevoUser({...nuevoUser, email: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Contraseña Temporal</label>
                <input required type="password" minLength={6} className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-[#EA2264]/10" 
                  value={nuevoUser.password} onChange={e => setNuevoUser({...nuevoUser, password: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Rol</label>
                  <select className="w-full bg-gray-50 p-4 rounded-2xl font-black text-[10px] uppercase outline-none" 
                    value={nuevoUser.rol} onChange={e => setNuevoUser({...nuevoUser, rol: e.target.value})}>
                    <option value="vendedor">Vendedor</option>
                    <option value="operador">Operador</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {nuevoUser.rol === 'operador' && (
                  <div className="space-y-2 animate-in slide-in-from-left duration-300">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Cooperativa</label>
                    <select required className="w-full bg-gray-50 p-4 rounded-2xl font-black text-[10px] uppercase outline-none" 
                      value={nuevoUser.cooperativa_id} onChange={e => setNuevoUser({...nuevoUser, cooperativa_id: e.target.value})}>
                      <option value="">Elegir...</option>
                      {cooperativas.map(c => <option key={c.id} value={c.id}>{c.nombre_cooperativa}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button disabled={creando} type="submit" className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#09184D]/20 mt-4 disabled:opacity-50">
                {creando ? <Loader2 className="animate-spin text-white" /> : <UserPlus size={18} />}
                {creando ? "Registrando..." : "Confirmar Alta"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}