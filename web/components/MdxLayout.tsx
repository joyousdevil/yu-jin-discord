export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 sm:py-16">
      <article className="prose dark:prose-invert max-w-none">
        {children}
      </article>
    </div>
  );
}
