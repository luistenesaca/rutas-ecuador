"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    if (!confirm("¿Cerrar sesión?")) return;
    await supabase.auth.signOut();
    setUser(null);
    router.push("/admin/login");
  };

  if (!mounted) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#EA2264]" size={40} />
    </div>
  );

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#F8FAFC] flex h-screen overflow-hidden font-sans">
        <Toaster position="bottom-right" richColors theme="light" />

        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          pathname={pathname} 
          handleLogout={handleLogout} 
        />

        <main className="flex-1 flex flex-col relative overflow-hidden">
          <Header 
  user={user} 
  setIsSidebarOpen={setIsSidebarOpen} 
  showSettings={showSettings} 
  setShowSettings={setShowSettings} 
  ref={settingsRef} // <--- Se pasa como 'ref' directamente, no como 'settingsRef'
  router={router}
/>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto p-6 md:p-10 pb-20">{children}</div>
          </div>
        </main>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-[#09184D]/60 z-[55] lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>
    </AdminGuard>
  );
}