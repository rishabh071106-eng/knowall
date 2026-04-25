// Shared wrapper so all four legal pages have a consistent look.
export default function LegalLayout({ title, lastUpdated, children }) {
  return (
    <article className="max-w-3xl mx-auto bg-white border rounded-xl p-8">
      <h1 className="text-3xl font-bold mb-1">{title}</h1>
      {lastUpdated && (
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-6">
          Last updated {lastUpdated}
        </p>
      )}
      <div className="prose prose-slate max-w-none
                      prose-headings:font-semibold prose-headings:mt-8 prose-headings:mb-3
                      prose-h2:text-xl prose-p:leading-relaxed prose-p:text-slate-700
                      prose-a:text-brand prose-li:text-slate-700 prose-li:my-1">
        {children}
      </div>
    </article>
  );
}
