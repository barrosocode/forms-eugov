"use client";

import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/text";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Início", permission: null },
  { href: "/forms", label: "Formulários", permission: "forms:list" },
  { href: "/users", label: "Usuários", permission: "users:list" },
  { href: "/roles", label: "Papéis", permission: "roles:list" },
  { href: "/profile", label: "Perfil", permission: null },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const permissions = session?.user?.permissions;
  const name = session?.user?.name ?? "Conta";

  const items = NAV.filter((item) => item.permission === null || hasPermission(permissions, item.permission));

  return (
    <div className="min-h-screen bg-background">
      {open ? (
        <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setOpenPath(null)} />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-6 py-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sidebar-muted">Jabatec</p>
          <p className="mt-1 text-lg font-semibold">Forms</p>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Principal">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive(pathname, item.href) ? "bg-white/10 text-white" : "text-sidebar-muted hover:bg-white/5 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg border border-border px-3 py-2 text-sm lg:hidden" onClick={() => setOpenPath(pathname)}>
            Menu
          </button>
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-sm font-medium">{loading ? "Carregando..." : name}</p>
          </div>
          <button type="button" onClick={() => void logout()} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-foreground">
            Sair
          </button>
        </header>
        <main id="conteudo" className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
