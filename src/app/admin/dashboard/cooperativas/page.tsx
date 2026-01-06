// app/admin/dashboard/cooperativas/page.tsx
import CooperativasList from "@/components/admin/CooperativasList";

export default function CooperativasPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CooperativasList />
    </div>
  );
}