import Link from "next/link";

import type { GuardRoleCode } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

type InternalTopbarProps = {
  portal: "Admin" | "Agent";
  userName?: string | null;
  userEmail?: string | null;
  roleCode?: GuardRoleCode;
};

export function InternalTopbar({
  portal,
  userName,
  userEmail,
  roleCode,
}: InternalTopbarProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{portal} Portal</p>
        <h1 className="text-xl font-semibold tracking-tight">PropertyGoJB</h1>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
        <div className="text-sm">
          <p className="font-medium">{userName ?? userEmail ?? "Signed in"}</p>
          <p className="text-muted-foreground">{roleCode ?? "NO_ROLE"}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Public</Link>
          </Button>

          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">Admin</Link>
          </Button>

          <Button asChild variant="ghost" size="sm">
            <Link href="/agent">Agent</Link>
          </Button>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
