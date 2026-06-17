import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[520px] rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_30px_100px_-42px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-9">
      {children}
    </div>
  );
}
