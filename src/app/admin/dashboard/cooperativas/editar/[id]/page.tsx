// app/admin/dashboard/cooperativas/editar/[id]/page.tsx
import CooperativaForm from "@/components/admin/CooperativaForm";

interface PageProps {
  params: { id: string };
}

export default async function EditarCooperativaPage({ params }: PageProps) {
  // En Next.js 15, params es una promesa, por eso usamos await. 
  // En Next.js 14 también es una buena práctica para asegurar la disponibilidad.
  const { id } = await params;

  if (!id) {
    return (
      <div className="p-20 text-center text-[10px] font-black uppercase text-gray-400">
        Error: ID no encontrado en la URL
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CooperativaForm id={id} />
    </div>
  );
}