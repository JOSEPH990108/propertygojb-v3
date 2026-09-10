"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LogOut,
  Menu,
  MessageCircle,
  PhoneCall,
  Sparkles,
  UserRound,
} from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { AppSkipLink } from "@/components/common/app-skip-link";
import { AppThemeToggle } from "@/components/common/app-theme-toggle";
import { MarketingConsentSettingsButton } from "@/components/public/marketing-consent";
import { PublicProjectLiveRefresh } from "@/components/public/public-project-live-refresh";
import { authClient } from "@/lib/auth/client";
import {
  Sheet,
  SheetClose,
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

export type PublicNavigationItem = {
  href: string;
  label: string;
};

type PublicShellProps = {
  children: ReactNode;
  /** Override the default header nav links (e.g. a project-specific template). */
  navigationItems?: PublicNavigationItem[];
};

const defaultNavigationItems: PublicNavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicShell({
  children,
  navigationItems = defaultNavigationItems,
}: PublicShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: session } = authClient.useSession();
  const whatsappHref = getPublicWhatsAppHref(
    buildProjectEnquiryMessage(PUBLIC_SITE_NAME),
  );

  const isAuthenticated = Boolean(session?.user);

  // The header is fixed and starts transparent on every public page, floating
  // over whatever sits at the top (hero photo, dark panel, or plain
  // background); the scrim below guarantees its light text stays legible even
  // when a page has no dark section of its own. It turns solid once scrolled.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overlay = !scrolled;

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSkipLink targetId="main-content" />
      <PublicProjectLiveRefresh />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-colors duration-500",
          overlay
            ? "border-b border-transparent bg-transparent"
            : "border-b border-border/70 bg-background/85 backdrop-blur-xl",
        )}
      >
        {overlay ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/25 to-transparent"
          />
        ) : null}
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-11 place-items-center rounded-none text-primary-foreground shadow-sm",
                overlay
                  ? "bg-public-hero-foreground text-[#1b1c19]"
                  : "bg-primary",
              )}
            >
              <Building2 className="size-5" />
            </span>

            <div>
              <p
                className={cn(
                  "font-serif text-lg font-medium tracking-tight sm:text-xl",
                  overlay ? "text-public-hero-foreground" : "text-foreground",
                )}
              >
                {PUBLIC_SITE_NAME}
              </p>
              <p
                className={cn(
                  "text-[0.68rem] font-medium uppercase tracking-[0.32em]",
                  overlay
                    ? "text-public-hero-accent"
                    : "text-public-decorative",
                )}
              >
                Johor Bahru Property Desk
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navigationItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative py-2 text-xs font-semibold tracking-[0.14em] uppercase transition xl:text-sm",
                    overlay
                      ? active
                        ? "text-public-hero-foreground"
                        : "text-public-hero-foreground/75 hover:text-public-hero-foreground"
                      : active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-0 -bottom-0.5 h-px origin-left transition-transform duration-300",
                      overlay
                        ? "bg-public-hero-accent"
                        : "bg-public-decorative",
                      active
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            <AppThemeToggle
              className={cn(
                "rounded-none",
                overlay &&
                  "border-public-hero-foreground/30 bg-transparent text-public-hero-foreground hover:bg-public-hero-foreground/10",
              )}
            />

            {isAuthenticated ? (
              <>
                <AppButton
                  asChild
                  appVariant="outline"
                  className={cn(
                    "h-11 rounded-none px-4 text-sm xl:px-5",
                    overlay &&
                      "border-public-hero-foreground/30 bg-transparent text-public-hero-foreground hover:bg-public-hero-foreground/10",
                  )}
                >
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
                  className={cn(
                    "h-11 rounded-none px-4 text-sm xl:px-5",
                    overlay &&
                      "border-public-hero-foreground/30 bg-transparent text-public-hero-foreground hover:bg-public-hero-foreground/10",
                  )}
                >
                  <LogOut className="size-4" />
                  {isPending ? "Signing out..." : "Sign out"}
                </AppButton>
              </>
            ) : (
              <>
                <AppButton
                  asChild
                  appVariant="outline"
                  className={cn(
                    "h-11 rounded-none px-4 text-sm xl:px-5",
                    overlay &&
                      "border-public-hero-foreground/30 bg-transparent text-public-hero-foreground hover:bg-public-hero-foreground/10",
                  )}
                >
                  <Link href="/login">Login</Link>
                </AppButton>

                <AppButton
                  asChild
                  appVariant="outline"
                  className={cn(
                    "h-11 rounded-none px-4 text-sm xl:px-5",
                    overlay &&
                      "border-public-hero-foreground/30 bg-transparent text-public-hero-foreground hover:bg-public-hero-foreground/10",
                  )}
                >
                  <Link href="/register">Register</Link>
                </AppButton>
              </>
            )}

            <AppButton
              asChild
              className={cn(
                "h-11 rounded-none px-4 text-sm xl:px-5",
                overlay &&
                  "bg-public-hero-foreground text-[#1b1c19] hover:brightness-95",
              )}
            >
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
                  className={cn(
                    "grid size-11 place-items-center rounded-none border",
                    overlay
                      ? "border-public-hero-foreground/30 bg-transparent text-public-hero-foreground"
                      : "border-border bg-background text-foreground",
                  )}
                  aria-label="Open navigation"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[88vw] max-w-sm border-border bg-background p-0"
              >
                <SheetHeader className="border-b border-border p-6 text-left">
                  <SheetTitle className="flex items-center gap-3 text-left text-lg font-black text-foreground">
                    <span className="grid size-10 place-items-center rounded-none bg-primary text-primary-foreground">
                      <Sparkles className="size-5" />
                    </span>
                    {PUBLIC_SITE_NAME}
                  </SheetTitle>
                  <SheetDescription className="text-left">
                    Premium property listings, project information, and fast
                    enquiry support.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-2 px-4 py-5">
                  {navigationItems.map((item) => {
                    const active = isActive(pathname, item.href);

                    return (
                      <SheetClose key={item.href} asChild>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center justify-between rounded-none px-4 py-3 text-sm font-semibold transition",
                            active
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground hover:bg-accent",
                          )}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}

                  {isAuthenticated ? (
                    <>
                      <SheetClose asChild>
                        <Link
                          href="/account"
                          className="flex items-center justify-between rounded-none bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                        >
                          Profile
                          <UserRound className="size-4 opacity-60" />
                        </Link>
                      </SheetClose>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleSignOut}
                        className="flex w-full items-center justify-between rounded-none bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span>{isPending ? "Signing out..." : "Sign out"}</span>
                        <LogOut className="size-4 opacity-60" />
                      </button>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Link
                          href="/login"
                          className="flex items-center justify-between rounded-none bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                        >
                          Login
                          <UserRound className="size-4 opacity-60" />
                        </Link>
                      </SheetClose>

                      <SheetClose asChild>
                        <Link
                          href="/register"
                          className="flex items-center justify-between rounded-none bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                        >
                          Register
                          <UserRound className="size-4 opacity-60" />
                        </Link>
                      </SheetClose>
                    </>
                  )}
                </div>

                <div className="mt-auto space-y-3 border-t border-border p-4">
                  <AppThemeToggle showLabel className="w-full rounded-none" />

                  <AppButton
                    asChild
                    appVariant="outline"
                    className="h-12 w-full rounded-none"
                  >
                    <Link href="/contact">Open Enquiry Form</Link>
                  </AppButton>

                  <AppButton asChild className="h-12 w-full rounded-none">
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

      <main id="main-content">{children}</main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <p className="font-serif text-2xl font-medium text-foreground">
                {PUBLIC_SITE_NAME}
              </p>
              <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.32em] text-public-decorative">
                Johor Bahru Property Desk
              </p>

              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
                Browse new launch projects, check project details, and send an
                enquiry directly to our team without navigating the internal
                portal.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Explore
              </p>
              <div className="mt-4 space-y-3 text-sm font-semibold text-muted-foreground">
                <Link
                  href="/about"
                  className="block transition hover:text-foreground"
                >
                  About
                </Link>
                <Link
                  href="/projects"
                  className="block transition hover:text-foreground"
                >
                  Projects
                </Link>
                <Link
                  href="/contact"
                  className="block transition hover:text-foreground"
                >
                  Enquiry
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Contact
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Fast responses through WhatsApp and the public enquiry form.
              </p>

              <AppButton
                asChild
                className="mt-4 h-11 rounded-none px-5 text-sm"
              >
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

          <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {PUBLIC_SITE_NAME}. All rights
              reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
