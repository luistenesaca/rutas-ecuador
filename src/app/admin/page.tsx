import AdminPanel from '@/components/AdminPanel';

export default function PaginaAdmin() {
  return (
    <div className="min-h-screen bg-gray-100 py-20 px-4">
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-black text-gray-900">Panel de Control</h1>
        <p className="text-gray-500">Gestiona las operadoras de transporte y sus rutas</p>
      </div>
      <AdminPanel />
    </div>
  );
}