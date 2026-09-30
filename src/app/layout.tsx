import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Forms Jabatec",
    template: "%s · Forms Jabatec",
  },
  description: "Criação e respostas de formulários internos da Jabatec.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
        >
          Ir para o conteúdo
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
