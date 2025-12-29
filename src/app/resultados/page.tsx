"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { procesarResultados, ViajeProcesado } from "@/lib/bus-logic";
import { LocationSelector } from "@/components/LocationSelector";
import {
  Bus,
  ChevronRight,
  X,
  Clock,
  Search,
  ArrowLeftRight,
  Navigation,
  Filter,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Skeletons
const ViajeSkeleton = () => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 animate-pulse mb-6">
    <div className="grid grid-cols-12 gap-8 items-center">
      <div className="col-span-5 flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-100 rounded w-20"></div>
        </div>
      </div>
      <div className="col-span-4 h-10 bg-gray-100 rounded-2xl"></div>
      <div className="col-span-3 h-10 bg-gray-200 rounded-2xl"></div>
    </div>
  </div>
);

function ResultadosContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const origenIdParam = searchParams.get("origen");
  const destinoIdParam = searchParams.get("destino");

  const [puntos, setPuntos] = useState<any[]>([]);
  const [resultados, setResultados] = useState<ViajeProcesado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItinerario, setLoadingItinerario] = useState(false);
  const [filtroCooperativa, setFiltroCooperativa] = useState("todas");
  const [ordenPrecio, setOrdenPrecio] = useState("ninguno");
  const [soloDirectos, setSoloDirectos] = useState(false);
  const [itinerario, setItinerario] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [queryOrigen, setQueryOrigen] = useState("");
  const [idOrigen, setIdOrigen] = useState<number | null>(
    origenIdParam ? parseInt(origenIdParam) : null
  );
  const [showOrigen, setShowOrigen] = useState(false);

  const [queryDestino, setQueryDestino] = useState("");
  const [idDestino, setIdDestino] = useState<number | null>(
    destinoIdParam ? parseInt(destinoIdParam) : null
  );
  const [showDestino, setShowDestino] = useState(false);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [modalData, setModalData] = useState<{
    duracion: string;
    origenId: number;
    destinoId: number;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  // Cargar Puntos Iniciales
  useEffect(() => {
  if (!mounted) return;
  const loadPuntos = async () => {
    const { data } = await supabase
      .from("terminales")
      .select(`id, nombre_terminal, alias_terminal, ciudades(nombre_ciudad)`);

    if (data) {
      const puntosData = data.map((t: any) => ({
        id: t.id,
        alias: t.alias_terminal,
        ciudad: t.ciudades?.nombre_ciudad || "",
        nombreReal: t.nombre_terminal,
      }));
      setPuntos(puntosData);

      // PRIMERO ACTUALIZAMOS LOS IDS, LUEGO LOS QUERYS
      if (origenIdParam) {
        const o = puntosData.find((p) => p.id === parseInt(origenIdParam));
        if (o) {
          setIdOrigen(o.id);
          setQueryOrigen(o.alias ? `${o.ciudad} (${o.alias})` : o.ciudad);
        }
      }
      if (destinoIdParam) {
        const d = puntosData.find((p) => p.id === parseInt(destinoIdParam));
        if (d) {
          setIdDestino(d.id);
          setQueryDestino(d.alias ? `${d.ciudad} (${d.alias})` : d.ciudad);
        }
      }
    }
  };
  loadPuntos();
}, [mounted]);

  // Cargar Resultados
  useEffect(() => {
    const cargarResultados = async () => {
      if (!origenIdParam || !destinoIdParam) return;
      setLoading(true);
      const { data } = await supabase
        .from("paradas_frecuencia")
        .select(
          `
          frecuencia_id, orden, precio_acumulado, hora_estimada, dia_relativo, terminal_id, permite_venta,
          frecuencias ( tipo_servicio, cooperativas ( nombre_cooperativa, logo_url ) ),
          terminales ( id, nombre_terminal, alias_terminal, ciudades ( nombre_ciudad ) )
        `
        )
        .in("terminal_id", [parseInt(origenIdParam), parseInt(destinoIdParam)]);

      if (data) {
        const paradasRaw = data as any[];
        const grupos = paradasRaw.reduce((acc: any, curr) => {
          const fid = curr.frecuencia_id;
          if (!acc[fid]) acc[fid] = [];
          acc[fid].push(curr);
          return acc;
        }, {});

        const datosValidos: any[] = [];
        Object.values(grupos).forEach((paradasDeRuta: any) => {
          const pOrigen = paradasDeRuta.find(
            (p: any) => p.terminal_id === parseInt(origenIdParam)
          );
          if (pOrigen && pOrigen.permite_venta !== false)
            datosValidos.push(...paradasDeRuta);
        });
        setResultados(
          procesarResultados(
            datosValidos,
            parseInt(origenIdParam),
            parseInt(destinoIdParam)
          )
        );
      }
      setLoading(false);
    };
    cargarResultados();
  }, [origenIdParam, destinoIdParam]);

  const handleNewSearch = () => {
    if (!idOrigen || !idDestino || idOrigen === idDestino) return;
    setLoadingSearch(true);
    router.push(`/resultados?origen=${idOrigen}&destino=${idDestino}`);
    setLoadingSearch(false);
  };

  const verDetalle = async (
    fid: number,
    duracion: string,
    origenId: number,
    destinoId: number
  ) => {
    setLoadingItinerario(true);
    setShowModal(true);

    // Guardamos la info necesaria para el modal
    setModalData({ duracion, origenId, destinoId });

    const { data } = await supabase
      .from("paradas_frecuencia")
      .select(
        `orden, hora_estimada, permite_venta, 
       terminales ( id, nombre_terminal, alias_terminal, ciudades ( nombre_ciudad ) )`
      )
      .eq("frecuencia_id", fid)
      .order("orden", { ascending: true });

    if (data) setItinerario(data);
    setLoadingItinerario(false);
  };

  const resultadosFiltrados = resultados
    .filter(
      (v) =>
        (filtroCooperativa === "todas" ||
          v.cooperativa === filtroCooperativa) &&
        (!soloDirectos || v.numParadas === 0)
    )
    .sort((a, b) => {
      if (ordenPrecio === "menor-mayor") return a.precio - b.precio;
      if (ordenPrecio === "mayor-menor") return b.precio - a.precio;
      return 0;
    });

  const cooperativasDisponibles = Array.from(
    new Set(resultados.map((v) => v.cooperativa))
  );
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* HEADER BUSCADOR INTEGRADO */}
      <header className="bg-[#09184D] pt-6 pb-20 px-4 md:px-6 shadow-2xl relative">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push("/")}
              className="group flex items-center gap-4 transition-all cursor-pointer"
            >
              <div className="bg-[#EA2264] p-3 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                <Bus className="text-white" size={28} />
              </div>
              <div className="text-left">
                <h1 className="text-white font-black text-2xl tracking-tighter">
                  Rutas<span className="text-[#EA2264]">Ecuador</span>
                </h1>
                <p className="text-blue-300 text-[9px] font-black uppercase tracking-[0.3em] opacity-60">
                  Viaja con confianza
                </p>
              </div>
            </button>
            <div className="hidden md:flex items-center gap-2 text-blue-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
              <Navigation size={12} />
              Resultados de búsqueda
            </div>
          </div>

          {/* BUSCADOR DE RESULTADOS */}
          <div className="bg-white p-3 md:p-2 rounded-[2rem] md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2 md:gap-0">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 relative">
              <div className="relative px-4 text-gray-700">
                <LocationSelector
                  type="origen"
                  query={queryOrigen}
                  setQuery={setQueryOrigen}
                  selectedId={idOrigen}
                  setSelectedId={setIdOrigen}
                  showSuggestions={showOrigen}
                  setShowSuggestions={setShowOrigen}
                  otherId={idDestino}
                  puntos={puntos}
                />
              </div>

              {/* Botón Intercambio Desktop */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <button
                  onClick={() => {
                    const ti = idOrigen;
                    const tq = queryOrigen;
                    setIdOrigen(idDestino);
                    setQueryOrigen(queryDestino);
                    setIdDestino(ti);
                    setQueryDestino(tq);
                  }}
                  className="bg-[#09184D] text-white p-2 rounded-full border-4 border-white shadow-lg hover:rotate-180 hover:bg-[#EA2264] transition-all duration-500"
                >
                  <ArrowLeftRight size={16} strokeWidth={3} />
                </button>
              </div>

              <div className="relative px-4 border-t md:border-t-0 md:border-l text-gray-700 border-gray-100 pt-2 md:pt-0">
                <LocationSelector
                  type="destino"
                  query={queryDestino}
                  setQuery={setQueryDestino}
                  selectedId={idDestino}
                  setSelectedId={setIdDestino}
                  showSuggestions={showDestino}
                  setShowSuggestions={setShowDestino}
                  otherId={idOrigen}
                  puntos={puntos}
                />
              </div>
            </div>

            <button
              onClick={handleNewSearch}
              disabled={loadingSearch || !idOrigen || !idDestino}
              className="w-full md:w-auto bg-[#EA2264] hover:bg-[#c71b54] text-white px-8 py-4 md:h-[56px] rounded-[1.5rem] md:rounded-full font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingSearch ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Search size={18} />
              )}
              <span>Consultar</span>
            </button>
          </div>
        </div>
      </header>

      {/* FILTROS Y CONTADOR */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-30">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-[2rem] shadow-xl border border-white flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto no-scrollbar pb-2 lg:pb-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl shrink-0">
              <Filter size={14} className="text-gray-400" />
              <select
                value={filtroCooperativa}
                onChange={(e) => setFiltroCooperativa(e.target.value)}
                className="bg-transparent text-[11px] font-black text-[#0b2545] outline-none"
              >
                <option value="todas">Cooperativas</option>
                {cooperativasDisponibles.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl shrink-0">
              <select
                value={ordenPrecio}
                onChange={(e) => setOrdenPrecio(e.target.value)}
                className="bg-transparent text-[11px] font-black text-[#0b2545] outline-none"
              >
                <option value="ninguno">Ordenar Por</option>
                <option value="menor-mayor">Más Económico</option>
                <option value="mayor-menor">Más Costoso</option>
              </select>
            </div>

            <button
              onClick={() => setSoloDirectos(!soloDirectos)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all shrink-0 cursor-pointer ${
                soloDirectos
                  ? "bg-[#09184D] text-white"
                  : "bg-gray-50 text-gray-400 border border-gray-100"
              }`}
            >
              {soloDirectos ? "✓ Solo Directos" : "Todos"}
            </button>
          </div>

          <div className="flex items-center gap-4 bg-[#EA2264]/5 px-6 py-2 rounded-2xl">
            <div className="text-right">
              <p className="text-[8px] font-black text-[#EA2264] uppercase tracking-widest">
                Frecuencias disponibles
              </p>
              <p className="text-2xl font-black text-[#0b2545] leading-none">
                {resultadosFiltrados.length}
              </p>
            </div>
            <Bus className="text-[#EA2264]" size={24} />
          </div>
        </div>
      </div>

      {/* RESULTADOS */}
      {/* LISTADO DE RESULTADOS - DISEÑO PREMIUM REFINADO */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-10 pb-20 space-y-4">
        {loading ? (
          <>
            <ViajeSkeleton />
            <ViajeSkeleton />
          </>
        ) : resultadosFiltrados.length > 0 ? (
          resultadosFiltrados.map((viaje, i) => (
            <div
              key={i}
              className="bg-white rounded-[1.8rem] p-4 md:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 hover:border-[#EA2264]/30 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0">
                {/* 1. INFO COOPERATIVA (22% del ancho) */}
                <div className="flex items-center gap-4 w-full lg:w-[25%] shrink-0">
                  <div className="w-11 h-11 md:w-14 md:h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden">
                    {viaje.logo ? (
                      <img
                        src={viaje.logo}
                        className="w-full h-full object-contain"
                        alt="Logo"
                      />
                    ) : (
                      <Bus size={22} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-sm md:text-[17px] font-black text-[#0b2545] leading-tight">
                      {viaje.cooperativa}
                    </h3>
                    <span className="text-[10px] font-black text-[#EA2264] mt-0.5 uppercase tracking-tighter">
                      {viaje.tipo}
                    </span>
                  </div>
                </div>

                {/* 2. TIMELINE (40% del ancho) */}
                <div className="flex items-center justify-between gap-3 md:gap-6 w-full lg:w-[45%] lg:px-6 py-3 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-50">
                  {/* Bloque Salida */}
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <span className="text-[9px] font-black text-[#EA2264] uppercase tracking-widest mb-1">
                      Salida
                    </span>
                    <p className="text-xl md:text-2xl font-black text-[#0b2545] tabular-nums">
                      {viaje.salida}
                    </p>
                    {/* Ajustado: line-clamp-2 y min-h para consistencia visual */}
                    <p className="text-[9px] font-black text-gray-600 mt-1 italic text-center line-clamp-2 leading-tight min-h-[22px] w-full px-1">
                      {viaje.origenTerminalNombre}
                    </p>
                  </div>

                  {/* Trayecto */}
                  <div className="flex-[0.6] flex flex-col items-center min-w-[75px]">
                    <span className="text-[11px] font-bold text-gray-500 mb-2 tabular-nums">
                      {viaje.duracion}
                    </span>
                    <div className="w-full h-[3px] bg-gray-100 rounded-full relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#09184D] via-[#EA2264] to-[#09184D] rounded-full" />
                      <div className="absolute -top-[5px] left-0 w-3 h-3 bg-[#09184D] rounded-full border-2 border-white shadow-sm" />
                      <div className="absolute -top-[5px] right-0 w-3 h-3 bg-[#EA2264] rounded-full border-2 border-white shadow-sm" />
                    </div>
                    {/* Lógica de pluralización aplicada aquí */}
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-3 tracking-tighter whitespace-nowrap">
                      {viaje.numParadas === 0
                        ? "Directo"
                        : viaje.numParadas === 1
                        ? "1 parada"
                        : `${viaje.numParadas} paradas`}
                    </p>
                  </div>

                  {/* Bloque Llegada */}
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <span className="text-[9px] font-black text-[#EA2264] uppercase tracking-widest mb-1">
                      Llegada
                    </span>
                    <p className="text-xl md:text-2xl font-black text-[#0b2545] tabular-nums">
                      {viaje.llegada}
                    </p>
                    {/* Ajustado: line-clamp-2 y min-h para consistencia visual */}
                    <p className="text-[9px] font-black text-gray-600 mt-1 italic text-center line-clamp-2 leading-tight min-h-[22px] w-full px-1">
                      {viaje.destinoTerminalNombre}
                    </p>
                  </div>
                </div>

                {/* 3. PRECIO (Independiente - 13% del ancho) */}
                <div className="flex items-center justify-center w-full lg:w-[10%] py-2 lg:py-0">
                  <div className="text-center">
                    <p className="text-2xl md:text-[26px] font-black text-[#0b2545] tracking-tighter leading-none">
                      <span className="text-xs font-bold opacity-30 mr-0.5">
                        $
                      </span>
                      {viaje.precio.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* 4. BOTÓN ITINERARIO (Independiente - 20% del ancho) */}
                <div className="flex items-center justify-center w-full lg:w-[15%] lg:pl-4">
                  <button
                    onClick={() =>
                      verDetalle(
                        viaje.frecuenciaId,
                        viaje.duracion,
                        parseInt(origenIdParam!),
                        parseInt(destinoIdParam!)
                      )
                    }
                    className="w-full bg-[#09184D] hover:bg-[#EA2264] text-white px-5 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.15em] transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Ver Ruta
                    <ChevronRight size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bus size={40} className="text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-[#0b2545]">
              No se encontraron rutas
            </h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">
              Prueba cambiando el punto de origen o el destino final.
            </p>
          </div>
        )}
      </div>

      {/* MODAL ITINERARIO INTELIGENTE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-[#0b2545]/40 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-8 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-500 shadow-2xl relative">
            {/* CABECERA COMPACTA */}
            <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <h3 className="text-2xl font-black text-[#0b2545] leading-none">
                  Itinerario de viaje
                </h3>
                <div className="flex items-center gap-2 mt-2 bg-[#EA2264]/5 px-3 py-1 rounded-full w-fit">
                  <Clock size={12} className="text-[#EA2264]" />
                  <p className="text-[10px] font-black text-[#EA2264] uppercase tracking-wider">
                    Tiempo de viaje aprox: {modalData?.duracion || "..."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalData(null);
                  setItinerario([]);
                }}
                className="bg-gray-100 p-2.5 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONTENIDO DE ITINERARIO */}
            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
              {loadingItinerario ? (
                <div className="space-y-4 px-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-50 rounded-[1.5rem] animate-pulse"
                    />
                  ))}
                </div>
              ) : itinerario.length > 0 && modalData ? (
                <div className="relative ml-2">
                  {/* Línea vertical unificada */}
                  <div className="absolute left-[72px] top-8 bottom-8 w-[2px] bg-gray-100" />

                  {itinerario
                    .filter((p: any) => {
                      if (!modalData) return false;
                      const origenIdx = itinerario.findIndex(
                        (item: any) =>
                          item.terminales?.id === modalData.origenId
                      );
                      const destinoIdx = itinerario.findIndex(
                        (item: any) =>
                          item.terminales?.id === modalData.destinoId
                      );
                      const currentIdx = itinerario.indexOf(p);
                      return (
                        currentIdx >= origenIdx &&
                        currentIdx <= destinoIdx &&
                        origenIdx !== -1
                      );
                    })
                    .map((p: any, idx: number, arrayFiltrado: any[]) => (
                      <div
                        key={idx}
                        className="relative flex items-center gap-6 pb-6 last:pb-2 group"
                      >
                        {/* HORA */}
                        <div className="w-16 text-right shrink-0">
                          <p className="text-lg font-black text-[#0b2545] tabular-nums leading-none">
                            {p.hora_estimada.slice(0, 5)}
                          </p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">
                            {idx === 0
                              ? "Salida"
                              : idx === arrayFiltrado.length - 1
                              ? "Llegada"
                              : "Parada intermedia"}
                          </p>
                        </div>

                        {/* PUNTO INDICADOR */}
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 transition-all ${
                            idx === 0 || idx === arrayFiltrado.length - 1
                              ? "bg-[#EA2264] scale-125"
                              : "bg-gray-300"
                          }`}
                        />

                        {/* TARJETA DE INFORMACIÓN COMPACTA */}
                        <div className="flex-1 bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100 group-hover:bg-white group-hover:border-[#EA2264]/20 transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-black text-[#0b2545] uppercase truncate">
                              {p.terminales?.ciudades?.nombre_ciudad}
                              {p.terminales?.alias_terminal && (
                                <span className="text-[#EA2264] ml-1 font-bold">
                                  ({p.terminales.alias_terminal})
                                </span>
                              )}
                            </h4>
                          </div>
                          <p className="text-[10px] font-medium text-gray-400 truncate mt-0.5">
                            {p.terminales?.nombre_terminal ||
                              "Terminal Terrestre"}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm font-bold uppercase tracking-widest">
                  No disponible
                </div>
              )}
            </div>

            {/* BOTÓN DE CIERRE */}
            <button
              onClick={() => {
                setShowModal(false);
                setModalData(null);
                setItinerario([]);
              }}
              className="mt-6 py-4 bg-[#0b2545] hover:bg-[#EA2264] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* FOOTER SIMPLE */}
      <footer className="bg-[#09184D] py-20 px-6 text-center">
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="text-white font-black text-2xl tracking-tighter">
            Rutas<span className="text-[#EA2264]">Ecuador</span>
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-200/30">
            © 2025 • Conectando el país de punta a punta
          </p>
        </div>
      </footer>
    </div>
  );
}
export default function ResultadosPage() {
  return (
    <Suspense fallback={null}>
      <ResultadosContent />
    </Suspense>
  );
}
