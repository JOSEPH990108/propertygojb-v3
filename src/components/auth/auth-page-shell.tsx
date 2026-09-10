import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

type AuthPageShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

/** Editorial split shell shared by login/register/forgot-password (see docs/UI_DESIGN_GUIDE.md). */
export function AuthPageShell({
  children,
  eyebrow,
  title,
  description,
}: AuthPageShellProps) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-2">
      <aside className="relative hidden min-h-screen overflow-hidden bg-public-hero text-public-hero-foreground lg:block">
        <Image
          src="/images/defaults/highrise-interior.png"
          alt="Interior of a high-rise living room with a skyline view at dusk"
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-public-hero/90 via-public-hero/30 to-public-hero/60"
        />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-serif text-2xl font-medium tracking-tight">
              PropertyGoJB
            </span>
            <span className="mt-1 text-[0.62rem] font-medium tracking-[0.4em] text-public-hero-accent uppercase">
              Johor Bahru Property Desk
            </span>
          </Link>

          <div className="max-w-md">
            <p className="mb-5 inline-flex items-center gap-3 text-xs font-light tracking-[0.32em] text-public-hero-foreground/75 uppercase">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-public-hero-accent"
              />
              The Private Desk
            </p>
            <h2 className="text-balance font-serif text-4xl leading-tight font-light xl:text-5xl">
              A more considered way to find home.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed font-light text-public-hero-foreground/80">
              One account for saved projects, viewing requests, and enquiry
              history across every published launch.
            </p>
          </div>

          <p className="text-[0.62rem] font-medium tracking-[0.3em] text-public-hero-foreground/60 uppercase">
            Johor Bahru
          </p>
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-col justify-start px-6 py-10 sm:px-10 sm:py-12 lg:justify-center lg:px-16 xl:px-20">
        {/* Absolutely positioned (not part of the centered flow below) so it
            sits at the same spot regardless of form height/content length —
            a centered flex item would otherwise drift with taller content
            (e.g. register's stepper) vs. shorter content (e.g. login). */}
        <Link
          href="/"
          className="absolute top-10 right-6 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase transition hover:text-foreground sm:top-12 sm:right-10 lg:top-14 lg:right-16 xl:right-20"
        >
          Return to site
        </Link>

        <div className="mx-auto w-full max-w-sm pt-14 sm:pt-16 lg:pt-0">
          <p className="mb-4 text-xs font-medium tracking-[0.28em] text-public-decorative uppercase">
            {eyebrow}
          </p>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="mt-10">{children}</div>
        </div>
      </section>
    </main>
  );
}
