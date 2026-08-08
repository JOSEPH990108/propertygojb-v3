"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LogOut, Menu, MessageCircle, PhoneCall, Sparkles, UserRound, X } from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { AppThemeToggle } from "@/components/common/app-theme-toggle";
import { MarketingConsentSettingsButton } from "@/components/public/marketing-consent";
import { PublicProjectLiveRefresh } from "@/components/public/public-project-live-refresh";
import { authClient } from "@/lib/auth/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  PUBLIC_SITE_NAME,
  buildProjectEnquiryMessage,
  getPublicWhatsAppHref,
} from "@/lib/public/site";

type PublicShellProps = {
  children: ReactNode;
};

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/book-viewing", label: "Book Viewing" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicShell({ children }: PublicShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: session } = authClient.useSession();
  const whatsappHref = getPublicWhatsAppHref(buildProjectEnquiryMessage(PUBLIC_SITE_NAME));

  const isAuthenticated = Boolean(session?.user);

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicProjectLiveRefresh />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-slate-900 text-white shadow-lg shadow-blue-600/20">
              <Building2 className="size-5" />
            </span>

            <div>
              <p className="text-sm font-black tracking-tight text-foreground sm:text-base">
                {PUBLIC_SITE_NAME}
              </p>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.26em] text-blue-600">
                Johor Bahru Property Desk
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigationItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <AppThemeToggle />

            {isAuthenticated ? (
              <>
                <AppButton asChild appVariant="outline" className="h-11 rounded-full px-5 text-sm">
                  <Link href="/account">
                    <UserRound className="size-4" />
                    Profile
                  </Link>
                </AppButton>

                <AppButton
                  type="button"
                  appVariant="outline"
                  disabled={isPending}
                  onClick={handleSignOut}
                  className="h-11 rounded-full px-5 text-sm"
                >
                  <LogOut className="size-4" />
                  {isPending ? "Signing out..." : "Sign out"}
                </AppButton>
              </>
            ) : (
              <>
                <AppButton asChild appVariant="outline" className="h-11 rounded-full px-5 text-sm">
                  <Link href="/login">Login</Link>
                </AppButton>

                <AppButton asChild appVariant="outline" className="h-11 rounded-full px-5 text-sm">
                  <Link href="/register">Register</Link>
                </AppButton>
              </>
            )}

            <AppButton asChild className="h-11 rounded-full px-5 text-sm">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </AppButton>
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-2xl border border-border bg-background text-foreground"
                  aria-label="Open navigation"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[88vw] max-w-sm border-border bg-background p-0">
                <SheetHeader className="border-b border-border p-6 text-left">
                  <SheetTitle className="flex items-center gap-3 text-left text-lg font-black text-foreground">
                    <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-slate-900 text-white">
                      <Sparkles className="size-5" />
                    </span>
                    {PUBLIC_SITE_NAME}
                  </SheetTitle>
                  <SheetDescription className="text-left">
                    Premium property listings, project information, and fast enquiry support.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-2 px-4 py-5">
                  {navigationItems.map((item) => {
                    const active = isActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
                          active
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground hover:bg-accent",
                        )}
                      >
                        {item.label}
                        <X className="size-4 opacity-40" />
                      </Link>
                    );
                  })}

                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/account"
                        className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                      >
                        Profile
                        <UserRound className="size-4 opacity-60" />
                      </Link>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleSignOut}
                        className="flex w-full items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span>{isPending ? "Signing out..." : "Sign out"}</span>
                        <LogOut className="size-4 opacity-60" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                      >
                        Login
                        <UserRound className="size-4 opacity-60" />
                      </Link>

                      <Link
                        href="/register"
                        className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                      >
                        Register
                        <UserRound className="size-4 opacity-60" />
                      </Link>
                    </>
                  )}
                </div>

                <div className="mt-auto space-y-3 border-t border-border p-4">
                  <AppThemeToggle showLabel className="w-full rounded-2xl" />

                  <AppButton asChild appVariant="outline" className="h-12 w-full rounded-2xl">
                    <Link href="/contact">Open Enquiry Form</Link>
                  </AppButton>

                  <AppButton asChild className="h-12 w-full rounded-2xl">
                    <a href={whatsappHref} target="_blank" rel="noreferrer">
                      <PhoneCall className="size-4" />
                      WhatsApp Now
                    </a>
                  </AppButton>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-slate-900 text-white shadow-lg shadow-blue-600/20">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="text-base font-black text-foreground">{PUBLIC_SITE_NAME}</p>
                <p className="text-sm text-muted-foreground">
                  Johor Bahru property discovery made clear, fast, and conversion-friendly.
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
              Browse new launch projects, check project details, and send an enquiry directly to our team without navigating the internal portal.
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Explore
            </p>
            <div className="mt-4 space-y-3 text-sm font-semibold text-muted-foreground">
              <Link href="/about" className="block transition hover:text-blue-700">
                About
              </Link>
              <Link href="/projects" className="block transition hover:text-blue-700">
                Projects
              </Link>
              <Link href="/contact" className="block transition hover:text-blue-700">
                Enquiry
              </Link>
              <Link href="/book-viewing" className="block transition hover:text-blue-700">
                Book Viewing
              </Link>
              <Link href="/privacy" className="block transition hover:text-blue-700">
                Privacy
              </Link>
              <Link href="/terms" className="block transition hover:text-blue-700">
                Terms
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Contact
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Fast responses through WhatsApp and the public enquiry form.
            </p>

            <AppButton asChild className="mt-4 h-11 rounded-full px-5 text-sm">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                WhatsApp Us
              </a>
            </AppButton>

            <div className="mt-4">
              <MarketingConsentSettingsButton />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
