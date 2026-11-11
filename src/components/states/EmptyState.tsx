interface EmptyStateProps {
  title: string;
  hint?: string;
}

/** Estado vazio (nenhuma busca feita ou nenhum resultado). */
export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex min-w-0 flex-col items-center gap-2 py-16 text-center [overflow-wrap:anywhere]"
    >
      <span aria-hidden="true" className="text-4xl">
        🌍
      </span>
      <h2 className="max-w-full text-lg font-semibold text-white/80">{title}</h2>
      {hint && <p className="max-w-full text-sm text-white/70">{hint}</p>}
    </div>
  );
}
