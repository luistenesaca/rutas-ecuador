import React, { useMemo, useEffect, useRef } from "react";
import { MapPin, MapPinned } from "lucide-react";

type Punto = {
  id: number;
  ciudad: string;
  alias?: string;
  nombreReal?: string;
};

type LocationSelectorProps = {
  type: "origen" | "destino";
  query: string;
  setQuery: (value: string) => void;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  otherId: number | null;
  puntos: Punto[];
};

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  type,
  query,
  setQuery,
  selectedId,
  setSelectedId,
  showSuggestions,
  setShowSuggestions,
  otherId,
  puntos,
}) => {
  const isOrigen = type === "origen";
  const Icon = isOrigen ? MapPin : MapPinned;
  const label = isOrigen ? "Origen" : "Destino";
  const placeholder = isOrigen ? "¿Desde dónde viajas?" : "¿A qué ciudad vas?";

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si el dropdown no está visible, no añadimos el evento
    if (!showSuggestions) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      // Si el clic NO está dentro del contenedor (input + dropdown), cerramos
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    // Escuchamos mousedown (PC) y touchstart (Móviles)
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    // Limpieza al desmontar o cerrar
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showSuggestions, setShowSuggestions]);

  // Función para resetear y activar
  const handleInputActivation = () => {
    setQuery("");
    setSelectedId(null);
    setShowSuggestions(true);
  };

  const getInputValue = () => {
    if (selectedId) {
      const p = puntos.find((p) => p.id === selectedId);
      if (p) return p.alias ? `${p.ciudad} (${p.alias})` : p.ciudad;
    }
    return query;
  };

  // Lógica de Sugerencias
  const { suggestions, isPopular } = useMemo(() => {
    // Si NO hay búsqueda (query vacío), mostrar ciudades populares
    if (query.length === 0) {
      const populares = ["Guayaquil", "Quito", "Cuenca", "Manta", "Ambato"];
      const filtrados = puntos.filter(
        (p) => populares.includes(p.ciudad) && p.id !== otherId
      );

      const grupos = filtrados.reduce((acc, curr) => {
        if (!acc[curr.ciudad]) acc[curr.ciudad] = [];
        acc[curr.ciudad].push(curr);
        return acc;
      }, {} as Record<string, Punto[]>);

      return { suggestions: Object.entries(grupos), isPopular: true };
    }

    // Si HAY búsqueda (query > 0), mostrar resultados filtrados
    const filtrados = puntos.filter((p) => {
      const coincide =
        p.ciudad.toLowerCase().includes(query.toLowerCase()) ||
        p.alias?.toLowerCase().includes(query.toLowerCase());
      return coincide && p.id !== otherId;
    });

    const grupos = filtrados.reduce((acc, curr) => {
      if (!acc[curr.ciudad]) acc[curr.ciudad] = [];
      acc[curr.ciudad].push(curr);
      return acc;
    }, {} as Record<string, Punto[]>);

    return { suggestions: Object.entries(grupos), isPopular: false };
  }, [query, otherId, puntos]);

  const handleSelect = (p: Punto) => {
    setSelectedId(p.id);
    setQuery(p.alias ? `${p.ciudad} (${p.alias})` : p.ciudad);
    setShowSuggestions(false);
  };

  return (
    <div
      className={`relative flex-1 ${showSuggestions ? "z-[100]" : "z-10"}`}
      ref={containerRef}
    >
      {" "}
      {/* Input principal */}
      <div
        className="flex items-center gap-3 p-2 md:px-8 hover:bg-gray-50 rounded-[2rem] md:rounded-full transition-colors cursor-text"
        onClick={handleInputActivation}
      >
        <Icon className="text-[#EA2264] shrink-0" size={20} />
        <div className="w-full text-left">
          <p className="text-[9px] font-black text-[#0b2545] uppercase tracking-widest opacity-60">
            {label}
          </p>
          <input
            type="text"
            placeholder={placeholder}
            className="bg-transparent w-full outline-none font-bold text-base md:text-lg text-[#0b2545] placeholder-gray-400"
            value={getInputValue()}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={handleInputActivation}
          />
        </div>
      </div>
      {/* Dropdown con Sugerencias Populares */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-3 z-50 md:left-4 md:right-auto md:w-96 dropdown-suggestions">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Cabecera dinámica */}
            <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-black text-[10px] text-blue-600 uppercase tracking-[0.15em]">
                {isPopular ? "Destinos Populares" : "Resultados de búsqueda"}
              </span>
              {isPopular && (
                <span className="text-[10px] text-gray-400 font-bold italic">
                  Frecuentes
                </span>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto no-scrollbar divide-y divide-gray-50">
              {suggestions.length > 0 ? (
                suggestions.map(([ciudad, terminales]) => (
                  <div key={ciudad} className="group/ciudad">
                    <div className="bg-gray-50/30 px-5 py-1.5 flex items-center gap-2">
                      <MapPin size={10} className="text-gray-400" />
                      <span className="font-bold text-[11px] text-gray-500 uppercase">
                        {ciudad}
                      </span>
                    </div>
                    {terminales.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(p);
                        }}
                        className="w-full text-left p-4 pl-10 hover:bg-red-50/50 transition-all flex flex-col cursor-pointer group"
                      >
                        {/* Lógica de nombre: Ciudad + Alias o solo Ciudad */}
                        <span className="font-bold text-sm text-[#0b2545] group-hover:text-[#EA2264] transition-colors">
                          {p.alias ? `${p.ciudad} (${p.alias})` : p.ciudad}
                        </span>

                        {/* Subtexto: Nombre real del terminal */}
                        <p className="text-[10px] font-medium text-gray-400 line-clamp-1 italic mt-0.5">
                          {p.nombreReal || "Terminal Terrestre"}
                        </p>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                    No se encontraron terminales
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50/50 py-2 text-center border-t border-gray-50">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {isOrigen
                  ? "Selecciona tu punto de partida"
                  : "Terminales disponibles para tu viaje"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
