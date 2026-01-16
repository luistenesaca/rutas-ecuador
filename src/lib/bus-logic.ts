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

/**
 * Procesa los datos crudos de Supabase para convertirlos en tarjetas de viaje legibles.
 * Optimizaciones: Manejo de cruce de medianoche, validación de tipos y limpieza de strings.
 */
export function procesarResultados(
  data: any[],
  idOrigen: number,
  idDestino: number
): ViajeProcesado[] {
  if (!data || data.length === 0) return [];

  // 1. Agrupar paradas por frecuencia (fid) de forma eficiente
  const grupos = data.reduce((acc: Record<number, any[]>, curr) => {
    const fid = curr.frecuencia_id;
    if (!acc[fid]) acc[fid] = [];
    acc[fid].push(curr);
    return acc;
  }, {});

  const resultados: ViajeProcesado[] = [];

  for (const fid in grupos) {
    const paradas = grupos[fid];

    // Buscamos las paradas específicas del usuario
    const pOrigen = paradas.find((p) => p.terminal_id === idOrigen);
    const pDestino = paradas.find((p) => p.terminales?.id === idDestino || p.terminal_id === idDestino);

    // FILTRO CRÍTICO: Debe existir origen/destino, el origen debe ser antes que el destino
    // y la parada de origen debe permitir la venta.
    if (
      pOrigen && 
      pDestino && 
      pOrigen.orden < pDestino.orden && 
      pOrigen.permite_venta !== false
    ) {
      
      // --- LÓGICA DE PRECIO (DEBUNKING DE CEROS) ---
      let precioCalc = (pDestino.precio_acumulado || 0) - (pOrigen.precio_acumulado || 0);
      
      // Si el cálculo da 0 o negativo, es un tramo con tarifa base (ej: tramos intermedios)
      if (precioCalc <= 0) {
        precioCalc = pDestino.precio_acumulado || 0;
      }

      // --- CÁLCULO DE DURACIÓN (MANEJO DE CRUCE DE DÍAS) ---
      const [hS, mS] = pOrigen.hora_estimada.split(':').map(Number);
      const [hL, mL] = pDestino.hora_estimada.split(':').map(Number);

      const fechaBase = new Date(2000, 0, 1, hS, mS);
      const fechaFin = new Date(2000, 0, 1, hL, mL);

      // Si el destino tiene un día_relativo mayor, sumamos esos días (24h * n)
      const diffDias = (pDestino.dia_relativo || 0) - (pOrigen.dia_relativo || 0);
      if (diffDias > 0) {
        fechaFin.setDate(fechaFin.getDate() + diffDias);
      } else if (fechaFin < fechaBase) {
        // Corrección automática: si llega "antes" de salir pero no marcaron día_relativo
        fechaFin.setDate(fechaFin.getDate() + 1);
      }

      const diffMs = fechaFin.getTime() - fechaBase.getTime();
      const totalMinutos = Math.floor(diffMs / (1000 * 60));
      const hrs = Math.floor(totalMinutos / 60);
      const mins = totalMinutos % 60;

      // --- CONSTRUCCIÓN DEL OBJETO FINAL ---
      resultados.push({
        frecuenciaId: Number(fid),
        cooperativa: pOrigen.frecuencias?.cooperativas?.nombre_cooperativa || "Cooperativa",
        logo: pOrigen.frecuencias?.cooperativas?.logo_url || null,
        tipo: pOrigen.frecuencias?.tipo_servicio || "Ejecutivo",
        salida: pOrigen.hora_estimada.slice(0, 5),
        llegada: pDestino.hora_estimada.slice(0, 5),
        duracion: `${hrs}h ${mins}m`,
        precio: Number(precioCalc.toFixed(2)),
        numParadas: pDestino.orden - pOrigen.orden - 1,
        origenTerminalNombre: pOrigen.terminales?.nombre_terminal || "Terminal Origen",
        destinoTerminalNombre: pDestino.terminales?.nombre_terminal || "Terminal Destino",
        origenFull: `${pOrigen.terminales?.ciudades?.nombre_ciudad} (${pOrigen.terminales?.alias_terminal || "Matriz"})`,
        destinoFull: `${pDestino.terminales?.ciudades?.nombre_ciudad} (${pDestino.terminales?.alias_terminal || "Matriz"})`,
      });
    }
  }

  // Ordenamos por hora de salida (00:00 -> 23:59)
  return resultados.sort((a, b) => a.salida.localeCompare(b.salida));
}