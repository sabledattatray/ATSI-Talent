/** Static placeholders keep the page layout visible while live data streams. */
export function ContentSkeleton({ cards = 6 }: { cards?: number }) {
  return <div role="status" aria-label="Loading content" className="py-6">
    <span className="sr-only">Loading content…</span>
    <div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 motion-safe:animate-pulse">
      {Array.from({ length: cards }, (_, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 h-10 w-10 rounded-xl bg-slate-100" />
        <div className="mb-3 h-5 w-3/4 rounded bg-slate-200" />
        <div className="mb-2 h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>)}
    </div>
  </div>;
}

export function PageSkeleton({ title }: { title: string }) {
  return <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
    <ContentSkeleton />
  </section>;
}
