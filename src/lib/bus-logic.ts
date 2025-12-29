export interface ViajeProcesado {
  frecuenciaId: number;
  cooperativa: string;
  logo: string | null;
  tipo: string;
  salida: string;
  llegada: string;
  duracion: string;
  precio: number;
  numParadas: number;
  origenFull: string;
  destinoFull: string;
  origenTerminalNombre: string;
  destinoTerminalNombre: string;
}
export function procesarResultados(
  data: any[],
  idOrigen: number,
  idDestino: number
): ViajeProcesado[] {
  
  const grupos = data.reduce((acc: any, curr: any) => {
    const fid = curr.frecuencia_id;
    if (!acc[fid]) acc[fid] = [];
    acc[fid].push(curr);
    return acc;
  }, {});

  const resultados: ViajeProcesado[] = [];

  for (const fid in grupos) {
    const paradas = grupos[fid];

    const paradaOrigen = paradas.find((p: any) => p.terminal_id === idOrigen);
    const paradaDestino = paradas.find(
      (p: any) => p.terminales?.id === idDestino || p.terminal_id === idDestino
    );

    if (
      paradaOrigen &&
      paradaDestino &&
      paradaOrigen.orden < paradaDestino.orden &&
      paradaOrigen.permite_venta !== false
    ) {

      // --- LÓGICA DE PRECIO SIN REDONDEOS ---
      
      // Calculamos la diferencia exacta (pueden ser decimales como 14.65)
      let precioCalculado = paradaDestino.precio_acumulado - paradaOrigen.precio_acumulado;

      /**
       * Si el resultado es 0 (o menor), aplicamos la lógica de "Tarifa de Parada".
       * Ejemplo: Loja (0) -> Catamayo (14.65) -> Guayaquil (14.65).
       * Si el usuario va de Catamayo a Guayaquil, 14.65 - 14.65 = 0.
       * En ese caso, tomamos el valor acumulado del destino para que el precio sea 14.65.
       */
      if (precioCalculado <= 0) {
        precioCalculado = paradaDestino.precio_acumulado;
      }

      const precioFinal = Number(precioCalculado.toFixed(2));

      // --- CÁLCULO DE DURACIÓN ---
      const horaInicio = new Date(`2000-01-01T${paradaOrigen.hora_estimada}`);
      const horaFin = new Date(`2000-01-01T${paradaDestino.hora_estimada}`);

      if (paradaDestino.dia_relativo > paradaOrigen.dia_relativo) {
        horaFin.setDate(
          horaFin.getDate() +
            (paradaDestino.dia_relativo - paradaOrigen.dia_relativo)
        );
      }

      const diffMs = horaFin.getTime() - horaInicio.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      const numParadas = paradaDestino.orden - paradaOrigen.orden - 1;

      resultados.push({
        frecuenciaId: parseInt(fid),
        cooperativa:
          paradaOrigen.frecuencias?.cooperativas?.nombre_cooperativa ||
          "Cooperativa",
        logo: paradaOrigen.frecuencias?.cooperativas?.logo_url || null,
        tipo: paradaOrigen.frecuencias?.tipo_servicio || "Ejecutivo",
        salida: paradaOrigen.hora_estimada.slice(0, 5),
        llegada: paradaDestino.hora_estimada.slice(0, 5),
        duracion: `${diffHrs}h ${diffMins}m`,
        precio: precioFinal,
        numParadas: numParadas,
        origenTerminalNombre:
          paradaOrigen.terminales?.nombre_terminal || "Terminal de Origen",
        destinoTerminalNombre:
          paradaDestino.terminales?.nombre_terminal || "Terminal de Destino",
        origenFull: `${paradaOrigen.terminales?.ciudades?.nombre_ciudad} (${
          paradaOrigen.terminales?.alias_terminal || ""
        })`,
        destinoFull: `${paradaDestino.terminales?.ciudades?.nombre_ciudad} (${
          paradaDestino.terminales?.alias_terminal || ""
        })`,
      });
    }
  }

  // Ordenar resultados por hora de salida para la mejor experiencia de usuario
  return resultados.sort((a, b) => a.salida.localeCompare(b.salida));
}