import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-4 px-6">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="text-muted">O endereço não corresponde a nenhuma tela do Forms.</p>
      <Link href="/dashboard" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
        Voltar ao início
      </Link>
    </main>
  );
}
