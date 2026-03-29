import {useEffect, useMemo, useState} from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  ClearRefinements,
  Configure,
  CurrentRefinements,
  HierarchicalMenu,
  Hits,
  InstantSearch,
  Pagination,
  RangeInput,
  RefinementList,
  SearchBox,
  SortBy,
  Stats,
} from 'react-instantsearch';

type AlgoliaHit = {
  objectID: string;
  handle?: string;
  title?: string;
  vendor?: string;
  product_type?: string;
  image?: string;
  image_url?: string;
  featuredImage?: string;
  price?: number;
  price_min?: number;
  compare_at_price?: number;
};

function formatMoney(value?: number) {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function ProductHit({hit}: {hit: AlgoliaHit}) {
  const image =
    hit.image || hit.image_url || hit.featuredImage || '/placeholder-image.svg';
  const price = hit.price ?? hit.price_min;
  const productUrl = hit.handle ? `/products/${hit.handle}` : '#';

  return (
    <a
      href={productUrl}
      className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 transition hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100">
        <img
          src={image}
          alt={hit.title || 'Produto'}
          className="h-full w-full object-contain transition group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>

      <div className="mt-4">
        {hit.vendor ? (
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            {hit.vendor}
          </div>
        ) : null}

        <h3 className="mt-1 line-clamp-2 min-h-[3rem] text-sm font-medium text-neutral-900">
          {hit.title || 'Produto'}
        </h3>

        {typeof price === 'number' ? (
          <div className="mt-2 text-base font-semibold text-neutral-900">
            {formatMoney(price)}
          </div>
        ) : null}
      </div>
    </a>
  );
}

function HitsWrapper() {
  return (
    <Hits
      hitComponent={ProductHit}
      classNames={{
        list: 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4',
      }}
    />
  );
}

export default function AlgoliaSearch() {
  const [mounted, setMounted] = useState(false);

  const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
  const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
  const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME;

  useEffect(() => {
    setMounted(true);
  }, []);

  const searchClient = useMemo(() => {
  if (!appId || !searchKey) return null;
  return algoliasearch(appId, searchKey) as any;
}, [appId, searchKey]);

  if (!mounted) return null;

  if (!appId || !searchKey || !indexName || !searchClient) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Configure VITE_ALGOLIA_APP_ID, VITE_ALGOLIA_SEARCH_API_KEY e
        VITE_ALGOLIA_INDEX_NAME no seu .env.
      </div>
    );
  }

  return (
    <InstantSearch searchClient={searchClient as any} indexName={indexName}>
      <Configure hitsPerPage={16} clickAnalytics />

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">
              Categorias
            </h3>
            <HierarchicalMenu
              attributes={[
                'collections.lvl0',
                'collections.lvl1',
                'collections.lvl2',
              ]}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">
              Marca
            </h3>
            <RefinementList attribute="vendor" searchable />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">
              Tipo
            </h3>
            <RefinementList attribute="product_type" />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">
              Faixa de preço
            </h3>
            <RangeInput attribute="price" />
          </div>

          <div className="pt-2">
            <ClearRefinements />
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 space-y-4">
            <SearchBox
              placeholder="Buscar produtos, marcas e categorias"
              classNames={{
                root: 'w-full',
                form: 'relative',
                input:
                  'w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-500',
                submit:
                  'absolute left-3 top-1/2 -translate-y-1/2 opacity-60',
                reset:
                  'absolute right-3 top-1/2 -translate-y-1/2 opacity-60',
              }}
            />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Stats />
              <SortBy
                items={[
                  {label: 'Relevância', value: indexName},
                  {label: 'Menor preço', value: `${indexName}_price_asc`},
                  {label: 'Maior preço', value: `${indexName}_price_desc`},
                ]}
              />
            </div>

            <CurrentRefinements />
          </div>

          <HitsWrapper />

          <div className="mt-8">
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearch>
  );
}