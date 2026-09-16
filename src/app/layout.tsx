import type { Metadata } from "next";
import "./globals.css";
import { HeaderNavbar } from "@/shared/ui/organisms/HeaderNavbar";

export const metadata: Metadata = {
  title: "Sift System | Frontend Job Scout & Autonomous Apply",
  description: "Sistema inteligente de búsqueda, filtrado con IA y postulación automatizada a ofertas de Frontend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        <HeaderNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
