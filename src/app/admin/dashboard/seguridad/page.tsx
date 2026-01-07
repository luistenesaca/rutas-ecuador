"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // 1. Importar toast
import { 
  KeyRound, ShieldAlert, Loader2, RefreshCcw, 
  ArrowLeft, CheckCircle2 
} from "lucide-react";

export default function SeguridadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de coincidencia
    if (password !== confirmPassword) {
      toast.error("Error de validación", {
        description: "Las contraseñas no coinciden. Por favor, verifica.",
      });
      return;
    }

    // Validación de longitud mínima (Supabase requiere min 6)
    if (password.length < 6) {
      toast.warning("Contraseña muy corta", {
        description: "Debe tener al menos 6 caracteres por seguridad.",
      });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      toast.error("Error del sistema", {
        description: error.message,
      });
    } else {
      // Notificación de éxito profesional
      toast.success("Seguridad actualizada", {
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
      setPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Botón superior de retorno */}
      <button 
        onClick={() => router.push("/admin/dashboard")}
        className="flex items-center gap-2 text-gray-400 hover:text-[#09184D] text-[10px] font-black uppercase tracking-widest transition-all group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
        Volver al Panel
      </button>

      <div>
        <h2 className="text-3xl font-black text-[#09184D] tracking-tighter uppercase italic">
          Centro de <span className="text-[#EA2264]">Seguridad</span>
        </h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Protege el acceso a tu cuenta administrativa</p>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
        
        <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100 mb-8">
          <ShieldAlert className="text-amber-500 shrink-0" size={24} />
          <div>
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Aviso de Seguridad</p>
            <p className="text-xs text-amber-600/80 font-medium">La nueva contraseña debe tener al menos 6 caracteres. Te recomendamos usar una combinación de letras y números.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nueva Contraseña</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-gray-50 border-none p-4 pl-12 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  required 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full bg-gray-50 border-none p-4 pl-12 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none" 
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              disabled={loading} 
              className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCcw size={16} />}
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}