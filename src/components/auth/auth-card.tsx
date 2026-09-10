import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

/** Plain content wrapper; the editorial shell provides the panel framing, not this card. */
export function AuthCard({ children }: AuthCardProps) {
  return <div className="w-full">{children}</div>;
}
