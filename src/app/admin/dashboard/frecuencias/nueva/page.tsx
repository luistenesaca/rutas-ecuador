"use client";

import { Suspense } from "react";
import FrecuenciaForm from "@/components/admin/FrecuenciaForm";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// Componente interno que consume los params
function NuevaFrecuenciaContent() {
  const searchParams = useSearchParams();
  const clonarId = searchParams.get("clonar");
  
  return <FrecuenciaForm mode={clonarId ? "clone" : "create"} id={clonarId || undefined} />;
}

// Página principal con Suspense
export default function NuevaPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#EA2264]" size={40} />
      </div>
    }>
      <NuevaFrecuenciaContent />
    </Suspense>
  );
}