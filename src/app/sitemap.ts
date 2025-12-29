import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Aquí deberías traer todas las combinaciones de rutas de tu BD
  // Por ahora, un ejemplo estático que podrías automatizar:
  const rutasPopulares = [
    { origen: 'quito', destino: 'guayaquil' },
    { origen: 'cuenca', destino: 'loja' },
  ];

  const rutasEntries = rutasPopulares.map((ruta) => ({
    url: `https://rutasecuador.com/resultados?origen=${ruta.origen}&destino=${ruta.destino}`,
    lastModified: new Date(),
    priority: 0.8,
  }));

  return [
    {
      url: 'https://rutasecuador.com',
      lastModified: new Date(),
      priority: 1,
    },
    ...rutasEntries,
  ];
}