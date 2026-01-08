import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google"; // Eliminamos Geist_Mono si no usas fuentes de código
import "./globals.css";

// Optimizamos la carga de la fuente principal
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Mejora el rendimiento de carga visual
});

// Configuramos el Viewport por separado (Requerido en versiones recientes de Next.js)
export const viewport: Viewport = {
  themeColor: "#09184D", // Color de la barra de direcciones en móviles
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Rutas Ecuador | Horarios de Buses y Frecuencias",
    template: "%s | Rutas Ecuador" // Permite que otras páginas cambien el título automáticamente
  },
  description: "La plataforma central de transporte en Ecuador. Consulta horarios, rutas y cooperativas en tiempo real.",
  keywords: ["buses ecuador", "horarios de buses", "terminal terrestre", "transporte ecuador"],
  authors: [{ name: "Rutas Ecuador" }],
  manifest: "/manifest.json", // Opcional por si quieres que sea PWA luego
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth"> {/* Scroll suave para mejor UX */}
      <body
        className={`${geistSans.variable} font-sans antialiased bg-white text-[#09184D]`}
      >
        {/* Aquí puedes envolver con proveedores globales si los necesitas en el futuro */}
        {children}
      </body>
    </html>
  );
}