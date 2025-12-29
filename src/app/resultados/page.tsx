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

// Forzamos que la página sea siempre dinámica
export const dynamic = 'force-dynamic';

// --- SUB-COMPONENTE CON LA LÓGICA (ResultadosContent) ---
function ResultadosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const origenIdParam = searchParams.get("origen");
  const destinoIdParam = searchParams.get("destino");

  // --- TODOS TUS ESTADOS ---
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

  // --- TUS USE EFFECTS (Igual que los tenías) ---
  useEffect(() => {
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

  // --- TUS FUNCIONES (verDetalle, handleNewSearch, etc.) ---
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

  // --- AQUÍ VA TODO TU JSX (El return que ya tenías) ---
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ... Pega aquí todo el contenido del return original desde el <header> hasta el final ... */}
      {/* (Mantengo el resto igual, solo movido a esta función) */}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL (La envoltura segura para Vercel) ---
export default function ResultadosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09184D] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#EA2264] p-4 rounded-3xl animate-bounce mb-6">
          <Bus className="text-white" size={40} />
        </div>
        <h2 className="text-white font-black text-2xl uppercase tracking-tighter">Buscando Rutas</h2>
        <p className="text-blue-300 text-xs font-bold mt-2 animate-pulse">Consultando horarios actualizados...</p>
      </div>
    }>
      <ResultadosContent />
    </Suspense>
  );
}