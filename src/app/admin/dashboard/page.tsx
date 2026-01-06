"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation"; // 1. Importar el router
import { Bus, Users, Route, MapPin, Loader2, Plus } from "lucide-react";

export default function DashboardHome() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter(); // 2. Inicializar el router
  const [stats, setStats] = useState({
    cooperativas: 0,
    frecuencias: 0,
    ciudades: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchRealStats();
  }, []);

  async function fetchRealStats() {
    try {
      // Nota: Cambié 'ciudades' por 'terminales' si es lo que quieres contar realmente
      const [coopRes, frecRes, termRes] = await Promise.all([
        supabase.from('cooperativas').select('*', { count: 'exact', head: true }),
        supabase.from('frecuencias').select('*', { count: 'exact', head: true }),
        supabase.from('terminales').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        cooperativas: coopRes.count || 0,
        frecuencias: frecRes.count || 0,
        ciudades: termRes.count || 0
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-black text-[#09184D] tracking-tighter uppercase italic">
          Admin<span className="text-[#EA2264]"> Dashboard</span>
        </h2>
        <p className="text-gray-400 font-medium mt-1 uppercase text-[10px] tracking-widest">
          Estado actual de la red de transporte
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Cooperativas" 
          value={stats.cooperativas} 
          icon={Users} 
          color="bg-blue-600" 
          loading={loading} 
        />
        <StatCard 
          label="Frecuencias" 
          value={stats.frecuencias} 
          icon={Route} 
          color="bg-[#EA2264]" 
          loading={loading} 
        />
        <StatCard 
          label="Puntos / Terminales" 
          value={stats.ciudades} 
          icon={MapPin} 
          color="bg-orange-500" 
          loading={loading} 
        />
      </div>

      {/* Banner de Acción Rápida */}
      <div className="bg-[#09184D] rounded-[3rem] p-10 text-white relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-2 tracking-tight">¿Nueva ruta disponible?</h3>
          <p className="text-blue-200/60 text-sm max-w-md mb-8">Agrega horarios y paradas para mantener informados a los viajeros.</p>
          
          {/* 3. AGREGAR EL ONCLICK AQUÍ */}
          <button 
            onClick={() => router.push("/admin/dashboard/frecuencias/nueva")}
            className="bg-white text-[#09184D] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#EA2264] hover:text-white transition-all duration-300 active:scale-95 shadow-2xl flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} strokeWidth={4} />
            Registrar Frecuencia
          </button>
        </div>
        <Bus className="absolute right-[-40px] bottom-[-40px] text-white/5 w-80 h-80 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{label}</p>
        {loading ? (
          <Loader2 className="animate-spin text-gray-200" size={24} />
        ) : (
          <p className="text-4xl font-black text-[#09184D] tracking-tighter">{value}</p>
        )}
      </div>
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20`}>
        <Icon size={24} />
      </div>
    </div>
  );
}