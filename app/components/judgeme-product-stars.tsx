import {useEffect, useState} from 'react';
import {StarHalfIcon, StarIcon} from '@phosphor-icons/react';
import type {JudgemeStarsRatingData} from '~/types/judgeme';

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
  const [data, setData] = useState<JudgemeStarsRatingData | null>(null);

  useEffect(() => {
    if (!productHandle) return;
    fetch(`/api/product/${productHandle}/reviews?type=rating`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: JudgemeStarsRatingData | null) => {
        if (d && d.totalReviews > 0) setData(d);
      })
      .catch(() => {});
  }, [productHandle]);

  if (!data) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Stars rating={data.averageRating} />
      <span className="text-[11px] font-medium text-neutral-500 leading-none">
        {data.averageRating.toFixed(1)}{' '}
        <span className="font-normal">({data.totalReviews} reviews)</span>
      </span>
    </div>
  );
}
