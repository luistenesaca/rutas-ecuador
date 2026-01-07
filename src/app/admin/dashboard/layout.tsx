"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner"; // 1. Importar Toaster
import {
  Bus,
  LayoutDashboard,
  MapPin,
  Users,
  LogOut,
  Menu,
  ChevronRight,
  Settings,
  Route,
  Loader2,
  X,
  User,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<any>(null);

  const settingsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!confirm("¿Cerrar sesión en el panel administrativo?")) return;
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const menuItems = [
    { name: "Resumen", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Frecuencias", icon: Route, path: "/admin/dashboard/frecuencias" },
    { name: "Cooperativas", icon: Users, path: "/admin/dashboard/cooperativas" },
    { name: "Terminales", icon: MapPin, path: "/admin/dashboard/terminales" },
  ];

  if (!mounted)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#EA2264]" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex h-screen overflow-hidden font-sans">
      
      {/* 2. CONFIGURACIÓN DE NOTIFICACIONES */}
      <Toaster 
        position="bottom-right" 
        richColors 
        theme="light" 
        toastOptions={{
          style: { 
            borderRadius: '1.5rem', 
            border: '1px solid #f1f5f9',
            fontFamily: 'inherit'
          },
          className: "text-[10px] font-black uppercase tracking-widest",
        }}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-[#09184D] text-white transition-all duration-500 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#EA2264] p-2.5 rounded-2xl shadow-lg shadow-[#EA2264]/40">
                <Bus size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-black tracking-tighter italic uppercase">Admin<span className="text-[#EA2264]">Panel</span></h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50"><X size={20} /></button>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = item.path === "/admin/dashboard" ? pathname === item.path : pathname.startsWith(item.path);
              return (
                <Link key={item.name} href={item.path} onClick={() => setIsSidebarOpen(false)} className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive ? "bg-gradient-to-r from-[#EA2264] to-[#ff4d88] text-white shadow-lg shadow-[#EA2264]/20 scale-[1.02]" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
                  <div className="flex items-center gap-3">
                    <item.icon size={19} className={isActive ? "text-white" : "group-hover:text-white"} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.name}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-black uppercase text-[9px] tracking-[0.2em]"><LogOut size={18} />Cerrar Sesión</button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 h-20 flex items-center justify-between px-6 md:px-10 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-gray-50 text-[#09184D] rounded-xl"><Menu size={20} /></button>
            <h1 className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">SISTEMA CENTRAL <span className="text-[#09184D]">Control de Tráfico</span></h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black text-[#09184D] uppercase italic leading-none">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin"}</p>
              <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-1 flex items-center justify-end gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>Sesión Activa</p>
            </div>

            <div className="relative" ref={settingsRef}>
              <button onClick={() => setShowSettings(!showSettings)} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 cursor-pointer ${showSettings ? "bg-[#09184D] border-[#09184D] text-white shadow-lg" : "bg-gray-50 border-gray-100 text-slate-400 hover:border-[#EA2264]/30"}`}><Settings size={19} className={showSettings ? "rotate-90 transition-transform duration-500" : ""} /></button>
              {showSettings && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 shadow-2xl rounded-[2rem] p-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-gray-50 mb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cuenta vinculada</p>
                    <p className="text-[11px] font-bold text-[#09184D] truncate">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <button onClick={() => { router.push("/admin/dashboard/perfil"); setShowSettings(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-[#09184D] uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all"><User size={14} className="text-[#EA2264]" /> Ajustes de Perfil</button>
                    <button onClick={() => { router.push("/admin/dashboard/seguridad"); setShowSettings(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-[#09184D] uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all"><ShieldCheck size={14} className="text-[#EA2264]" /> Seguridad</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 md:p-10 pb-20">{children}</div>
        </div>
      </main>

      {isSidebarOpen && <div className="fixed inset-0 bg-[#09184D]/60 z-[55] lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}