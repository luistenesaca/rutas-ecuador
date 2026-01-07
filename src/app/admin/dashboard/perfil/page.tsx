"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Importamos toast
import { 
  User, Mail, BadgeCheck, Loader2, Save, 
  ArrowLeft 
} from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setNombre(user?.user_metadata?.full_name || "");
    }
    loadUser();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: nombre }
    });

    if (error) {
      toast.error("Error al actualizar", {
        description: error.message
      });
    } else {
      // Notificación elegante
      toast.success("¡Perfil actualizado!", {
        description: "Tus datos se han sincronizado correctamente."
      });
      
      // Refrescamos para que el Header capture el nuevo nombre de inmediato
      router.refresh(); 
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Navegación superior */}
      <button 
        onClick={() => router.push("/admin/dashboard")}
        className="flex items-center gap-2 text-gray-400 hover:text-[#09184D] text-[10px] font-black uppercase tracking-widest transition-all group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
        Volver al Panel
      </button>

      <div>
        <h2 className="text-3xl font-black text-[#09184D] tracking-tighter uppercase italic">
          Mi <span className="text-[#EA2264]">Perfil</span>
        </h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
          Gestiona tu identidad en el sistema
        </p>
      </div>

      <form onSubmit={handleUpdate} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6 relative">
        
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center text-[#EA2264] border-2 border-dashed border-gray-200">
            <User size={40} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Email (Solo lectura) */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input 
                disabled 
                type="text" 
                value={user?.email || ""} 
                className="w-full bg-gray-100 border-none p-4 pl-12 rounded-2xl font-bold text-gray-400 cursor-not-allowed" 
              />
            </div>
          </div>

          {/* Nombre Completo */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
              Nombre Completo
            </label>
            <div className="relative">
              <BadgeCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input 
                required 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                className="w-full bg-gray-50 border-none p-4 pl-12 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            disabled={loading} 
            className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={16} />}
            {loading ? "Sincronizando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}