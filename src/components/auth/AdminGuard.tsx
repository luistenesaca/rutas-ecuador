"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");
  const router = useRouter();

  const checkAccess = useCallback(async () => {
    try {
      // 1. Obtener usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/admin/login");
        return;
      }

      // 2. Consultar perfil para verificar el ROL
      const { data: perfil, error: perfilError } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (perfilError || !perfil) {
        console.error("Error al obtener perfil:", perfilError);
        setStatus("unauthorized");
        return;
      }

      // 3. VALIDACIÓN DE ROLES PERMITIDOS
      // Incluimos todos los roles que pueden ver el dashboard
      const rolesPermitidos = ["admin", "operador", "editor", "vendedor"];
      const rolUsuario = perfil.rol?.toLowerCase().trim();

      if (rolesPermitidos.includes(rolUsuario)) {
        setStatus("authorized");
      } else {
        console.warn(`Intento de acceso denegado para el rol: ${rolUsuario}`);
        setStatus("unauthorized");
        // Redirigir al inicio después de 3 segundos
        setTimeout(() => router.replace("/admin/login"), 3000);
      }
    } catch (error) {
      console.error("Guard Security Auth Error");
      setStatus("unauthorized");
    }
  }, [router]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // 1. PANTALLA DE CARGA
  if (status === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#FDFDFD]">
        <div className="relative">
          <Loader2 className="animate-spin text-[#EA2264]" size={40} strokeWidth={2.5} />
          <div className="absolute inset-0 blur-xl bg-[#EA2264]/20 animate-pulse"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#09184D] mt-4">
          Verificando Credenciales...
        </p>
      </div>
    );
  }

  // 2. PANTALLA DE ACCESO DENEGADO
  if (status === "unauthorized") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-100 animate-bounce">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-[#09184D] tracking-tighter uppercase italic">
          Acceso <span className="text-[#EA2264]">Restringido</span>
        </h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
          Tu cuenta no tiene los permisos suficientes para acceder a este panel. 
          Contacta al administrador si crees que esto es un error.
        </p>
        <button 
          onClick={() => router.replace("/admin/login")}
          className="mt-8 text-[10px] font-black uppercase tracking-widest text-[#09184D] border-b-2 border-[#EA2264] pb-1"
        >
          Volver al Login
        </button>
      </div>
    );
  }

  // 3. SI ESTÁ AUTORIZADO, RENDERIZA EL DASHBOARD
  return <>{children}</>;
}