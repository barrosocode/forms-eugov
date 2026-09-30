import { FillForm } from "@/components/forms/fill-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Responder" };

export default async function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[#0a2342]/15 bg-[#fbf7ec]">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-8">
          <p className="text-2xl font-semibold tracking-tight [font-family:var(--font-public-display),sans-serif]" aria-label="EuGoV">
            Eu<span className="text-[#0fa8a0]">G</span>oV
          </p>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
        <FillForm formId={id} />
      </main>
      <footer className="bg-[#0a2342] text-[#f4eddf]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-8">
          <div className="flex flex-col gap-4 border-b border-[#f4eddf]/20 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight [font-family:var(--font-public-display),sans-serif]" aria-label="EuGoV">
                Eu<span className="text-[#0fa8a0]">G</span>oV
              </p>
              <p className="mt-1 text-sm text-[#f4eddf]/80">Inteligência para a gestão pública</p>
            </div>
            <p>
              <span className="block text-[0.62rem] font-bold tracking-[0.24em] uppercase text-[#f4eddf]/60">Tecnologia</span>
              <strong className="text-lg">Jabatec</strong>
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-[#f4eddf]/80 sm:flex-row sm:items-center sm:justify-between">
            <p>Inovação com propósito público.</p>
            <p>EuGoV · 2026 · Brasil</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
