import {useEffect, useState} from 'react';
import {StarHalfIcon, StarIcon} from '@phosphor-icons/react';
import type {JudgemeStarsRatingData} from '~/types/judgeme';

// Cache de módulo: evita refetch do mesmo handle mesmo se o componente remontar
const ratingCache = new Map<string, JudgemeStarsRatingData | null>();
const pendingRequests = new Map<string, Promise<JudgemeStarsRatingData | null>>();

function fetchRating(handle: string): Promise<JudgemeStarsRatingData | null> {
  if (ratingCache.has(handle)) return Promise.resolve(ratingCache.get(handle) ?? null);
  if (pendingRequests.has(handle)) return pendingRequests.get(handle)!;
  const promise = fetch(`/api/product/${handle}/reviews?type=rating`)
    .then((r) => (r.ok ? r.json() as Promise<JudgemeStarsRatingData> : null))
    .then((d) => {
      const result = d && d.totalReviews > 0 ? d : null;
      ratingCache.set(handle, result);
      pendingRequests.delete(handle);
      return result;
    })
    .catch(() => { ratingCache.set(handle, null); pendingRequests.delete(handle); return null; });
  pendingRequests.set(handle, promise);
  return promise;
}

function Stars({rating}: {rating: number}) {
  return (
    <span className="inline-flex gap-px text-[#e8a317] [&>svg]:size-[14px]">
      {Array.from({length: 5}).map((_, i) => {
        if (rating >= i + 1) return <StarIcon key={i} weight="fill" />;
        if (rating >= i + 0.5) return <StarHalfIcon key={i} weight="fill" />;
        return <StarIcon key={i} className="text-neutral-300" />;
      })}
    </span>
  );
}

export function JudgemeProductStars({productHandle}: {productHandle: string}) {
  const [data, setData] = useState<JudgemeStarsRatingData | null>(
    () => ratingCache.get(productHandle) ?? null,
  );

  useEffect(() => {
    if (!productHandle || ratingCache.has(productHandle)) return;
    fetchRating(productHandle).then((d) => setData(d));
  }, [productHandle]);

  if (!data) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Stars rating={data.averageRating} />
      <span className="text-[11px] font-medium text-neutral-500 leading-none">
        {data.averageRating.toFixed(1)}{' '}
        <span className="font-normal">({data.totalReviews} {data.totalReviews === 1 ? 'avaliação' : 'avaliações'})</span>
      </span>
    </div>
  );
}
