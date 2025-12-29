"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

export const dynamic = 'force-dynamic';

// Skeleton para carga
const ViajeSkeleton = () => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 animate-pulse mb-6">
    <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
  </div>
);

function ResultadosContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const origenIdParam = searchParams.get("origen");
  const destinoIdParam = searchParams.get("destino");

  // Estados
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
  const [idOrigen, setIdOrigen] = useState<number | null>(origenIdParam ? parseInt(origenIdParam) : null);
  const [showOrigen, setShowOrigen] = useState(false);
  const [queryDestino, setQueryDestino] = useState("");
  const [idDestino, setIdDestino] = useState<number | null>(destinoIdParam ? parseInt(destinoIdParam) : null);
  const [showDestino, setShowDestino] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [modalData, setModalData] = useState<{ duracion: string; origenId: number; destinoId: number; } | null>(null);

  useEffect(() => {
    setMounted(true);
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
        if (origenIdParam) {
          const o = puntosData.find((p) => p.id === parseInt(origenIdParam));
          if (o) { setQueryOrigen(o.alias ? `${o.ciudad} (${o.alias})` : o.ciudad); setIdOrigen(o.id); }
        }
        if (destinoIdParam) {
          const d = puntosData.find((p) => p.id === parseInt(destinoIdParam));
          if (d) { setQueryDestino(d.alias ? `${d.ciudad} (${d.alias})` : d.ciudad); setIdDestino(d.id); }
        }
      }
    };
    loadPuntos();
  }, [origenIdParam, destinoIdParam]);

  useEffect(() => {
    const cargarResultados = async () => {
      if (!origenIdParam || !destinoIdParam) return;
      setLoading(true);
      const { data } = await supabase
        .from("paradas_frecuencia")
        .select(`
          frecuencia_id, orden, precio_acumulado, hora_estimada, dia_relativo, terminal_id, permite_venta,
          frecuencias ( tipo_servicio, cooperativas ( nombre_cooperativa, logo_url ) ),
          terminales ( id, nombre_terminal, alias_terminal, ciudades ( nombre_ciudad ) )
        `)
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
          const pOrigen = paradasDeRuta.find((p: any) => p.terminal_id === parseInt(origenIdParam));
          if (pOrigen && pOrigen.permite_venta !== false) datosValidos.push(...paradasDeRuta);
        });
        setResultados(procesarResultados(datosValidos, parseInt(origenIdParam), parseInt(destinoIdParam)));
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

  const verDetalle = async (fid: number, duracion: string, origenId: number, destinoId: number) => {
    setLoadingItinerario(true);
    setShowModal(true);
    setModalData({ duracion, origenId, destinoId });
    const { data } = await supabase
      .from("paradas_frecuencia")
      .select(`orden, hora_estimada, permite_venta, terminales ( id, nombre_terminal, alias_terminal, ciudades ( nombre_ciudad ) )`)
      .eq("frecuencia_id", fid)
      .order("orden", { ascending: true });
    if (data) setItinerario(data);
    setLoadingItinerario(false);
  };

  const resultadosFiltrados = resultados
    .filter((v) => (filtroCooperativa === "todas" || v.cooperativa === filtroCooperativa) && (!soloDirectos || v.numParadas === 0))
    .sort((a, b) => {
      if (ordenPrecio === "menor-mayor") return a.precio - b.precio;
      if (ordenPrecio === "mayor-menor") return b.precio - a.precio;
      return 0;
    });

  const cooperativasDisponibles = Array.from(new Set(resultados.map((v) => v.cooperativa)));

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* HEADER BUSCADOR INTEGRADO */}
      <header className="bg-[#09184D] pt-6 pb-20 px-4 md:px-6 shadow-2xl relative">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <button onClick={() => router.push("/")} className="group flex items-center gap-4 transition-all cursor-pointer">
              <div className="bg-[#EA2264] p-3 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                <Bus className="text-white" size={28} />
              </div>
              <h1 className="text-white font-black text-2xl tracking-tighter">Rutas<span className="text-[#EA2264]">Ecuador</span></h1>
            </button>
            <div className="hidden md:flex items-center gap-2 text-blue-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
              <Navigation size={12} /> Resultados de búsqueda
            </div>
          </div>

          <div className="bg-white p-3 md:p-2 rounded-[2rem] md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 relative">
              <div className="px-4">
                <LocationSelector type="origen" query={queryOrigen} setQuery={setQueryOrigen} selectedId={idOrigen} setSelectedId={setIdOrigen} showSuggestions={showOrigen} setShowSuggestions={setShowOrigen} otherId={idDestino} puntos={puntos} />
              </div>
              <div className="px-4 border-t md:border-t-0 md:border-l border-gray-100">
                <LocationSelector type="destino" query={queryDestino} setQuery={setQueryDestino} selectedId={idDestino} setSelectedId={setIdDestino} showSuggestions={showDestino} setShowSuggestions={setShowDestino} otherId={idOrigen} puntos={puntos} />
              </div>
            </div>
            <button onClick={handleNewSearch} disabled={loadingSearch || !idOrigen || !idDestino} className="w-full md:w-auto bg-[#EA2264] text-white px-8 py-4 rounded-full font-black uppercase text-xs transition-all flex items-center justify-center gap-2">
              {loadingSearch ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search size={18} />}
              <span>Consultar</span>
            </button>
          </div>
        </div>
      </header>

      {/* RESULTADOS */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-10 pb-20 space-y-4">
        {loading ? <ViajeSkeleton /> : resultadosFiltrados.map((viaje, i) => (
          <div key={i} className="bg-white rounded-[1.8rem] p-5 shadow-sm border border-gray-100 hover:border-[#EA2264]/30 transition-all flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-[25%]">
              <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                {viaje.logo ? <img src={viaje.logo} className="w-full h-full object-contain" alt="Logo" /> : <Bus size={22} className="text-gray-300" />}
              </div>
              <div>
                <h3 className="text-[17px] font-black text-[#0b2545]">{viaje.cooperativa}</h3>
                <span className="text-[10px] font-black text-[#EA2264] uppercase">{viaje.tipo}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 w-full lg:w-[45%] lg:border-x border-gray-50 px-6">
              <div className="text-center">
                <span className="text-[9px] font-black text-[#EA2264] uppercase">Salida</span>
                <p className="text-2xl font-black text-[#0b2545]">{viaje.salida}</p>
                <p className="text-[9px] font-bold text-gray-500">{viaje.origenTerminalNombre}</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[11px] font-bold text-gray-400 mb-1">{viaje.duracion}</span>
                <div className="w-full h-[2px] bg-gray-100 relative"><div className="absolute inset-0 bg-[#EA2264] rounded-full" /></div>
              </div>
              <div className="text-center">
                <span className="text-[9px] font-black text-[#EA2264] uppercase">Llegada</span>
                <p className="text-2xl font-black text-[#0b2545]">{viaje.llegada}</p>
                <p className="text-[9px] font-bold text-gray-500">{viaje.destinoTerminalNombre}</p>
              </div>
            </div>

            <div className="text-center w-full lg:w-[10%]">
              <p className="text-2xl font-black text-[#0b2545]">${viaje.precio.toFixed(2)}</p>
            </div>

            <button onClick={() => verDetalle(viaje.frecuenciaId, viaje.duracion, parseInt(origenIdParam!), parseInt(destinoIdParam!))} className="w-full lg:w-[15%] bg-[#09184D] text-white py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#EA2264] transition-all">
              Ver Ruta
            </button>
          </div>
        ))}
      </div>
      
      {/* MODAL ITINERARIO (Simplificado para el ejemplo) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-red-500"><X /></button>
            <h3 className="text-2xl font-black text-[#0b2545] mb-6">Detalle de paradas</h3>
            <div className="space-y-4">
              {itinerario.map((p, idx) => (
                <div key={idx} className="flex gap-4 items-start border-l-2 border-gray-100 pl-4 relative">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-[#EA2264]"></div>
                  <div>
                    <p className="text-sm font-black text-[#0b2545] uppercase">{p.terminales?.ciudades?.nombre_ciudad}</p>
                    <p className="text-xs text-gray-400 font-bold">{p.hora_estimada.slice(0,5)} - {p.terminales?.nombre_terminal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09184D] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#EA2264] p-4 rounded-3xl animate-bounce mb-6">
          <Bus className="text-white" size={40} />
        </div>
        <h2 className="text-white font-black text-2xl uppercase tracking-tighter">Cargando Resultados</h2>
      </div>
    }>
      <ResultadosContent />
    </Suspense>
  );
}