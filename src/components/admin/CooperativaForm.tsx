"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // 1. Importar toast
import {
  Building2,
  Upload,
  ArrowLeft,
  Loader2,
  Hash,
  Phone,
  CheckCircle2,
} from "lucide-react";

export default function CooperativaForm({ id }: { id?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [formData, setFormData] = useState({
    nombre_cooperativa: "",
    ruc: "",
    telefono: "",
    logo_url: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      const loadData = async () => {
        setFetching(true);
        try {
          const { data, error } = await supabase
            .from("cooperativas")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;

          if (data) {
            setFormData({
              nombre_cooperativa: data.nombre_cooperativa || "",
              ruc: data.ruc || "",
              telefono: data.telefono || "",
              logo_url: data.logo_url || "",
            });
            if (data.logo_url) setImagePreview(data.logo_url);
          }
        } catch (err: any) {
          toast.error("Error al cargar datos", {
            description: err.message || "No se pudo obtener la información."
          });
        } finally {
          setFetching(false);
        }
      };
      loadData();
    }
  }, [id, isEdit]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalLogoUrl = formData.logo_url;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const cleanName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("logos-cooperativas")
          .upload(cleanName, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("logos-cooperativas")
          .getPublicUrl(cleanName);

        finalLogoUrl = publicUrl;
      }

      const payload = {
        nombre_cooperativa: formData.nombre_cooperativa.trim(),
        ruc: formData.ruc.trim(),
        telefono: formData.telefono.trim(),
        logo_url: finalLogoUrl,
      };

      const { error } = isEdit
        ? await supabase.from("cooperativas").update(payload).eq("id", id)
        : await supabase.from("cooperativas").insert([payload]);

      if (error) throw error;

      // 2. Toast de éxito profesional
      toast.success(isEdit ? "¡Actualización exitosa!" : "¡Cooperativa creada!", {
        description: `${payload.nombre_cooperativa} ha sido guardada en el sistema.`,
      });

      router.push("/admin/dashboard/cooperativas");
      router.refresh();
    } catch (error: any) {
      // 3. Reemplazo del alert por toast.error
      toast.error("Error al procesar", {
        description: error.message || "Ocurrió un problema al guardar.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="p-20 flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#EA2264]" size={32} />
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
          Cargando datos...
        </p>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-[#EA2264] text-[10px] font-black uppercase tracking-widest transition-all group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver
      </button>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
          {/* UPLOAD LOGO */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-44 h-44 bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-[#EA2264]/30 transition-all overflow-hidden shadow-inner group"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform"
                  alt="Preview"
                />
              ) : (
                <div className="text-center">
                  <Upload className="text-gray-200 mx-auto mb-2" />
                  <p className="text-[8px] font-black text-gray-300 uppercase">
                    Logo PNG
                  </p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
          </div>

          <div className="flex-1 space-y-8 w-full">
            <h3 className="text-2xl font-black text-[#09184D] uppercase italic flex items-center gap-3 tracking-tighter">
              <Building2 className="text-[#EA2264]" />{" "}
              {isEdit ? "Actualizar" : "Nueva"} Operadora
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                  Nombre de la Cooperativa
                </label>
                <input
                  required
                  type="text"
                  value={formData.nombre_cooperativa}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nombre_cooperativa: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none"
                  placeholder="Ej: Transportes Ecuador"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    RUC / ID Legal
                  </label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      required
                      type="text"
                      value={formData.ruc}
                      onChange={(e) =>
                        setFormData({ ...formData, ruc: e.target.value })
                      }
                      className="w-full bg-gray-50 border-none p-4 pl-12 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none"
                      placeholder="17900..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Teléfono de Contacto
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      className="w-full bg-gray-50 border-none p-4 pl-12 rounded-2xl font-bold text-[#09184D] focus:ring-2 ring-[#EA2264]/10 transition-all outline-none"
                      placeholder="02-234..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {loading ? "Sincronizando..." : "Guardar Información"}
        </button>
      </div>
    </form>
  );
}