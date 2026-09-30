import { SignInForm } from "@/components/auth/signin-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sidebar-muted">Jabatec</p>
          <p className="mt-1 text-2xl font-semibold">Forms</p>
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">Formulários internos, com a mesma clareza de uma pesquisa bem feita.</h1>
          <p className="text-sidebar-muted">Monte seções, perguntas e respostas para o time. O acesso é individual e não há cadastro público.</p>
        </div>
        <p className="text-sm text-sidebar-muted">Uso interno.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 lg:hidden">
            <p className="text-sm font-medium text-brand">Forms Jabatec</p>
            <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
          </div>
          <div className="hidden space-y-2 lg:block">
            <h2 className="text-3xl font-semibold tracking-tight">Entrar</h2>
            <p className="text-sm text-muted">Use o e-mail e a senha fornecidos pelo administrador.</p>
          </div>
          <Suspense fallback={<p className="text-sm text-muted">Carregando...</p>}>
            <SignInForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
