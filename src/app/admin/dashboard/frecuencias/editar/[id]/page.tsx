"use client";

import FrecuenciaForm from "@/components/admin/FrecuenciaForm";
import { useParams } from "next/navigation";

export default function EditarPage() {
  const params = useParams();
  const id = params?.id; // Obtenemos el ID del URL /[id]/

  return <FrecuenciaForm mode="edit" id={id} />;
}