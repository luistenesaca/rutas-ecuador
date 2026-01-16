"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  UserPlus,
  X,
  Loader2,
  Mail,
  Shield,
  Building2,
  Key,
} from "lucide-react";
import { toast } from "sonner";

export default function ModalCrearUsuario({
  onClose,
  onRefresh,
}: {
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "PasswordTemporal123!",
    nombre: "",
    rol: "operador", // Cambiado de 'editor' a 'operador' por tu CHECK CONSTRAINT
    cooperativaId: "",
  });

  useEffect(() => {
    const fetchCoops = async () => {
      const { data } = await supabase
        .from("cooperativas")
        .select("id, nombre_cooperativa")
        .order("nombre_cooperativa");
      if (data) setCooperativas(data);
    };
    fetchCoops();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validación previa: Si no es admin, DEBE tener cooperativa
    if (formData.rol !== "admin" && !formData.cooperativaId) {
      toast.error("Debes seleccionar una cooperativa para este rol");
      return;
    }

    setLoading(true);

    try {
      // 1. Crear en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { nombre_completo: formData.nombre } },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Preparar el objeto de perfil con valores limpios
        const perfilInsert = {
          id: authData.user.id,
          nombre_completo: formData.nombre,
          rol: formData.rol.toLowerCase().trim(),
          // Si es admin, forzar null. Si no, asegurar que no sea un string vacío
          cooperativa_id:
            formData.rol.toLowerCase() === "admin"
              ? null
              : formData.cooperativaId || null,
        };

        const { error: perfilError } = await supabase
          .from("perfiles")
          .upsert(perfilInsert, { onConflict: "id" });

        if (perfilError) {
          // Log detallado para que veas en la consola qué columna falla
          console.error("DETALLE ERROR DB:", perfilError);
          throw new Error(
            `Error en tabla perfiles: ${perfilError.message} (Código: ${perfilError.code})`
          );
        }

        toast.success("¡Usuario creado con éxito!");
        onRefresh();
        onClose();
      }
    } catch (err: any) {
      console.error("ERROR COMPLETO:", err);
      // Si el error es de Auth por correo repetido
      if (err.message?.includes("already registered")) {
        toast.error("Este correo ya está registrado en el sistema.");
      } else {
        toast.error(err.message || "Error al procesar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#09184D]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-300 hover:text-[#EA2264] transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-[#09184D] tracking-tighter uppercase italic">
            Nuevo <span className="text-[#EA2264]">Acceso</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Gestión de credenciales administrativas
          </p>
        </div>

        <form onSubmit={handleCrear} className="space-y-4">
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={18}
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              required
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-[#EA2264]/20 font-bold text-sm text-[#09184D]"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="relative">
            <Shield
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={18}
            />
            <input
              type="text"
              placeholder="Nombre completo"
              required
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-[#EA2264]/20 font-bold text-sm text-[#09184D]"
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative col-span-2">
              <Shield
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EA2264]"
                size={16}
              />
              <select
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-[#EA2264]/20 font-bold text-xs text-[#09184D] appearance-none cursor-pointer"
                value={formData.rol}
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value })
                }
              >
                <option value="operador">Operador de Cooperativa</option>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {formData.rol !== "admin" && (
            <div className="relative animate-in slide-in-from-top-2">
              <Building2
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EA2264]"
                size={16}
              />
              <select
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-[#EA2264]/20 font-bold text-xs text-[#09184D] appearance-none cursor-pointer"
                onChange={(e) =>
                  setFormData({ ...formData, cooperativaId: e.target.value })
                }
                required={formData.rol !== "admin"}
              >
                <option value="">Seleccionar Cooperativa...</option>
                {cooperativas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_cooperativa}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-2">
            <div className="flex gap-3">
              <Key className="text-amber-500 shrink-0" size={18} />
              <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">
                La contraseña temporal será:{" "}
                <span className="text-black bg-white px-1 font-mono">
                  PasswordTemporal123!
                </span>
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <UserPlus size={18} />
            )}
            {loading ? "Registrando..." : "Crear Usuario"}
          </button>
        </form>
      </div>
    </div>
  );
}
