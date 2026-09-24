export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="h-3 rounded bg-neutral-200/70" style={{ width }} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="surface space-y-2.5 rounded-lg p-4">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine key={index} width={index === 0 ? "40%" : index % 2 ? "90%" : "70%"} />
      ))}
    </div>
  );
}

export function SkeletonList({ cards = 3, lines = 3 }: { cards?: number; lines?: number }) {
  return (
    <div className="mt-5 space-y-3">
      {Array.from({ length: cards }).map((_, index) => (
        <SkeletonCard key={index} lines={lines} />
      ))}
    </div>
  );
}
