import { useEffect, useState } from 'react';

const cache = new Map<string, boolean>();
const pending = new Map<string, Promise<boolean>>();

function fetchStock(handle: string): Promise<boolean> {
  if (cache.has(handle)) return Promise.resolve(cache.get(handle)!);
  if (pending.has(handle)) return pending.get(handle)!;
  const promise = fetch(`/api/product/${handle}/stock`)
    .then((r) => (r.ok ? r.json() : { outOfStock: false }))
    .then((d: { outOfStock: boolean }) => {
      cache.set(handle, d.outOfStock);
      pending.delete(handle);
      return d.outOfStock;
    })
    .catch(() => {
      cache.set(handle, false);
      pending.delete(handle);
      return false;
    });
  pending.set(handle, promise);
  return promise;
}

export function ProductStockBadge({ handle }: { handle: string }) {
  const [outOfStock, setOutOfStock] = useState<boolean | null>(
    cache.has(handle) ? cache.get(handle)! : null,
  );

  useEffect(() => {
    if (!handle || cache.has(handle)) return;
    fetchStock(handle).then(setOutOfStock);
  }, [handle]);

  if (outOfStock === null) return null;

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${outOfStock ? 'bg-red-500' : 'bg-green-500'}`}
      />
      <span className={`text-xs ${outOfStock ? 'text-red-600' : 'text-green-700'}`}>
        {outOfStock ? 'Fora de estoque' : 'Em estoque'}
      </span>
    </div>
  );
}
