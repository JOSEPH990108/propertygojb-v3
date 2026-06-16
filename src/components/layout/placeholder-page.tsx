type PlaceholderPageProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PlaceholderPage({
  title,
  description,
  eyebrow,
}: PlaceholderPageProps) {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-5xl">
        {eyebrow ? (
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          {description}
        </p>
      </section>
    </main>
  );
}
