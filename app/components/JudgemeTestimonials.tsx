import {useEffect, useMemo, useState} from 'react';

type Review = {
  id: string | number;
  rating: number;
  body: string;
  title?: string;
  reviewer: string;
  productTitle?: string;
  productImage?: string | null;
};

type ReviewsResponse = {
  reviews: Review[];
  totalReviews: number;
  averageRating: string;
};

function Stars({count = 5}: {count?: number}) {
  return (
    <div className="flex items-center justify-center gap-1 text-red-500 text-xl leading-none">
      {Array.from({length: count}).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

function chunkArray<T>(arr: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

export default function JudgemeTestimonials() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        const res = await fetch('/api/judgeme-reviews');
        const json = (await res.json()) as ReviewsResponse;

        if (isMounted) {
          setData(json);
        }
      } catch (error) {
        console.error('Erro carregando reviews Judge.me', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const pages = useMemo(() => {
    return chunkArray(data?.reviews || [], 3);
  }, [data]);

  const currentReviews = pages[page] || [];

  const prev = () => {
    setPage((old) => (old === 0 ? Math.max(pages.length - 1, 0) : old - 1));
  };

  const next = () => {
    setPage((old) => (old === pages.length - 1 ? 0 : old + 1));
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p>Carregando avaliações...</p>
        </div>
      </section>
    );
  }

  if (!data || !data.reviews?.length) {
    return null;
  }

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-900">
            Deixe os clientes falarem por nós
          </h2>

          <div className="mt-4">
            <Stars />
            <p className="mt-1 text-base text-neutral-600">
              de {data.totalReviews} avaliações ✅
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {currentReviews.map((review) => (
            <article
              key={review.id}
              className="flex min-h-[260px] flex-col items-center text-center"
            >
              <Stars count={review.rating} />

              <div className="mt-4 text-lg font-semibold text-neutral-900">
                {review.title || 'Excelente'}
              </div>

              <p className="mt-2 max-w-xs text-base leading-6 text-neutral-700">
                {review.body}
              </p>

              <div className="mt-8 text-sm text-neutral-500">
                {review.reviewer}
              </div>

              {review.productImage ? (
                <img
                  src={review.productImage}
                  alt={review.productTitle || 'Produto'}
                  className="mt-4 h-16 w-auto object-contain"
                  loading="lazy"
                />
              ) : null}
            </article>
          ))}
        </div>

        {pages.length > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={prev}
              className="text-4xl text-neutral-300 transition hover:text-neutral-700"
              aria-label="Avaliações anteriores"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="text-4xl text-neutral-300 transition hover:text-neutral-700"
              aria-label="Próximas avaliações"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}