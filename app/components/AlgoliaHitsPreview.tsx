import {Link} from 'react-router';
import {useHits, useInstantSearch, useSearchBox} from 'react-instantsearch';

type HitItem = {
  objectID: string;
  title?: string;
  handle?: string;
  image?: string;
  price?: string | number;
  brand?: string;
};

type Props = {
  minLength?: number;
  onNavigate?: () => void;
};

export default function AlgoliaHitsPreview({
  minLength = 3,
  onNavigate,
}: Props) {
  const {query} = useSearchBox();
  const {hits} = useHits<HitItem>();
  const {status} = useInstantSearch();

  const hasMinQuery = query.trim().length >= minLength;

  if (!hasMinQuery) {
    return (
      <div className="p-5 text-sm text-gray-500">
        Digite pelo menos {minLength} letras para iniciar a busca.
      </div>
    );
  }

  if (status === 'loading' || status === 'stalled') {
    return (
      <div className="p-5 text-sm text-gray-500">
        Buscando...
      </div>
    );
  }

  if (!hits.length) {
    return (
      <div className="p-5 text-sm text-gray-500">
        Nenhum produto encontrado.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Produtos
      </h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {hits.slice(0, 8).map((hit) => (
          <Link
            key={hit.objectID}
            to={hit.handle ? `/products/${hit.handle}` : `/search?q=${encodeURIComponent(query)}`}
            onClick={onNavigate}
            className="rounded-xl border border-gray-200 p-3 transition hover:shadow-md"
          >
            {hit.image ? (
              <img
                src={hit.image}
                alt={hit.title || 'Produto'}
                className="mb-3 h-28 w-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="mb-3 h-28 rounded bg-gray-100" />
            )}

            {hit.brand ? (
              <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">
                {hit.brand}
              </div>
            ) : null}

            <p className="line-clamp-2 text-sm font-medium text-gray-900">
              {hit.title || 'Produto'}
            </p>

            {hit.price ? (
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {hit.price}
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="mt-5 text-center">
        <Link
          to={`/search?q=${encodeURIComponent(query)}`}
          onClick={onNavigate}
          className="inline-flex items-center text-sm font-semibold text-red-600 hover:underline"
        >
          Mostrar mais
        </Link>
      </div>
    </div>
  );
}