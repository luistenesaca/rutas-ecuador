import TerminalForm from "@/components/admin/TerminalForm";

interface PageProps {
  params: { id: string };
}

export default async function EditarTerminalPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="p-6 md:p-10 animate-in slide-in-from-bottom-4 duration-500">
      <TerminalForm id={id} />
    </div>
  );
}