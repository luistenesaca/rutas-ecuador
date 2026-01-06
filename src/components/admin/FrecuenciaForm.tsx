"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bus,
  MapPin,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  Search,
  Check,
  X,
  ChevronRight,
  Info,
} from "lucide-react";

interface FrecuenciaFormProps {
  mode: "create" | "edit" | "clone";
  id?: string | string[]; // Solo para edit y clone
}

export default function FrecuenciaForm({ mode, id }: FrecuenciaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode !== "create");

  // --- ESTADOS DEL FORMULARIO ---
  const [cooperativaId, setCooperativaId] = useState("");
  const [busquedaCoop, setBusquedaCoop] = useState("");
  const [denominacionRuta, setDenominacionRuta] = useState("");
  const [tipoServicio, setTipoServicio] = useState("NORMAL");
  const [paradas, setParadas] = useState<any[]>([
    {
      terminal_id: "",
      orden: 1,
      hora_estimada: "",
      precio_acumulado: 0,
      dia_relativo: 0,
      permite_venta: true,
    },
    {
      terminal_id: "",
      orden: 2,
      hora_estimada: "",
      precio_acumulado: 0,
      dia_relativo: 0,
      permite_venta: true,
    },
  ]);

  // --- DATOS DE REFERENCIA ---
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  const [terminales, setTerminales] = useState<any[]>([]);

  // --- UI REFS ---
  const contenedorCoopRef = useRef<HTMLDivElement>(null);
  const [mostrarListaCoop, setMostrarListaCoop] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(
    null
  );
  const [filtroParada, setFiltroParada] = useState("");

  const labelStyle =
    "text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1";

  // 1. Carga inicial de catálogos y datos si es edit/clone
  useEffect(() => {
    async function loadAll() {
      const [coopRes, termRes] = await Promise.all([
        supabase.from("cooperativas").select("*").order("nombre_cooperativa"),
        supabase
          .from("terminales")
          .select("*, ciudades(nombre_ciudad)")
          .order("id"),
      ]);
      const coops = coopRes.data || [];
      setCooperativas(coops);
      setTerminales(termRes.data || []);

      if (id && (mode === "edit" || mode === "clone")) {
        const { data: frec } = await supabase
          .from("frecuencias")
          .select("*, paradas_frecuencia(*)")
          .eq("id", id)
          .single();

        if (frec) {
          setCooperativaId(frec.cooperativa_id.toString());
          setBusquedaCoop(
            coops.find((c) => c.id === frec.cooperativa_id)
              ?.nombre_cooperativa || ""
          );
          setDenominacionRuta(
            mode === "clone"
              ? `${frec.denominacion_ruta} (COPIA)`
              : frec.denominacion_ruta
          );
          setTipoServicio(frec.tipo_servicio);

          const pOrdenadas = frec.paradas_frecuencia
            .sort((a: any, b: any) => a.orden - b.orden)
            .map((p: any) => ({
              ...p,
              terminal_id: p.terminal_id.toString(),
              hora_estimada: p.hora_estimada.slice(0, 5),
            }));
          setParadas(pOrdenadas);
        }
      }
      setFetching(false);
    }
    loadAll();
  }, [id, mode]);

  // 2. Manejo de clics externos
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        contenedorCoopRef.current &&
        !contenedorCoopRef.current.contains(event.target as Node)
      )
        setMostrarListaCoop(false);
      if (activeSearchIndex !== null) {
        const buscadores = document.querySelectorAll(
          ".contenedor-buscador-parada"
        );
        let clicDentro = false;
        buscadores.forEach((el) => {
          if (el.contains(event.target as Node)) clicDentro = true;
        });
        if (!clicDentro) setActiveSearchIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeSearchIndex]);

  // 3. Lógica de Guardado (Universal)
  const handleGuardar = async () => {
    if (!cooperativaId || !denominacionRuta || paradas.some((p) => !p.terminal_id)) {
      alert("⚠️ Completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      let frecuenciaIdFinal: number;

      // --- ERROR 1 CORREGIDO: Manejo de IDs y tipos de datos en la Frecuencia ---
      if (mode === "create" || mode === "clone") {
        const { data, error: errorFrec } = await supabase
          .from("frecuencias")
          .insert([
            {
              cooperativa_id: parseInt(cooperativaId),
              denominacion_ruta: denominacionRuta.toUpperCase().trim(),
              tipo_servicio: tipoServicio,
            },
          ])
          .select()
          .single();
        
        if (errorFrec) throw errorFrec;
        frecuenciaIdFinal = data.id;
      } else {
        // En modo EDIT, usamos el ID que viene por props
        const idNumerico = Number(id);
        const { error: errorUpdate } = await supabase
          .from("frecuencias")
          .update({
            cooperativa_id: parseInt(cooperativaId),
            denominacion_ruta: denominacionRuta.toUpperCase().trim(),
            tipo_servicio: tipoServicio,
          })
          .eq("id", idNumerico);

        if (errorUpdate) throw errorUpdate;
        frecuenciaIdFinal = idNumerico;

        // Limpiar paradas antiguas antes de re-insertar
        const { error: errorDelete } = await supabase
          .from("paradas_frecuencia")
          .delete()
          .eq("frecuencia_id", idNumerico);
        
        if (errorDelete) throw errorDelete;
      }

      // --- ERROR 2 CORREGIDO: Formato de hora y limpieza de datos en paradas ---
      const paradasFinales = paradas.map((p) => {
        // Supabase tipo 'time' requiere HH:mm:ss o HH:mm
        // Validamos que la hora no esté vacía
        if (!p.hora_estimada) throw new Error(`La parada #${p.orden} no tiene hora asignada`);

        return {
          frecuencia_id: frecuenciaIdFinal,
          terminal_id: parseInt(p.terminal_id),
          orden: parseInt(p.orden),
          // Aseguramos que la hora tenga el formato correcto (HH:mm)
          hora_estimada: p.hora_estimada.length === 5 ? p.hora_estimada : p.hora_estimada.slice(0, 5),
          precio_acumulado: parseFloat(p.precio_acumulado) || 0,
          dia_relativo: parseInt(p.dia_relativo) || 0,
          permite_venta: p.permite_venta !== false,
        };
      });

      // --- ERROR 3 CORREGIDO: Inserción masiva de paradas ---
      const { error: errorParadas } = await supabase
        .from("paradas_frecuencia")
        .insert(paradasFinales);

      if (errorParadas) throw errorParadas;

      alert("✅ Registro guardado exitosamente");
      router.push("/admin/dashboard/frecuencias");
      router.refresh(); // Forzar actualización de datos en el listado

    } catch (err: any) {
      console.error("DETALLE COMPLETO DEL ERROR:", err);
      // Mensaje más descriptivo según el error de Supabase
      const msg = err.code === "23503" 
        ? "Error de clave foránea: Una terminal o cooperativa seleccionada no existe." 
        : err.message || "Error desconocido al procesar la base de datos";
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="p-20 text-center font-black text-gray-300 animate-pulse uppercase tracking-widest italic">
        Sincronizando datos...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      {/* HEADER */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-[#EA2264] text-[10px] font-black tracking-[0.2em] transition-all"
      >
        <ArrowLeft size={14} strokeWidth={3} /> VOLVER AL LISTADO
      </button>

      <h2 className="text-4xl font-black text-[#09184D] tracking-tighter italic uppercase">
        {mode === "edit" ? "Editar" : mode === "clone" ? "Clonar" : "Nueva"}{" "}
        <span className="text-[#EA2264]">Frecuencia</span>
      </h2>

      {/* SECCIÓN 1: GENERAL */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-[#09184D] font-black text-xs uppercase tracking-widest border-b border-gray-50 pb-4">
          <Info size={16} className="text-[#EA2264]" /> Información General
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className={labelStyle}>Nombre de la Ruta</label>
            <input
              type="text"
              placeholder="Ej: Quito - Guayaquil Directo"
              className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-gray-100 transition-all"
              value={denominacionRuta}
              onChange={(e) => setDenominacionRuta(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelStyle}>Tipo de Servicio</label>
            <select
              className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-gray-100 transition-all"
              value={tipoServicio}
              onChange={(e) => setTipoServicio(e.target.value)}
            >
              {[
                "NORMAL",
                "MICROBUS",
                "EJECUTIVO",
                "ESPECIAL",
                "PLATINUM SERVICE",
                "EJECUTIVO DOBLE PISO",
                "SUITE CAMA DOBLE PISO",
                "BUS CAMA",
                "BUS CAMA DOBLE PISO",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div
            className="md:col-span-3 space-y-2 relative"
            ref={contenedorCoopRef}
          >
            <label className={labelStyle}>Cooperativa / Operadora</label>
            <div className="relative">
              <Bus
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EA2264]"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar Cooperativa..."
                className="w-full bg-gray-50 border-none p-4 pl-12 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-gray-100 transition-all"
                value={busquedaCoop}
                onChange={(e) => {
                  setBusquedaCoop(e.target.value);
                  setMostrarListaCoop(true);
                }}
                onFocus={() => setMostrarListaCoop(true)}
              />
            </div>
            {mostrarListaCoop && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                {cooperativas
                  .filter((c) =>
                    c.nombre_cooperativa
                      .toLowerCase()
                      .includes(busquedaCoop.toLowerCase())
                  )
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-5 py-3 hover:bg-gray-50 font-bold text-xs border-b border-gray-50 last:border-0 text-gray-700"
                      onClick={() => {
                        setCooperativaId(c.id.toString());
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
      </div>

      {/* SECCIÓN 2: ITINERARIO */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-[#09184D] flex items-center gap-2 italic uppercase">
          <MapPin className="text-[#EA2264]" size={20} /> Itinerario de Paradas
        </h3>

        <div className="space-y-3">
          {paradas.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-[2rem] items-center border border-gray-100 shadow-sm transition-all hover:border-gray-200"
            >
              {/* ORDEN */}
              <div className="md:col-span-1 flex flex-col items-center border-r border-gray-50 pr-2">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => {
                    const n = [...paradas];
                    [n[i], n[i - 1]] = [n[i - 1], n[i]];
                    setParadas(n.map((x, idx) => ({ ...x, orden: idx + 1 })));
                  }}
                  className="text-gray-500 hover:text-[#EA2264] disabled:opacity-0"
                >
                  <ChevronRight size={16} className="-rotate-90" />
                </button>
                <span className="text-sm font-black text-[#09184D]">
                  #{p.orden}
                </span>
                <button
                  type="button"
                  disabled={i === paradas.length - 1}
                  onClick={() => {
                    const n = [...paradas];
                    [n[i], n[i + 1]] = [n[i + 1], n[i]];
                    setParadas(n.map((x, idx) => ({ ...x, orden: idx + 1 })));
                  }}
                  className="text-gray-500 hover:text-[#EA2264] disabled:opacity-0"
                >
                  <ChevronRight size={16} className="rotate-90" />
                </button>
              </div>

              {/* BUSCADOR PARADA */}
              <div className="md:col-span-3 relative contenedor-buscador-parada">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700"
                  />
                  <input
                    type="text"
                    placeholder="Terminal..."
                    className="w-full p-3 pl-9 rounded-xl border-none text-[11px] bg-gray-50 font-bold outline-none focus:bg-white focus:ring-2 ring-gray-100 text-gray-700"
                    value={
                      activeSearchIndex === i
                        ? filtroParada
                        : terminales.find(
                            (t) => t.id.toString() === p.terminal_id
                          )?.ciudades?.nombre_ciudad || ""
                    }
                    onChange={(e) => {
                      setFiltroParada(e.target.value);
                      setActiveSearchIndex(i);
                    }}
                    onFocus={() => {
                      setActiveSearchIndex(i);
                      setFiltroParada("");
                    }}
                  />
                </div>
                {activeSearchIndex === i && (
                  <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                    {terminales
                      .filter((t) =>
                        `${t.ciudades?.nombre_ciudad} ${t.alias_terminal}`
                          .toLowerCase()
                          .includes(filtroParada.toLowerCase())
                      )
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 text-gray-700"
                          onClick={() => {
                            const n = [...paradas];
                            n[i].terminal_id = t.id.toString();
                            setParadas(n);
                            setActiveSearchIndex(null);
                          }}
                        >
                          <p className="font-black text-[10px] uppercase">
                            {t.ciudades?.nombre_ciudad}{" "}
                            <span className="text-[#EA2264]">
                              {t.alias_terminal}
                            </span>
                          </p>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* HORA / PRECIO / VENTA / DÍA */}
              <div className="md:col-span-2 relative">
                <Clock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700"
                />
                <input
                  type="time"
                  required
                  value={p.hora_estimada}
                  onChange={(e) => {
                    const n = [...paradas];
                    n[i].hora_estimada = e.target.value;
                    setParadas(n);
                  }}
                  className="w-full pl-9 p-3 rounded-xl text-gray-700 border-none text-xs bg-gray-50 font-bold"
                />
              </div>

              <div className="md:col-span-2 relative">
                <DollarSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  value={p.precio_acumulado || ""}
                  onChange={(e) => {
                    const n = [...paradas];
                    n[i].precio_acumulado = e.target.value;
                    setParadas(n);
                  }}
                  className="w-full pl-9 p-3 rounded-xl border-none text-xs bg-gray-50 font-bold text-gray-700"
                />
              </div>

              <div className="md:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const n = [...paradas];
                    n[i].permite_venta = !n[i].permite_venta;
                    setParadas(n);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    p.permite_venta !== false
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-400"
                  }`}
                >
                  {p.permite_venta !== false ? (
                    <Check size={18} />
                  ) : (
                    <X size={18} />
                  )}
                </button>
              </div>

              <div className="md:col-span-2">
                <select
                  value={p.dia_relativo}
                  onChange={(e) => {
                    const n = [...paradas];
                    n[i].dia_relativo = Number(e.target.value);
                    setParadas(n);
                  }}
                  className="w-full p-3 rounded-xl text-gray-700 border-none text-[10px] bg-gray-50 font-black uppercase"
                >
                  <option value={0}>Mismo Día</option>
                  <option value={1}>Día Sig.</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const f = paradas.filter((_, idx) => idx !== i);
                  setParadas(f.map((p, idx) => ({ ...p, orden: idx + 1 })));
                }}
                className="md:col-span-1 text-gray-500 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            setParadas([
              ...paradas,
              {
                terminal_id: "",
                orden: paradas.length + 1,
                hora_estimada: "",
                precio_acumulado: 0,
                dia_relativo: 0,
                permite_venta: true,
              },
            ])
          }
          className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-500 font-black text-[10px] tracking-widest uppercase hover:border-[#EA2264]/30 hover:bg-[#EA2264]/5 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} strokeWidth={3} /> Añadir Parada
        </button>
      </div>

      <button
        onClick={handleGuardar}
        disabled={loading}
        className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
        {loading
          ? "Sincronizando..."
          : mode === "edit"
          ? "Actualizar Frecuencia"
          : "Registrar Frecuencia"}
      </button>
    </div>
  );
}
