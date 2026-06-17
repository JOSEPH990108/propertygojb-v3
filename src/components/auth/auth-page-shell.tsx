import type { ReactNode } from "react";

import { ShieldCheck, Sparkles } from "lucide-react";

type AuthPageShellProps = {
  children: ReactNode;
};

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_82%,rgba(37,99,235,0.22),transparent_30%),radial-gradient(circle_at_18%_12%,rgba(147,197,253,0.22),transparent_28%)]" />
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[36rem] opacity-50 lg:block">
        <div className="absolute right-10 top-16 h-28 w-28 rounded-full border border-blue-200" />
        <div className="absolute right-20 top-24 h-56 w-56 rounded-full border border-blue-100" />
        <div className="absolute bottom-[-7rem] right-[-5rem] h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden min-h-screen flex-col justify-between px-10 py-12 lg:flex xl:px-14">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30">
              <Sparkles className="size-7" />
            </div>

            <div>
              <p className="text-3xl font-black tracking-tight">PropertyGoJB</p>
              <p className="text-sm font-medium text-slate-500">
                Modern Property Platform
              </p>
            </div>
          </div>

          <div className="max-w-sm">
            <div className="mb-6 grid size-14 place-items-center rounded-full bg-blue-100 text-blue-600">
              <ShieldCheck className="size-7" />
            </div>

            <h2 className="text-2xl font-black leading-tight tracking-tight">
              Your privacy and security are our top priority.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-500">
              Secure access for property showcase, agent workspace, and admin
              operations.
            </p>
          </div>

          <div className="relative h-72 overflow-hidden rounded-[2rem] border border-white/70 bg-blue-100/70 shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.95),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.15),rgba(96,165,250,0.45))]" />
            <div className="absolute bottom-0 h-32 w-full bg-gradient-to-t from-blue-300/70 to-transparent" />
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </section>
      </div>
    </main>
  );
}
