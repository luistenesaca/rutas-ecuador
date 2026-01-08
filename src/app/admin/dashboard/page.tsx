"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Bus, 
  Users, 
  Route, 
  MapPin, 
  Loader2, 
  Plus, 
  ArrowUpRight, 
  ShieldCheck,
  Zap
} from "lucide-react";

export default function DashboardHome() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [stats, setStats] = useState({
    cooperativas: 0,
    frecuencias: 0,
    terminales: 0,
    usuarios: 0 // Añadimos usuarios
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchRealStats();
  }, []);

  async function fetchRealStats() {
    try {
      const [coopRes, frecRes, termRes, userRes] = await Promise.all([
        supabase.from('cooperativas').select('*', { count: 'exact', head: true }),
        supabase.from('frecuencias').select('*', { count: 'exact', head: true }),
        supabase.from('terminales').select('*', { count: 'exact', head: true }),
        supabase.from('perfiles').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        cooperativas: coopRes.count || 0,
        frecuencias: frecRes.count || 0,
        terminales: termRes.count || 0,
        usuarios: userRes.count || 0
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-[#09184D] tracking-tighter uppercase italic">
            Admin<span className="text-[#EA2264]"> Dashboard</span>
          </h2>
          <p className="text-slate-400 font-black mt-1 uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Monitoreo Global de Operaciones
          </p>
        </div>
        
        <div className="flex gap-2">
           <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Base de Datos</p>
                <p className="text-[10px] font-bold text-[#09184D]">Sincronizada</p>
              </div>
           </div>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Usuarios" value={stats.usuarios} icon={Users} color="from-blue-600 to-blue-400" loading={loading} />
        <StatCard label="Cooperativas" value={stats.cooperativas} icon={Bus} color="from-[#EA2264] to-[#ff5d96]" loading={loading} />
        <StatCard label="Frecuencias" value={stats.frecuencias} icon={Route} color="from-violet-600 to-indigo-400" loading={loading} />
        <StatCard label="Terminales" value={stats.terminales} icon={MapPin} color="from-orange-500 to-amber-400" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BANNER DE ACCIÓN RÁPIDA (Ocupa 2 columnas) */}
        <div className="lg:col-span-2 bg-[#09184D] rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6">
                <Zap size={14} className="text-[#EA2264] fill-[#EA2264]" />
                <span className="text-[9px] font-black uppercase tracking-widest">Acceso Directo</span>
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tighter italic uppercase">Gestión de<br/><span className="text-[#EA2264]">Rutas y Horarios</span></h3>
              <p className="text-blue-200/60 text-sm max-w-sm mb-10 leading-relaxed font-medium">
                Optimiza la red de transporte agregando nuevas frecuencias o actualizando las paradas existentes.
              </p>
            </div>
            
            <button 
              onClick={() => router.push("/admin/dashboard/frecuencias/nueva")}
              className="group/btn bg-white text-[#09184D] w-fit px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-[#EA2264] hover:text-white transition-all duration-500 shadow-2xl flex items-center gap-4 active:scale-95"
            >
              Registrar Nueva Frecuencia
              <Plus size={18} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-500" />
            </button>
          </div>
          
          {/* Decoración de Bus con movimiento sutil */}
          <Bus className="absolute right-[-40px] bottom-[-40px] text-white/5 w-96 h-96 -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-1000 ease-in-out" />
        </div>

        {/* TARJETA DE ESTADO SECUNDARIA */}
        <div className="bg-white rounded-[3rem] border border-gray-100 p-8 flex flex-col justify-between shadow-sm">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Actividad del Sistema</h4>
            <div className="space-y-6">
              {[
                { label: "Buscador Público", status: "Activo", color: "bg-emerald-500" },
                { label: "API Supabase", status: "Estable", color: "bg-emerald-500" },
                { label: "Servidor Auth", status: "Online", color: "bg-emerald-500" }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <span className="text-xs font-bold text-[#09184D]">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => router.push("/admin/dashboard/usuarios")}
            className="mt-8 flex items-center justify-between w-full p-4 rounded-2xl bg-gray-50 text-slate-400 hover:text-[#EA2264] hover:bg-gray-100 transition-all text-[9px] font-black uppercase tracking-widest"
          >
            Ver todos los usuarios
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }: any) {
  return (
    <div className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-2xl hover:shadow-[#09184D]/5 transition-all duration-500">
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 mb-6 group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          {loading ? (
            <div className="h-10 w-16 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <p className="text-4xl font-black text-[#09184D] tracking-tighter">{value}</p>
          )}
        </div>
      </div>
      {/* Círculo decorativo al fondo */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`} />
    </div>
  );
}