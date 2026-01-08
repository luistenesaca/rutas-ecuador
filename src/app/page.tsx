"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocationSelector } from "@/components/LocationSelector";
import {
  ArrowLeftRight,
  ArrowUpDown,
  Search,
  Loader2,
  MapPin,
  Globe,
  ShieldCheck,
  Zap,
  Menu,
  X,
  Bus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [puntos, setPuntos] = useState<any[]>([]);
  const [loadingPuntos, setLoadingPuntos] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estados del buscador
  const [queryOrigen, setQueryOrigen] = useState("");
  const [idOrigen, setIdOrigen] = useState<number | null>(null);
  const [showOrigen, setShowOrigen] = useState(false);
  const [queryDestino, setQueryDestino] = useState("");
  const [idDestino, setIdDestino] = useState<number | null>(null);
  const [showDestino, setShowDestino] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const loadPuntos = async () => {
      const { data } = await supabase
        .from("terminales")
        .select(`id, nombre_terminal, alias_terminal, ciudades(nombre_ciudad)`);
      if (data) {
        setPuntos(
          data.map((t: any) => ({
            id: t.id,
            alias: t.alias_terminal,
            ciudad: t.ciudades?.nombre_ciudad || "",
            nombreReal: t.nombre_terminal,
          }))
        );
      }
      setLoadingPuntos(false);
    };
    loadPuntos();
  }, []);

  const handleInterchange = () => {
    const tempId = idOrigen;
    const tempQuery = queryOrigen;
    setIdOrigen(idDestino);
    setQueryOrigen(queryDestino);
    setIdDestino(tempId);
    setQueryDestino(tempQuery);
  };

  const handleSearch = () => {
    if (!idOrigen || !idDestino) return;
    setLoadingSearch(true);
    router.push(`/resultados?origen=${idOrigen}&destino=${idDestino}`);
  };

  const handleDestinoClick = (destinoId: number, destinoNombre: string) => {
    setIdDestino(destinoId);
    setQueryDestino(destinoNombre);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loadingPuntos) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#EA2264]" size={40} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#09184D]">
            Sincronizando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-[#EA2264]/20 overflow-x-hidden">
      {/* HEADER PRINCIPAL */}
      <header className="fixed top-0 left-0 right-0 bg-white z-[200] border-b border-gray-100 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between bg-white relative z-[210]">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-[#EA2264] p-3 rounded-2xl shadow-lg">
              <Bus className="text-white" size={28} />
            </div>
            <div className="text-left">
              <h1 className="text-black font-black text-2xl tracking-tighter leading-none">
                Rutas<span className="text-[#EA2264]">Ecuador</span>
              </h1>
              <p className="text-gray-700 text-[9px] font-black uppercase tracking-[0.3em] opacity-60">
                Viaja con confianza
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-10">
            {["Inicio", "Destinos", "Cooperativas", "Ayuda"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-black uppercase tracking-widest text-gray-800 hover:text-[#EA2264]">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-[#09184D]">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* MENÚ MÓVIL DESPLEGABLE (Debajo del header) */}
        <div
          className={`absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-2xl lg:hidden transition-all duration-300 ease-in-out z-[190] ${
            isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none"
          }`}
        >
          <div className="p-8 space-y-6">
            <nav className="flex flex-col gap-4">
              {["Inicio", "Destinos", "Cooperativas", "Ayuda"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl font-black text-[#09184D] tracking-tighter flex justify-between items-center"
                >
                  {item} <span className="text-[#EA2264]">→</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

    
      

      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative bg-[#09184D] pt-24 pb-40 md:pt-32 md:pb-56 px-6 overflow-x-clip">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute top-[10%] left-[15%] w-2 h-2 bg-[#EA2264] rounded-full animate-pulse blur-[1px]" />
            <div className="absolute top-[40%] left-[80%] w-3 h-3 bg-blue-400 rounded-full animate-bounce blur-[2px] delay-700" />
            <div className="absolute top-[70%] left-[30%] w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-500" />
          </div>

          <div className="max-w-5xl mx-auto relative z-30">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-white text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight">
                Viaja por todo <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA2264] to-orange-400">
                  Ecuador
                </span>
              </h2>
              <p className="text-blue-200/50 text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] max-w-xl mx-auto">
                Tu conexión directa con cada destino
              </p>
            </div>

            {/* BUSCADOR */}
            <div className="bg-white p-3 md:p-3 rounded-[2.5rem] md:rounded-full shadow-[0_30px_100px_rgba(0,0,0,0.4)] relative">
              <div className="flex flex-col md:flex-row items-center gap-2 relative">
                
                {/* Contenedor de Selectores */}
                <div className="flex flex-col md:flex-row flex-1 w-full relative gap-1 md:gap-0">
                  
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

                  {/* BOTÓN INTERCAMBIO MÓVIL (Centro derecho entre inputs) */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 md:hidden">
                    <button
                      onClick={handleInterchange}
                      className="bg-gray-50 text-[#09184D] p-2.5 rounded-full shadow-md border border-gray-100 active:scale-90 active:bg-white transition-all"
                      aria-label="Intercambiar origen y destino"
                    >
                      <ArrowUpDown size={18} strokeWidth={2.5} className="text-[#EA2264]" />
                    </button>
                  </div>

                  {/* BOTÓN INTERCAMBIO DESKTOP (Centro absoluto) */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
                    <button
                      onClick={handleInterchange}
                      className="bg-white text-[#09184D] p-3.5 rounded-full shadow-xl hover:text-[#EA2264] transition-all active:rotate-180 duration-500 border border-gray-50"
                    >
                      <ArrowLeftRight size={20} strokeWidth={3} />
                    </button>
                  </div>

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

                <button
                  onClick={handleSearch}
                  disabled={loadingSearch || !idOrigen || !idDestino}
                  className="w-full md:w-auto bg-[#EA2264] hover:bg-[#0b2545] text-white h-16 md:h-20 md:px-14 rounded-[2rem] md:rounded-full font-black uppercase text-sm tracking-widest transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  {loadingSearch ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <Search size={24} strokeWidth={3} />
                  )}
                  <span>Buscar</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* INFO BAR */}
        <section className="max-w-5xl mx-auto -mt-12 relative z-20 px-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 border border-gray-50">
            {[
              {
                icon: Globe,
                title: "Cobertura Nacional",
                desc: "Más de 500 terminales.",
              },
              {
                icon: ShieldCheck,
                title: "Datos Oficiales",
                desc: "Cooperativas verificadas.",
              },
              {
                icon: Zap,
                title: "Búsqueda Instantánea",
                desc: "Horarios al segundo.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#EA2264]">
                  <item.icon size={24} strokeWidth={2.5} />
                </div>
                <h4 className="font-black text-[#09184D] text-sm uppercase tracking-tighter">
                  {item.title}
                </h4>
                <p className="text-gray-400 text-xs font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DESTINOS */}
        <section id="destinos" className="max-w-7xl mx-auto px-6 py-32">
          <div className="mb-16 text-center md:text-left">
            <span className="text-[#EA2264] font-black text-[10px] uppercase tracking-[0.3em] mb-4 block">
              Explora el País
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-[#09184D] tracking-tighter">
              Destinos que inspiran
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto md:mx-0 text-sm">
              Desde playas vibrantes hasta valles eternos y selva profunda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[350px] md:auto-rows-[450px]">
            {/* Quito - Grande */}
            <div
              className="md:col-span-7 lg:col-span-8 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(1, "Quito")}
            >
              <img
                src="https://www.pcma.org/wp-content/uploads/2024/09/Quito-Ecuador.jpg"
                alt="Quito"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Quito
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Capital eterna, Patrimonio UNESCO.
                </p>
              </div>
            </div>

            <div
              className="md:col-span-4 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(95, "Tulcán")} // Ajusta el ID real de terminal principal de Tulcán
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/tulcann.jpeg"
                alt="Cementerio de Tulcán"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Tulcán
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Arte topiario único en su cementerio.
                </p>
              </div>
            </div>

            {/* Salinas */}
            <div
              className="md:col-span-6 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(25, "Salinas")} // Ajusta ID
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/salinas.jpeg"
                alt="Salinas"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Salinas
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  El balneario más exclusivo del Pacífico.
                </p>
              </div>
            </div>

            {/* Vilcabamba */}
            <div
              className="md:col-span-6 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(39, "Vilcabamba")} // Ajusta ID
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/vilcabamba.jpg"
                alt="Vilcabamba"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Vilcabamba
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Valle de la longevidad y paz eterna.
                </p>
              </div>
            </div>

            {/* Riobamba */}
            <div
              className="md:col-span-5 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(45, "Riobamba")} // Ajusta ID
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/chimborazo.jpeg"
                alt="Volcán Chimborazo"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Riobamba
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Sultana de los Andes y puerta al Chimborazo.
                </p>
              </div>
            </div>

            {/* Baños de Agua Santa */}
            <div
              className="md:col-span-7 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(40, "Baños")}
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/banos.jpg"
                alt="Baños"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Baños
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Aventura, cascadas y termas.
                </p>
              </div>
            </div>

            {/* Cuenca */}
            <div
              className="md:col-span-6 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(5, "Cuenca")}
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/cuenca.jpeg"
                alt="Cuenca"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Cuenca
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Joyas coloniales y artesanía.
                </p>
              </div>
            </div>

            {/* Zaruma */}
            <div
              className="md:col-span-6 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(16, "Zaruma")} // Ajusta ID
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/zaruma.jpeg"
                alt="Zaruma"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Zaruma
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Pueblo minero y colonial encantador.
                </p>
              </div>
            </div>

            {/* Guayaquil */}
            <div
              className="md:col-span-8 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(10, "Guayaquil")}
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/guayaquil.jpeg"
                alt="Guayaquil"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Guayaquil
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Perla del Pacífico moderna.
                </p>
              </div>
            </div>

            {/* El Coca */}
            <div
              className="md:col-span-4 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(80, "El Coca")} // Ajusta ID
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/coca.jpg"
                alt="El coca"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  El Coca
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Puerta a la Amazonía.
                </p>
              </div>
            </div>
            <div
              className="md:col-span-5 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(100, "Huaquillas")} // Ajusta el ID real de terminal principal de Huaquillas
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/huaquillas.jpg"
                alt="Huaquillas frontera Ecuador-Perú"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Huaquillas
                </h3>
                <p className="text-blue-100/70 text-xs font-medium">
                  Puerta sur al comercio y playas.
                </p>
              </div>
            </div>
            <div
              className="md:col-span-7 group relative overflow-hidden rounded-[2.5rem] cursor-pointer"
              onClick={() => handleDestinoClick(6, "Manta")} // Ajusta ID
            >
              <img
                src="https://vwnelggbaclltqletxbe.supabase.co/storage/v1/object/public/fotos_destinos/manta.jpg"
                alt="Manta"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09184D]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-white text-4xl font-black tracking-tighter mb-2">
                  Manta
                </h3>

                <p className="text-blue-100/70 text-xs font-medium">
                  Puerto vibrante y playas infinitas.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#09184D] py-20 px-6 text-center">
        <h2 className="text-white font-black text-2xl tracking-tighter">
          Rutas<span className="text-[#EA2264]">Ecuador</span>
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-200/30 mt-4">
          © 2025 • Conectando el país
        </p>
      </footer>
    </div>
  );
}
