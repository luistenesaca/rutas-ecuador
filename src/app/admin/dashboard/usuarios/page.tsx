import { AdminGuard } from "@/components/auth/AdminGuard";
import UsuariosTable from "@/components/admin/UsuariosTable";

export default function UsuariosPage() {
  return (
    <AdminGuard>
      {/* Contenedor principal con padding responsivo */}
      <main className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 lg:p-16">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Cabecera de la página para dar contexto antes de la tabla */}
          <header className="space-y-2">
            <span className="text-[#EA2264] font-black text-[10px] uppercase tracking-[0.4em] block">
              Panel de Control
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-[#09184D] tracking-tighter">
              Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA2264] to-orange-500">Usuarios</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium max-w-2xl">
              Administra los niveles de acceso, roles de cooperativa y perfiles de los colaboradores del sistema.
            </p>
          </header>

          {/* Componente de la Tabla */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <UsuariosTable />
          </section>
          
        </div>
      </main>
    </AdminGuard>
  );
}