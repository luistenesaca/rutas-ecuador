"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Bus, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Si todo sale bien, el middleware nos dejará pasar
      router.refresh(); // Refrescar cookies
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09184D] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo similares al Hero */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#EA2264] rounded-full blur-[120px] opacity-20" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-10" />

      <div className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-12 shadow-2xl relative z-10 border border-white/20">
        <div className="text-center mb-10">
          <div className="inline-flex bg-[#EA2264] p-4 rounded-3xl shadow-lg mb-6 rotate-3">
            <Bus className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#09184D] tracking-tighter">
            Admin<span className="text-[#EA2264]">Panel</span>
          </h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Rutas Ecuador • Gestión Privada
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#09184D] uppercase ml-4 tracking-widest opacity-60">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="email"
                required
                className="w-full bg-gray-50 border border-gray-100 py-4 pl-14 pr-6 rounded-2xl outline-none focus:ring-2 ring-[#EA2264]/20 focus:border-[#EA2264] transition-all font-bold text-[#09184D]"
                placeholder="admin@rutasecuador.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#09184D] uppercase ml-4 tracking-widest opacity-60">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="password"
                required
                className="w-full bg-gray-50 border border-gray-100 py-4 pl-14 pr-6 rounded-2xl outline-none focus:ring-2 ring-[#EA2264]/20 focus:border-[#EA2264] transition-all font-bold text-[#09184D]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Ingresar al Panel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}