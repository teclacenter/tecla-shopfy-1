import {useEffect, useState} from 'react';
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
  useHits,
  useInstantSearch,
  useSearchBox,
} from 'react-instantsearch';

type AlgoliaSearchProps = {
  appId: string;
  searchKey: string;
  indexName: string;
  mode?: 'full' | 'overlay';
  minQueryLength?: number;
  maxPreviewHits?: number;
  onNavigate?: () => void;
};

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

function ProductHit({
  hit,
  onNavigate,
}: {
  hit: AlgoliaHit;
  onNavigate?: () => void;
}) {
  const image =
    hit.image || hit.image_url || hit.featuredImage || '/placeholder-image.svg';
  const price = hit.price ?? hit.price_min;
  const productUrl = hit.handle ? `/products/${hit.handle}` : '#';

  return (
    <a
      href={productUrl}
      onClick={onNavigate}
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

function OverlaySearchBox({minQueryLength}: {minQueryLength: number}) {
  const {query, refine} = useSearchBox();
  const [value, setValue] = useState(query || '');

  function handleChange(nextValue: string) {
    setValue(nextValue);

    if (nextValue.trim().length >= minQueryLength) {
      refine(nextValue);
    } else {
      refine('');
    }
  }

  return (
    <div className="space-y-4">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar produtos, marcas e muito mais..."
        className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-500"
      />

      {value.trim().length > 0 && value.trim().length < minQueryLength ? (
        <p className="text-sm text-neutral-500">
          Digite pelo menos {minQueryLength} letras para buscar.
        </p>
      ) : null}
    </div>
  );
}

function OverlayHits({
  minQueryLength,
  maxPreviewHits,
  onNavigate,
}: {
  minQueryLength: number;
  maxPreviewHits: number;
  onNavigate?: () => void;
}) {
  const {hits} = useHits<AlgoliaHit>();
  const {status} = useInstantSearch();
  const {query} = useSearchBox();

  const hasMinQuery = query.trim().length >= minQueryLength;

  if (!hasMinQuery) return null;

  if (status === 'loading' || status === 'stalled') {
    return <div className="pt-4 text-sm text-neutral-500">Buscando...</div>;
  }

  if (!hits.length) {
    return (
      <div className="pt-4 text-sm text-neutral-500">
        Nenhum produto encontrado.
      </div>
    );
  }

  return (
    <div className="pt-4">
      <h3 className="mb-4 text-lg font-semibold text-neutral-900">
        Produtos
      </h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {hits.slice(0, maxPreviewHits).map((hit) => (
          <ProductHit
            key={hit.objectID}
            hit={hit}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="mt-5 text-center">
        <a
          href={`/search?q=${encodeURIComponent(query)}`}
          onClick={onNavigate}
          className="inline-flex items-center text-sm font-semibold text-red-600 hover:underline"
        >
          Mostrar mais
        </a>
      </div>
    </div>
  );
}

function FullHitsWrapper({onNavigate}: {onNavigate?: () => void}) {
  return (
    <Hits
      hitComponent={({hit}) => (
        <ProductHit hit={hit as AlgoliaHit} onNavigate={onNavigate} />
      )}
      classNames={{
        list: 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4',
      }}
    />
  );
}

export default function AlgoliaSearch({
  appId,
  searchKey,
  indexName,
  mode = 'full',
  minQueryLength = 3,
  maxPreviewHits = 8,
  onNavigate,
}: AlgoliaSearchProps) {
  const [mounted, setMounted] = useState(false);
  const [searchClient, setSearchClient] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadClient() {
      if (!appId || !searchKey) return;

      const mod = await import('algoliasearch/lite');
      const factory =
        (mod as any).liteClient ??
        (mod as any).default ??
        (mod as any).algoliasearch ??
        mod;

      if (typeof factory !== 'function') {
        console.error('Algolia client factory inválido:', mod);
        return;
      }

      if (active) {
        setSearchClient(factory(appId, searchKey));
      }
    }

    if (mounted) {
      loadClient();
    }

    return () => {
      active = false;
    };
  }, [mounted, appId, searchKey]);

  if (!mounted) return null;

  if (!appId || !searchKey || !indexName) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Configure ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY e ALGOLIA_INDEX_NAME.
      </div>
    );
  }

  if (!searchClient) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
        Carregando busca...
      </div>
    );
  }

  if (mode === 'overlay') {
    return (
      <InstantSearch searchClient={searchClient} indexName={indexName}>
        <Configure hitsPerPage={maxPreviewHits} clickAnalytics />
        <OverlaySearchBox minQueryLength={minQueryLength} />
        <OverlayHits
          minQueryLength={minQueryLength}
          maxPreviewHits={maxPreviewHits}
          onNavigate={onNavigate}
        />
      </InstantSearch>
    );
  }

  return (
    <InstantSearch searchClient={searchClient} indexName={indexName}>
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

          <FullHitsWrapper onNavigate={onNavigate} />

          <div className="mt-8">
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearch>
  );
}