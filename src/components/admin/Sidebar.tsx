"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Bus, LayoutDashboard, Users, Building2, Route, MapPin, LogOut, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  pathname: string;
  handleLogout: () => void;
}

export function Sidebar({ isOpen, setIsOpen, pathname, handleLogout }: SidebarProps) {
  const [userRole, setUserRole] = useState<string | null>(null);

  // Obtenemos el rol del usuario al cargar
  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", user.id)
          .single();
        setUserRole(data?.rol || null);
      }
    };
    getRole();
  }, []);

  // Definimos qué roles pueden ver cada cosa
  const menuItems = [
    { 
      name: "Resumen", 
      icon: LayoutDashboard, 
      path: "/admin/dashboard", 
      roles: ["admin", "editor", "operador", "vendedor"] 
    },
    { 
      name: "Usuarios", 
      icon: Users, 
      path: "/admin/dashboard/usuarios", 
      roles: ["admin"] // Solo el jefe
    },
    { 
      name: "Cooperativas", 
      icon: Building2, 
      path: "/admin/dashboard/cooperativas", 
      roles: ["admin"] // Solo el jefe
    },
    { 
      name: "Frecuencias", 
      icon: Route, 
      path: "/admin/dashboard/frecuencias", 
      roles: ["admin", "editor", "operador"] 
    },
    { 
      name: "Terminales", 
      icon: MapPin, 
      path: "/admin/dashboard/terminales", 
      roles: ["admin", "editor"] 
    },
  ];

  // Filtramos los items según el rol del usuario
  const filteredMenu = menuItems.filter(item => 
    userRole ? item.roles.includes(userRole) : false
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[60] w-72 bg-[#09184D] text-white transition-all duration-500 ease-in-out lg:static lg:translate-x-0 
      ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
    >
      <div className="h-full flex flex-col p-6">
        {/* Logo */}
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#EA2264] p-2.5 rounded-2xl shadow-lg shadow-[#EA2264]/40">
              <Bus size={22} className="text-white" />
            </div>
            <h2 className="text-xl font-black tracking-tighter italic uppercase">
              Admin<span className="text-[#EA2264]">Panel</span>
            </h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-white/50">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
          {filteredMenu.map((item) => {
            const isActive = item.path === "/admin/dashboard" 
              ? pathname === "/admin/dashboard" 
              : pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group 
                ${isActive ? "bg-gradient-to-r from-[#EA2264] to-[#ff4d88] text-white shadow-lg shadow-[#EA2264]/20 scale-[1.02]" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={19} className={isActive ? "text-white" : "group-hover:text-white"} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.name}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout - Siempre visible al final */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-black uppercase text-[9px] tracking-[0.2em]"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}