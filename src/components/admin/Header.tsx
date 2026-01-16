"use client";
import { forwardRef } from "react";
import { Menu, Settings, User, ShieldCheck, Building2 } from "lucide-react";

interface HeaderProps {
  user: any; // Ahora contiene { ...authData, profile: { ... } }
  setIsSidebarOpen: (open: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  router: any;
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>(
  ({ user, setIsSidebarOpen, showSettings, setShowSettings, router }, ref) => {
    
    // Extraemos datos del perfil para limpiar el JSX
    const nombre = user?.profile?.nombre_completo || user?.email?.split("@")[0] || "Usuario";
    const rol = user?.profile?.rol || "Invitado";
    const cooperativa = user?.profile?.cooperativas?.nombre_cooperativa;

    return (
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 h-20 flex items-center justify-between px-6 md:px-10 shrink-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-gray-50 text-[#09184D] rounded-xl">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
              SISTEMA CENTRAL <span className="text-[#09184D]">Control de Tráfico</span>
            </h1>
            {/* Badge de Cooperativa si no es Admin */}
            {cooperativa && (
              <p className="hidden md:flex items-center gap-1.5 text-[9px] font-bold text-[#EA2264] uppercase tracking-wider mt-0.5">
                <Building2 size={10} /> {cooperativa}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Info Usuario Dinámica */}
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-black text-[#09184D] uppercase italic leading-none">
              {nombre}
            </p>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-[8px] px-2 py-0.5 bg-[#09184D]/5 text-[#09184D] font-black uppercase rounded-md tracking-tighter">
                {rol}
              </span>
              <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> Online
              </p>
            </div>
          </div>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 
              ${showSettings ? "bg-[#09184D] border-[#09184D] text-white shadow-lg" : "bg-gray-50 border-gray-100 text-slate-400 hover:border-[#EA2264]/30"}`}
            >
              <Settings size={19} className={showSettings ? "rotate-90 transition-transform duration-500" : ""} />
            </button>
            
            {showSettings && (
              <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 shadow-2xl rounded-[2rem] p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-50 mb-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Sesión de {rol}</p>
                  <p className="text-[11px] font-bold text-[#09184D] truncate">{user?.email}</p>
                </div>
                <div className="space-y-1">
                  <button 
                    onClick={() => { router.push("/admin/dashboard/perfil"); setShowSettings(false); }} 
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-[#09184D] uppercase tracking-[0.15em] hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <User size={14} className="text-[#EA2264]" /> Ajustes de Perfil
                  </button>
                  <button 
                    onClick={() => { router.push("/admin/dashboard/seguridad"); setShowSettings(false); }} 
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-[#09184D] uppercase tracking-[0.15em] hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <ShieldCheck size={14} className="text-[#EA2264]" /> Seguridad
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";