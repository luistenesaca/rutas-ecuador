"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UserPlus, Building2, Mail, Lock, User, Loader2 } from "lucide-react";

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  
  // Campos del Formulario
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    cooperativaId: ""
  });

  // 1. Cargar cooperativas para el select
  useEffect(() => {
    const getCooperativas = async () => {
      const { data } = await supabase.from("cooperativas").select("id, nombre_cooperativa");
      if (data) setCooperativas(data);
    };
    getCooperativas();
  }, []);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 2. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { nombre_completo: formData.nombre } // Metadata opcional
      }
    });

    if (authError) {
      alert("Error al crear cuenta: " + authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 3. Crear el perfil vinculado en la tabla 'perfiles'
      const { error: perfilError } = await supabase
        .from("perfiles")
        .insert([
          {
            id: authData.user.id, // <-- USAMOS EL ID QUE GENERÓ AUTH
            nombre_completo: formData.nombre,
            rol: "editor", // Rol por defecto
            cooperativa_id: formData.cooperativaId || null
          }
        ]);

      if (perfilError) {
        console.error("Error al crear perfil:", perfilError);
      } else {
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-50">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#09184D] tracking-tighter">
            Crear <span className="text-[#EA2264]">Cuenta</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-2">Únete a la red de cooperativas</p>
        </header>

        <form onSubmit={handleRegistro} className="space-y-5">
          {/* NOMBRE */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input
              type="text"
              placeholder="Nombre Completo"
              className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#EA2264]/20 font-medium"
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          {/* EMAIL */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input
              type="email"
              placeholder="Correo Electrónico"
              className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#EA2264]/20 font-medium"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#EA2264]/20 font-medium"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          {/* SELECT COOPERATIVA */}
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <select
              className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#EA2264]/20 font-medium appearance-none"
              onChange={(e) => setFormData({...formData, cooperativaId: e.target.value})}
              required
            >
              <option value="">Selecciona tu Cooperativa</option>
              {cooperativas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre_cooperativa}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#09184D] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#EA2264] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#09184D]/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
            Registrarse ahora
          </button>
        </form>
      </div>
    </div>
  );
}