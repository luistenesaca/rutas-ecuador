"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Trash2,
  Bus,
  MapPin,
  LayoutDashboard,
  Building2,
  MapPinned,
  Search,
  Check,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Phone,
  X,
} from "lucide-react";

// --- INTERFACES ---
interface Terminal {
  id: number;
  nombre_terminal: string;
  direccion_terminal?: string; // Opcional
  es_parada_oficial?: boolean; // Opcional
  alias_terminal: string | null; // <--- ASEGÚRATE DE QUE ESTÉ AQUÍ
  ciudades: { nombre_ciudad: string } | null;
}

interface Cooperativa {
  id: number;
  nombre_cooperativa: string;
  telefono: string | null;
  logo_url?: string;
}

interface FrecuenciaExistente {
  id: number;
  denominacion_ruta: string;
  tipo_servicio: string;
  cooperativa_id: number; // <--- AGREGADO: Necesario para el select al editar
  cooperativas: { nombre_cooperativa: string } | null;
  paradas_frecuencia?: any[]; // <--- AGREGADO: Para evitar errores en el map
}

interface ParadaForm {
  terminal_id: string;
  orden: number;
  hora_estimada: string;
  precio_acumulado: number;
  dia_relativo: number;
  permite_venta?: boolean;
}

type TabType = "dash" | "coop" | "frec" | "term";

export default function AdminPanel() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dash");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // --- DATOS ---
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [ciudades, setCiudades] = useState<
    { id: number; nombre_ciudad: string }[]
  >([]);
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [frecuenciasExistentes, setFrecuenciasExistentes] = useState<
    FrecuenciaExistente[]
  >([]);

  // Form Terminales
  const [nombreTerminalOficial, setNombreTerminalOficial] = useState("");
  const [direccionTerminal, setDireccionTerminal] = useState("");
  const [esParadaOficial, setEsParadaOficial] = useState(true);
  const [nombreTerminal, setNombreTerminal] = useState("");
  const [ciudadId, setCiudadId] = useState("");
  const [busquedaCiudad, setBusquedaCiudad] = useState("");
  const [mostrarListaCiudades, setMostrarListaCiudades] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busquedaRuta, setBusquedaRuta] = useState("");

  // Form Cooperativas
  const [nombreCoop, setNombreCoop] = useState("");
  const [telefonoCoop, setTelefonoCoop] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Form Rutas

  const [selectedCoop, setSelectedCoop] = useState("");
  const [rutaNombre, setRutaNombre] = useState("");
  const [tipoServicio, setTipoServicio] = useState("Normal");
  const [paradas, setParadas] = useState<ParadaForm[]>([
    {
      terminal_id: "",
      orden: 1,
      hora_estimada: "",
      precio_acumulado: 0,
      dia_relativo: 0,
      permite_venta: true,
    },
  ]);

  const [busquedaCoop, setBusquedaCoop] = useState("");
  const [mostrarListaCoop, setMostrarListaCoop] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
const [filtroParada, setFiltroParada] = useState("");

  const moverParada = (index: number, direccion: "subir" | "bajar") => {
    const nuevasParadas = [...paradas];
    const nuevoIndex = direccion === "subir" ? index - 1 : index + 1;

    if (nuevoIndex < 0 || nuevoIndex >= nuevasParadas.length) return;

    // Intercambio de posiciones
    [nuevasParadas[index], nuevasParadas[nuevoIndex]] = [
      nuevasParadas[nuevoIndex],
      nuevasParadas[index],
    ];

    // Recalcular el número de orden basado en el nuevo array
    const paradasReordenadas = nuevasParadas.map((p, i) => ({
      ...p,
      orden: i + 1,
    }));
    setParadas(paradasReordenadas);
  };

  const inputStyle =
    "w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 transition-all text-[#0b2545] font-medium shadow-sm placeholder:text-gray-300";
  const labelStyle =
    "text-[10px] font-black text-[#0b2545] uppercase ml-2 tracking-widest opacity-60";
  const rutasFiltradas = frecuenciasExistentes.filter((f: any) => {
    const termino = busquedaRuta.toLowerCase();
    const nombreRuta = f.denominacion_ruta?.toLowerCase() || "";
    const nombreCoop = f.cooperativas?.nombre_cooperativa?.toLowerCase() || "";
    return nombreRuta.includes(termino) || nombreCoop.includes(termino);
  });
  const fetchData = useCallback(async () => {
    const { data: coops, error: coopsError } = await supabase
      .from("cooperativas") // <-- Verifica que el nombre sea exacto en tu DB
      .select("*")
      .order("nombre_cooperativa");

    if (coopsError) {
      console.error("Error cargando cooperativas:", coopsError.message);
    } else {
      setCooperativas(coops || []); // <-- ESTA LÍNEA ES VITAL
    }
    const { data: terms } = await supabase
      .from("terminales")
      .select(
        "id, nombre_terminal, direccion_terminal, es_parada_oficial, alias_terminal, ciudades(nombre_ciudad)"
      )
      .order("id", { ascending: false }); // <--- IMPORTANTE: Orden descendente

    if (terms) setTerminales(terms as unknown as Terminal[]);
    const { data: ciuds } = await supabase
      .from("ciudades")
      .select("id, nombre_ciudad")
      .order("nombre_ciudad");
    const { data: frecs } = await supabase
      .from("frecuencias")
      .select(
        `
    *, 
    cooperativas(nombre_cooperativa),
    paradas_frecuencia(
      id, 
      hora_estimada, 
      orden, 
      permite_venta, 
      precio_acumulado, 
      dia_relativo,
      terminal_id
    )
  `
      )
      .order("id", { ascending: false });

    if (frecs) {
      const frecsProcesadas = frecs.map((f) => {
        const paradaSalida = f.paradas_frecuencia?.find(
          (p: any) => p.orden === 1
        );

        // Lógica para formatear la hora de HH:MM:SS a HH:MM
        let horaLimpia = "--:--";
        if (paradaSalida && paradaSalida.hora_estimada) {
          // Tomamos solo los primeros 5 caracteres (HH:MM)
          horaLimpia = paradaSalida.hora_estimada.slice(0, 5);
        }

        return {
          ...f,
          hora_salida_prioritaria: horaLimpia,
        };
      });
      setFrecuenciasExistentes(frecsProcesadas);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  const notify = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  useEffect(() => {
    const fetchCiudades = async () => {
      const { data, error } = await supabase
        .from("ciudades") // Asegúrate que el nombre de la tabla sea exacto
        .select("id, nombre_ciudad")
        .order("nombre_ciudad", { ascending: true });

      if (error) {
        console.error("Error cargando ciudades:", error);
      } else {
        setCiudades(data || []); // Verifica que setCiudades esté actualizando el estado
      }
    };
    fetchCiudades();
  }, []);

  // --- HANDLERS ---
  const handleGuardarTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciudadId) return;
    setLoading(true);

    const { error } = await supabase.from("terminales").insert([
      {
        ciudad_id: Number(ciudadId),
        nombre_terminal: nombreTerminalOficial,
        direccion_terminal: direccionTerminal,
        es_parada_oficial: esParadaOficial,
        alias_terminal: nombreTerminal || null, // Si está vacío, guarda NULL
      },
    ]);

    if (!error) {
      setNombreTerminal("");
      setNombreTerminalOficial("");
      setDireccionTerminal("");
      setBusquedaCiudad("");
      setCiudadId("");
      fetchData();
      notify();
    }
    setLoading(false);
  };

  const handleCargarRuta = async (
    frecuencia: any,
    modo: "editar" | "duplicar"
  ) => {
    setLoading(true);
    setActiveTab("frec");

    setEditingId(modo === "editar" ? frecuencia.id : null);
    setSelectedCoop(frecuencia.cooperativa_id.toString());
    setRutaNombre(
      modo === "duplicar"
        ? `${frecuencia.denominacion_ruta} (COPIA)`
        : frecuencia.denominacion_ruta
    );
    setTipoServicio(frecuencia.tipo_servicio);

    const { data: paradasDB } = await supabase
      .from("paradas_frecuencia")
      .select("*") // Esto ya trae permite_venta de la DB
      .eq("frecuencia_id", frecuencia.id)
      .order("orden", { ascending: true });

    if (paradasDB) {
      const paradasFormateadas = paradasDB.map((p) => ({
        terminal_id: p.terminal_id.toString(),
        orden: p.orden,
        hora_estimada: p.hora_estimada ? p.hora_estimada.slice(0, 5) : "",
        precio_acumulado: p.precio_acumulado,
        dia_relativo: p.dia_relativo,
        permite_venta: p.permite_venta !== false,
      }));
      setParadas(paradasFormateadas);
    }

    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (modo === "duplicar") notify();
  };

  const handleGuardarRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let frecuenciaId = editingId;

    if (editingId) {
      // CASO EDITAR: Actualizamos la frecuencia existente
      await supabase
        .from("frecuencias")
        .update({
          cooperativa_id: Number(selectedCoop),
          denominacion_ruta: rutaNombre,
          tipo_servicio: tipoServicio,
        })
        .eq("id", editingId);

      // Borramos paradas viejas para insertar las nuevas (más limpio)
      await supabase
        .from("paradas_frecuencia")
        .delete()
        .eq("frecuencia_id", editingId);
    } else {
      // CASO NUEVO / DUPLICADO: Insertamos nueva frecuencia
      const { data: nueva } = await supabase
        .from("frecuencias")
        .insert([
          {
            cooperativa_id: Number(selectedCoop),
            denominacion_ruta: rutaNombre,
            tipo_servicio: tipoServicio,
          },
        ])
        .select()
        .single();
      if (nueva) frecuenciaId = nueva.id;
    }

    // Insertar las paradas (común para ambos casos)
    if (frecuenciaId) {
      const pInsert = paradas.map((p) => ({
        frecuencia_id: frecuenciaId,
        terminal_id: Number(p.terminal_id),
        orden: p.orden,
        hora_estimada: p.hora_estimada,
        precio_acumulado: Number(p.precio_acumulado),
        dia_relativo: Number(p.dia_relativo),
        permite_venta: p.permite_venta !== false, // Garantiza booleano
      }));
      await supabase.from("paradas_frecuencia").insert(pInsert);
    }

    // Limpiar y resetear
    setEditingId(null);
    setRutaNombre("");
    setParadas([
      {
        terminal_id: "",
        orden: 1,
        hora_estimada: "",
        precio_acumulado: 0,
        dia_relativo: 0,
        permite_venta: true,
      },
    ]);
    fetchData();
    notify();
    setLoading(false);
  };
  const handleGuardarCoop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("cooperativas").insert([
      {
        nombre_cooperativa: nombreCoop,
        telefono: telefonoCoop,
        logo_url: logoUrl || null,
      },
    ]);

    if (error) {
      console.error("Error al guardar:", error.message);
      alert("No se pudo guardar la cooperativa");
    } else {
      setNombreCoop("");
      setTelefonoCoop("");
      setLogoUrl("");
      fetchData();
      notify();
    }
    setLoading(false);
  };

  useEffect(() => {
  const handleClickAfuera = (e: MouseEvent) => {
    // Si el clic no fue dentro de un buscador, cerramos los dropdowns
    if (!(e.target as Element).closest(".contenedor-buscador")) {
      setMostrarListaCoop(false);
      setActiveSearchIndex(null);
    }
  };

  document.addEventListener("mousedown", handleClickAfuera);
  return () => document.removeEventListener("mousedown", handleClickAfuera);
}, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-[#0b2545]">
      {/* NOTIFICACIÓN FLOTANTE */}
      {showSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[100]">
          <Check size={20} className="bg-white/20 rounded-full p-1" />
          <span className="font-black uppercase text-[10px] tracking-widest">
            Cambios guardados con éxito
          </span>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* NAVEGACIÓN SUPERIOR TIPO APP */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Panel de Control
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Gestiona frecuencias, terminales y operadoras.
            </p>
          </div>

          <nav className="flex gap-1 bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-gray-100 overflow-x-auto w-full md:w-auto">
            {(["dash", "frec", "coop", "term"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[#0b2545] text-white shadow-lg"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                {tab === "dash" && <LayoutDashboard size={16} />}
                {tab === "frec" && <Bus size={16} />}
                {tab === "coop" && <Building2 size={16} />}
                {tab === "term" && <MapPin size={16} />}
                {tab === "dash"
                  ? "Inicio"
                  : tab === "frec"
                  ? "Rutas"
                  : tab === "coop"
                  ? "Operadoras"
                  : "Terminales"}
              </button>
            ))}
          </nav>
        </div>

        {/* --- VISTA DASHBOARD (INICIO) --- */}
        {activeTab === "dash" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* MÉTRICAS RÁPIDAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "Rutas Activas",
                  val: frecuenciasExistentes?.length || 0, // Fallback a 0
                  icon: Bus,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Operadoras de transporte",
                  val: cooperativas?.length || 0,
                  icon: Building2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Paradas Registradas",
                  val: terminales?.length || 0,
                  icon: MapPin,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-5 hover:scale-[1.02] transition-transform cursor-default"
                >
                  <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl`}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-black">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ÚLTIMAS RUTAS REGISTRADAS */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-[#0b2545]">
                    Rutas Recientes
                  </h3>
                  <button
                    onClick={() => setActiveTab("frec")}
                    className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    Ver todas <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-4">
                  {frecuenciasExistentes.length > 0 ? (
                    frecuenciasExistentes.slice(0, 4).map((f: any) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Bus size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-none mb-1 text-[#0b2545]">
                              {f.denominacion_ruta}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                              {f.cooperativas?.nombre_cooperativa ||
                                "Sin Cooperativa"}
                            </p>
                          </div>
                        </div>
                        {/* Mostramos la hora de salida también aquí para ser consistentes */}
                        <div className="text-right">
                          <p className="text-xs font-black text-blue-600">
                            {f.hora_salida_prioritaria}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest">
                      No hay rutas aún
                    </p>
                  )}
                </div>
              </div>

              {/* ACCIONES RÁPIDAS (Sección Oscura) */}
              <div className="bg-[#0b2545] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden flex flex-col justify-center">
                <div className="relative z-10">
                  <h3 className="text-xl font-black mb-2">Gestión Inmediata</h3>
                  <p className="text-white/60 text-sm mb-8 leading-relaxed">
                    Añade nuevos puntos de parada o publica itinerarios en
                    segundos.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab("frec")}
                      className="bg-white/10 hover:bg-blue-600 p-5 rounded-3xl text-left transition-all border border-white/5 group"
                    >
                      <Plus
                        className="mb-3 text-blue-400 group-hover:text-white transition-colors"
                        size={24}
                      />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Nueva Ruta
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveTab("term")}
                      className="bg-white/10 hover:bg-emerald-600 p-5 rounded-3xl text-left transition-all border border-white/5 group"
                    >
                      <MapPin
                        className="mb-3 text-emerald-400 group-hover:text-white transition-colors"
                        size={24}
                      />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Nueva Parada
                      </p>
                    </button>
                  </div>
                </div>
                {/* Decoración visual */}
                <Bus className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 rotate-12" />
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA RUTAS --- */}
        {activeTab === "frec" && (
          <div className="space-y-12 animate-in slide-in-from-right-5 duration-500">
            {/* FORMULARIO DE REGISTRO / EDICIÓN */}
            <form
              onSubmit={handleGuardarRuta}
              className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                    {editingId ? (
                      <Plus size={32} className="rotate-45" />
                    ) : (
                      <Bus size={32} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">
                      {editingId
                        ? "Editando Ruta existente"
                        : "Registrar Nueva Ruta"}
                    </h2>
                    <p className="text-gray-400 text-sm font-medium">
                      Gestiona itinerarios, paradas y precios oficiales.
                    </p>
                  </div>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setRutaNombre("");
                      setSelectedCoop("");
                      setTipoServicio("Normal");
                      setParadas([
                        {
                          terminal_id: "",
                          orden: 1,
                          hora_estimada: "",
                          precio_acumulado: 0,
                          dia_relativo: 0,
                        },
                      ]);
                    }}
                    className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>

              {/* Inputs Principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 relative contenedor-buscador">
  <label className={labelStyle}>Cooperativa / Operadora</label>
  <div className="relative">
    <input
      type="text"
      placeholder="Seleccionar cooperativa..."
      value={mostrarListaCoop ? busquedaCoop : (cooperativas.find(c => c.id.toString() === selectedCoop)?.nombre_cooperativa || "")}
      onChange={(e) => {
        setBusquedaCoop(e.target.value);
        setMostrarListaCoop(true);
      }}
      onFocus={() => {
        setBusquedaCoop("");
        setMostrarListaCoop(true);
      }}
      className={inputStyle}
    />
    {mostrarListaCoop && (
      <div className="absolute z-[110] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
        {cooperativas.filter(c => c.nombre_cooperativa.toLowerCase().includes(busquedaCoop.toLowerCase())).map(c => (
          <button
            key={c.id}
            type="button"
            className="w-full text-left px-5 py-3 hover:bg-blue-50 font-bold text-xs border-b border-gray-50"
            onClick={() => {
              setSelectedCoop(c.id.toString());
              setBusquedaCoop(c.nombre_cooperativa);
              setMostrarListaCoop(false);
            }}
          >
            {c.nombre_cooperativa}
          </button>
        ))}
      </div>
    )}
  </div>
</div>
                <div className="space-y-2">
                  <label className={labelStyle}>Nombre de la Ruta</label>
                  <input
                    required
                    placeholder="Ej: Quito - Guayaquil - Directo"
                    value={rutaNombre}
                    onChange={(e) => setRutaNombre(e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelStyle}>Tipo de Servicio</label>
                  <select
                    value={tipoServicio}
                    onChange={(e) => setTipoServicio(e.target.value)}
                    className={inputStyle}
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="MICROBUS">MICROBUS</option>
                    <option value="EJECUTIVO">EJECUTIVO</option>
                    <option value="ESPECIAL">ESPECIAL</option>
                    <option value="PLATINUM SERVICE">PLATINUM SERVICE</option>
                    <option value="EJECUTIVO DOBLE PISO">
                      EJECUTIVO DOBLE PISO
                    </option>
                    <option value="SUITE CAMA DOBLE PISO">
                      SUITE CAMA DOBLE PISO
                    </option>
                    <option value="BUS CAMA">BUS CAMA</option>
                    <option value="BUS CAMA DOBLE PISO">
                      BUS CAMA DOBLE PISO
                    </option>
                  </select>
                </div>
              </div>

              {/* Sección de Paradas */}
              <div className="space-y-6 bg-gray-50/50 p-6 md:p-8 rounded-[2.5rem] border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-6">
                  <h4 className="font-black text-lg flex items-center gap-2 text-[#0b2545]">
                    <Clock size={20} className="text-blue-600" /> Itinerario de
                    ruta
                  </h4>

                  <div className="flex gap-2">
                    {/* Botón Invertir eliminado según solicitud */}
                    <button
                      type="button"
                      onClick={() =>
                        setParadas([
                          ...paradas,
                          {
                            terminal_id: "",
                            orden: paradas.length + 1,
                            hora_estimada: "",
                            precio_acumulado: 0,
                            dia_relativo: 0,
                          },
                        ])
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
                    >
                      <Plus size={16} /> AÑADIR PARADA
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
  {paradas.map((p, i) => (
    <div
      key={i}
      className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-2xl items-center border border-gray-100 hover:shadow-md transition-all relative"
    >
      {/* 1. CONTROLES DE ORDEN */}
      <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-gray-50 pr-2">
        <button
          type="button"
          disabled={i === 0}
          onClick={() => moverParada(i, 'subir')}
          className="text-gray-300 hover:text-blue-600 disabled:opacity-0 transition-colors"
        >
          <ChevronRight size={18} className="-rotate-90" />
        </button>
        <span className="text-lg font-black text-blue-600 leading-none my-1">
          #{p.orden}
        </span>
        <button
          type="button"
          disabled={i === paradas.length - 1}
          onClick={() => moverParada(i, 'bajar')}
          className="text-gray-300 hover:text-blue-600 disabled:opacity-0 transition-colors"
        >
          <ChevronRight size={18} className="rotate-90" />
        </button>
      </div>

      {/* 2. BUSCADOR DE OFICINA/TERMINAL */}
      <div className="md:col-span-3 relative contenedor-buscador">
  <div className="relative">
    <input
      type="text"
      placeholder="Seleccionar oficina..."
      autoComplete="off"
      className="w-full p-3 pl-9 rounded-xl border-none text-[11px] bg-gray-50 font-bold outline-none ring-2 ring-transparent focus:ring-blue-500/20"
      value={
        activeSearchIndex === i 
          ? filtroParada 
          : (() => {
              const term = terminales.find(t => t.id.toString() === p.terminal_id);
              if (!term) return "";
              const ciudad = term.ciudades?.nombre_ciudad || "";
              const alias = term.alias_terminal ? ` - ${term.alias_terminal}` : "";
              return `${ciudad}${alias}`;
            })()
      }
      onChange={(e) => {
        setFiltroParada(e.target.value);
        setActiveSearchIndex(i);
      }}
      onFocus={() => {
        setFiltroParada("");
        setActiveSearchIndex(i);
      }}
    />
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
  </div>

  {/* Dropdown de Terminales */}
  {activeSearchIndex === i && (
    <div className="absolute z-[120] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
      {terminales
        .filter(t => 
          `${t.ciudades?.nombre_ciudad} ${t.nombre_terminal} ${t.alias_terminal}`
          .toLowerCase()
          .includes(filtroParada.toLowerCase())
        )
        .map(t => (
          <button
            key={t.id}
            type="button"
            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
            onClick={() => {
              const nuevas = [...paradas];
              nuevas[i].terminal_id = t.id.toString();
              setParadas(nuevas);
              setActiveSearchIndex(null);
              setFiltroParada("");
            }}
          >
            <p className="font-black text-[10px] text-[#0b2545] uppercase">
              {t.ciudades?.nombre_ciudad} 
              {t.alias_terminal ? <span className="text-blue-600"> - {t.alias_terminal}</span> : ""}
            </p>
            <p className="text-[9px] text-gray-300 font-bold truncate">
              {t.nombre_terminal}
            </p>
          </button>
        ))}
      {terminales.length === 0 && (
        <div className="p-4 text-center text-gray-400 text-[10px] font-bold">CARGANDO...</div>
      )}
    </div>
  )}
</div>

      {/* 3. CAMPOS DE TIEMPO Y PRECIO (Igual que antes pero ajustando spans) */}
      <div className="md:col-span-2 relative">
        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="time"
          required
          value={p.hora_estimada}
          onChange={(e) => {
            const nuevas = [...paradas];
            nuevas[i].hora_estimada = e.target.value;
            setParadas(nuevas);
          }}
          className="w-full pl-9 p-3 rounded-xl border-none text-xs bg-gray-50 font-bold"
        />
      </div>

      <div className="md:col-span-2 relative">
        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={p.precio_acumulado || ""}
          onChange={(e) => {
            const nuevas = [...paradas];
            nuevas[i].precio_acumulado = Number(e.target.value);
            setParadas(nuevas);
          }}
          className="w-full pl-9 p-3 rounded-xl border-none text-xs bg-gray-50 font-bold"
        />
      </div>

      {/* 4. VENTA Y DÍA (Compactos) */}
      <div className="md:col-span-1 flex justify-center">
        <button
          type="button"
          onClick={() => {
            const nuevas = [...paradas];
            nuevas[i].permite_venta = !nuevas[i].permite_venta;
            setParadas(nuevas);
          }}
          className={`p-2 rounded-lg transition-colors ${
            p.permite_venta !== false ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
          }`}
        >
          {p.permite_venta !== false ? <Check size={16} /> : <X size={16} />}
        </button>
      </div>

      <div className="md:col-span-2">
        <select
          value={p.dia_relativo}
          onChange={(e) => {
            const nuevas = [...paradas];
            nuevas[i].dia_relativo = Number(e.target.value);
            setParadas(nuevas);
          }}
          className="w-full p-3 rounded-xl border-none text-[10px] bg-gray-50 font-black uppercase"
        >
          <option value={0}>Mismo Día</option>
          <option value={1}>Día Sig.</option>
        </select>
      </div>

      {/* 5. ELIMINAR */}
      <button
        type="button"
        onClick={() => {
          const filtradas = paradas.filter((_, idx) => idx !== i);
          setParadas(filtradas.map((p, idx) => ({ ...p, orden: idx + 1 })));
        }}
        className="md:col-span-1 text-gray-300 hover:text-red-500 transition-colors"
      >
        <Trash2 size={18} />
      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${
                  editingId
                    ? "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700"
                    : "bg-[#0b2545] shadow-blue-100 hover:bg-blue-900"
                }`}
              >
                {loading
                  ? "Sincronizando..."
                  : editingId
                  ? "Confirmar Cambios"
                  : "Guardar Frecuencia"}
              </button>
            </form>

            {/* --- LISTADO DE RUTAS EXISTENTES CON BUSCADOR --- */}
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h3 className="text-xl font-black text-[#0b2545]">
                    Frecuencias Registradas
                  </h3>
                  <p className="text-gray-400 text-xs font-medium">
                    Gestiona, busca y duplica itinerarios rápidamente.
                  </p>
                </div>

                <div className="relative w-full md:w-80">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por ruta o cooperativa..."
                    value={busquedaRuta}
                    onChange={(e) => setBusquedaRuta(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-xs font-bold transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {rutasFiltradas.length > 0 ? (
                  rutasFiltradas.map((f: any) => (
                    <div
                      key={f.id}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-xl transition-all animate-in fade-in duration-300"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center bg-white w-20 h-20 rounded-[1.5rem] shadow-sm border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1 tracking-tighter">
                            Frecuencia
                          </p>
                          <p className="text-lg font-black text-blue-600 font-mono tracking-tighter">
                            {f.hora_salida_prioritaria || "--:--"}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase tracking-widest">
                              {f.cooperativas?.nombre_cooperativa ||
                                "Sin Nombre"}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">
                              {f.tipo_servicio}
                            </span>
                            {f.paradas_frecuencia?.length >= 2 ? (
                              <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                Ruta Completa
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                Incompleta
                              </span>
                            )}
                          </div>

                          <h4 className="text-lg font-black text-[#0b2545]">
                            {f.denominacion_ruta}
                          </h4>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                              <MapPin size={12} />{" "}
                              {f.paradas_frecuencia?.length || 0} Paradas en el
                              recorrido
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6 md:mt-0">
                        <button
                          onClick={() => handleCargarRuta(f, "editar")}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                        >
                          <Plus size={14} className="rotate-45 text-blue-600" />{" "}
                          Editar
                        </button>
                        <button
                          onClick={() => handleCargarRuta(f, "duplicar")}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-95"
                        >
                          <Bus size={14} className="text-emerald-600" />{" "}
                          Duplicar
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              confirm(
                                "¿Seguro que deseas eliminar esta ruta? Se borrarán todas sus paradas asociadas."
                              )
                            ) {
                              setLoading(true);
                              // 1. Borrar paradas primero
                              await supabase
                                .from("paradas_frecuencia")
                                .delete()
                                .eq("frecuencia_id", f.id);
                              // 2. Borrar frecuencia después
                              await supabase
                                .from("frecuencias")
                                .delete()
                                .eq("id", f.id);
                              await fetchData();
                              setLoading(false);
                            }
                          }}
                          className="p-3 bg-white border border-gray-200 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <Search size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold text-sm">
                      No se encontraron rutas con "{busquedaRuta}"
                    </p>
                    <button
                      onClick={() => setBusquedaRuta("")}
                      className="text-blue-600 text-[10px] font-black uppercase mt-2 underline"
                    >
                      Limpiar búsqueda
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA PUNTOS / TERMINALES CORREGIDA --- */}
        {activeTab === "term" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-2">
              <form
                onSubmit={handleGuardarTerminal}
                className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                    <MapPinned size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-[#0b2545]">
                    Gestión de Terminales y Oficinas
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CIUDAD (Buscador Inteligente) */}
                  <div className="space-y-2 relative">
                    <label className={labelStyle}>Ciudad</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Buscar ciudad..."
                        value={busquedaCiudad}
                        onChange={(e) => {
                          setBusquedaCiudad(e.target.value);
                          setMostrarListaCiudades(true);
                          if (e.target.value === "") setCiudadId(""); // Limpiar ID si borra texto
                        }}
                        onFocus={() => setMostrarListaCiudades(true)}
                        className={inputStyle}
                      />
                      <Search
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
                        size={18}
                      />
                    </div>

                    {mostrarListaCiudades && busquedaCiudad.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                        {ciudades.filter((c) =>
                          c.nombre_ciudad
                            .toLowerCase()
                            .includes(busquedaCiudad.toLowerCase())
                        ).length > 0 ? (
                          ciudades
                            .filter((c) =>
                              c.nombre_ciudad
                                .toLowerCase()
                                .includes(busquedaCiudad.toLowerCase())
                            )
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors flex justify-between items-center border-b border-gray-50 last:border-0"
                                onClick={() => {
                                  setCiudadId(c.id.toString());
                                  setBusquedaCiudad(c.nombre_ciudad);
                                  setMostrarListaCiudades(false);
                                }}
                              >
                                <span className="font-bold text-[#0b2545] text-xs">
                                  {c.nombre_ciudad}
                                </span>
                                <Check size={14} className="text-blue-600" />
                              </button>
                            ))
                        ) : (
                          <div className="p-4 text-center text-gray-400 text-[10px] font-bold uppercase">
                            No hay resultados
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* NOMBRE TERMINAL */}
                  <div className="space-y-2">
                    <label className={labelStyle}>
                      Nombre de la Terminal / Oficina
                    </label>
                    <input
                      required
                      placeholder="Ej: Terminal Terrestre Quitumbe"
                      value={nombreTerminalOficial}
                      onChange={(e) => setNombreTerminalOficial(e.target.value)}
                      className={inputStyle}
                    />
                  </div>

                  {/* DIRECCIÓN */}
                  <div className="space-y-2 md:col-span-2">
                    <label className={labelStyle}>Dirección Exacta</label>
                    <div className="relative">
                      <MapPin
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                        size={18}
                      />
                      <input
                        placeholder="Ej: Av. Maldonado y Cóndor Ñan"
                        value={direccionTerminal}
                        onChange={(e) => setDireccionTerminal(e.target.value)}
                        className={inputStyle + " pl-12"}
                      />
                    </div>
                  </div>

                  {/* ALIAS */}
                  <div className="space-y-2">
                    <label className={labelStyle}>
                      Nombre corto o Alias (OPCIONAL)
                    </label>
                    <input
                      placeholder="Ej: Quitumbe"
                      value={nombreTerminal}
                      onChange={(e) => setNombreTerminal(e.target.value)}
                      className={inputStyle}
                    />
                  </div>

                  {/* TIPO DE PARADA */}
                  <div className="space-y-2">
                    <label className={labelStyle}>Terminal de salida</label>
                    <button
                      type="button"
                      onClick={() => setEsParadaOficial(!esParadaOficial)}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border-2 ${
                        esParadaOficial
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-gray-50 border-transparent text-gray-400"
                      }`}
                    >
                      <span className="font-bold text-xs uppercase tracking-tighter">
                        {esParadaOficial
                          ? "Terminal Oficial"
                          : "Parada Secundaria"}
                      </span>
                      <div
                        className={`w-10 h-6 rounded-full relative transition-colors ${
                          esParadaOficial ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            esParadaOficial ? "left-5" : "left-1"
                          }`}
                        ></div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* PREVISUALIZACIÓN */}
                <div className="bg-[#0b2545] p-6 rounded-[2rem] text-white overflow-hidden relative border border-white/10">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">
                    Como lo verá el pasajero:
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-bold text-xl italic opacity-70 text-blue-400">
                      {busquedaCiudad || "Ciudad"}
                    </p>
                    <p className="font-black text-xl truncate">
                      {nombreTerminal ? `(${nombreTerminal})` : ""}
                    </p>
                  </div>
                  <Bus className="absolute -right-6 -bottom-6 text-white/5 w-24 h-24 rotate-12" />
                </div>

                <button
                  type="submit"
                  disabled={loading || !ciudadId}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                >
                  {loading ? "Sincronizando..." : "Guardar"}
                </button>
              </form>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-gray-400">
                  Recien añadidas
                </h4>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                  {terminales.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 transition-all group"
                    >
                      <p className="font-black text-xs text-[#0b2545] leading-none mb-1">
                        {t.ciudades?.nombre_ciudad}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase truncate">
                        {t.nombre_terminal}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA COOPERATIVAS --- */}
        {activeTab === "coop" && (
          <div className="animate-in slide-in-from-left-5 duration-500 space-y-12">
            {/* FORMULARIO */}
            <form
              onSubmit={handleGuardarCoop}
              className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                  <Building2 size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#0b2545]">
                    Registro de Operadoras
                  </h3>
                  <p className="text-gray-400 text-sm font-medium">
                    Añade empresas de transporte al sistema.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className={labelStyle}>Nombre de Operadora</label>
                  <input
                    required
                    placeholder="Ej: Cooperativa Loja"
                    value={nombreCoop}
                    onChange={(e) => setNombreCoop(e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelStyle}>Contacto / WhatsApp</label>
                  <input
                    placeholder="Ej: 0999999999"
                    value={telefonoCoop}
                    onChange={(e) => setTelefonoCoop(e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelStyle}>URL del Logo (Opcional)</label>
                  <input
                    placeholder="https://servidor.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Sincronizando..." : "Registrar operadora"}
              </button>
            </form>

            {/* LISTADO TIPO GRID CON OPCIÓN DE ELIMINAR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cooperativas.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 group relative hover:shadow-xl hover:border-emerald-200 transition-all"
                >
                  {/* BOTÓN ELIMINAR */}
                  <button
                    onClick={async () => {
                      if (confirm(`¿Eliminar ${c.nombre_cooperativa}?`)) {
                        const { error } = await supabase
                          .from("cooperativas")
                          .delete()
                          .eq("id", c.id);
                        if (!error) fetchData();
                      }
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* IZQUIERDA: CONTENEDOR DE LOGO */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt={c.nombre_cooperativa}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Bus size={28} className="text-gray-300" />
                    )}
                  </div>

                  {/* DERECHA: INFORMACIÓN PRINCIPAL */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-[#0b2545] text-lg leading-tight mb-1 truncate">
                      {c.nombre_cooperativa}
                    </h4>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-[11px] text-gray-500 font-black uppercase tracking-widest">
                          Línea Operativa
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Phone size={12} />
                        </div>
                        <p className="text-xs font-bold text-[#0b2545]">
                          {c.telefono || "Sin teléfono"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
