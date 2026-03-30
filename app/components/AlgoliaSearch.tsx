import {useEffect, useMemo, useRef, useState} from 'react';
import {useInView} from 'react-intersection-observer';
import {Link, useSearchParams} from 'react-router';
import algoliasearch from 'algoliasearch/lite';
import {
  ClearRefinements,
  Configure,
  CurrentRefinements,
  HierarchicalMenu,
  InstantSearch,
  RangeInput,
  RefinementList,
  Stats,
  useCurrentRefinements,
  useInfiniteHits,
  useInstantSearch,
  useSearchBox,
} from 'react-instantsearch';
import {
  CaretDownIcon,
  CaretRightIcon,
  CheckIcon,
  FadersHorizontalIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react';

import AlgoliaHitsPreview from '~/components/AlgoliaHitsPreview';
import AlgoliaSearchBox from '~/components/AlgoliaSearchBox';
import {JudgemeProductStars} from '~/components/judgeme-product-stars';
import {ProductStockBadge} from '~/components/product-stock-badge';

type AlgoliaSearchProps = {
  appId: string;
  searchKey: string;
  indexName: string;
  mode?: 'overlay' | 'full';
  minQueryLength?: number;
  maxPreviewHits?: number;
  onNavigate?: () => void;
  onSearchPageNavigate?: (query: string) => void;
  initialQuery?: string;
};

type HitItem = {
  objectID: string;
  title?: string;
  handle?: string;
  image?: string;
  brand?: string;
  vendor?: string;
  meta?: {magento?: {marca?: string}; [key: string]: unknown};
  variant_title?: string;
  variant_id?: string | number;
  product_handle?: string;

  price?: string | number;
  min_price?: string | number;
  max_price?: string | number;
  price_min?: string | number;
  price_max?: string | number;
  compare_at_price?: string | number;
  variants_count?: number;
  has_variants?: boolean;
  price_range?: string;

  color?: string | string[];
  colors?: string[];
  cor?: string | string[];
  cores?: string[];

  size?: string | string[];
  sizes?: string[];
  tamanho?: string | string[];
  tamanhos?: string[];

  kit?: string | string[];
  kits?: string[];

  option_names?: string[];
  options?: Record<string, string | string[]>;
  variant_options?: Record<string, string[] | string>;

  // Availability fields synced by Shopify→Algolia integration
  available?: boolean;
  inventory_quantity?: number;
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatPrice(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getPriceModel(hit: HitItem) {
  const rawMin =
    toNumber(hit.min_price) ??
    toNumber(hit.price_min) ??
    toNumber(hit.price);

  const rawMax =
    toNumber(hit.max_price) ??
    toNumber(hit.price_max) ??
    toNumber(hit.price);

  const min = rawMin ?? null;
  const max = rawMax ?? min;

  const hasVariantsFlag =
    hit.has_variants === true ||
    (typeof hit.variants_count === 'number' && hit.variants_count > 1);

  const isConfigurable =
    hasVariantsFlag || (min !== null && max !== null && max > min);

  if (min === null) {
    return null;
  }

  return {
    isConfigurable,
    min,
    max,
    pixValue: min * 0.9,
  };
}

function normalizeValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  if (typeof value === 'string') {
    return value
      .split(/[,|;/]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, arr) => arr.indexOf(item) === index);
  }

  return [];
}

function prettifyOptionLabel(label: string) {
  const normalized = label
    .replace(/[_-]+/g, ' ')
    .replace(/\((.*?)\)/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (normalized.includes('cor')) return 'Cor';
  if (normalized.includes('kit')) return 'Kit';
  if (normalized.includes('tamanho')) return 'Tamanho';
  if (normalized.includes('size')) return 'Tamanho';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getVariantGroups(hit: HitItem) {
  const groups: Array<{label: string; values: string[]}> = [];

  const pushGroup = (label: string, rawValue: unknown) => {
    const values = normalizeValues(rawValue);
    if (values.length) {
      groups.push({label: prettifyOptionLabel(label), values});
    }
  };

  pushGroup('Cor', hit.cores ?? hit.cor ?? hit.colors ?? hit.color);
  pushGroup('Tamanho', hit.tamanhos ?? hit.tamanho ?? hit.sizes ?? hit.size);
  pushGroup('Kit', hit.kits ?? hit.kit);

  if (Array.isArray(hit.option_names) && hit.options && typeof hit.options === 'object') {
    hit.option_names.forEach((optionName) => {
      const rawValue = hit.options?.[optionName];
      pushGroup(optionName, rawValue);
    });
  }

  if (hit.variant_options && typeof hit.variant_options === 'object') {
    Object.entries(hit.variant_options).forEach(([key, value]) => {
      pushGroup(key, value);
    });
  }

  const merged = new Map<string, Set<string>>();

  groups.forEach((group) => {
    const key = group.label.toLowerCase();
    if (!merged.has(key)) merged.set(key, new Set());
    group.values.forEach((value) => merged.get(key)?.add(value));
  });

  return Array.from(merged.entries()).map(([key, values]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    values: Array.from(values),
  }));
}

function SearchQuerySync({
  query,
  minLength = 0,
}: {
  query: string;
  minLength?: number;
}) {
  const {refine} = useSearchBox();
  // Rastreia o último valor enviado para evitar re-disparos por mudanças internas
  // (ex: troca de índice via sort) que resetariam o sort
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const target = trimmed.length >= minLength ? trimmed : '';
    // Só refina se o valor da prop realmente mudou — nunca reage a currentQuery
    if (target !== lastSentRef.current) {
      lastSentRef.current = target;
      refine(target);
    }
  }, [query, minLength, refine]); // sem currentQuery nas deps

  return null;
}

function EmptyState() {
  const {indexUiState} = useInstantSearch();
  const query = (indexUiState?.query as string) || '';

  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        <MagnifyingGlassIcon className="h-6 w-6 text-neutral-500" />
      </div>

      <h3 className="mt-5 text-xl font-semibold text-neutral-900">
        Nenhum resultado encontrado
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-500">
        Não encontramos produtos para <strong>{query || 'sua busca'}</strong>.
        Tente outro termo, remova filtros ou use palavras mais amplas.
      </p>

      <div className="mt-6 flex justify-center">
        <ClearRefinements
          translations={{resetButtonText: 'Limpar filtros'}}
          classNames={{
            button:
              'inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40',
          }}
        />
      </div>
    </div>
  );
}

function PriceBlock({hit}: {hit: HitItem}) {
  const model = getPriceModel(hit);

  if (!model) {
    return <div className="h-12" />;
  }

  return (
    <div className="space-y-1">
      <p className="text-base font-semibold leading-5 text-neutral-950 md:text-lg">
        {formatPrice(model.min)} até 12X
      </p>
      <p className="text-sm font-medium leading-5 text-neutral-700 md:text-[15px]">
        {formatPrice(model.pixValue)} à vista no Pix
      </p>
    </div>
  );
}

function VariantSummary({hit}: {hit: HitItem}) {
  const groups = getVariantGroups(hit);

  if (!groups.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {groups.map((group) => (
        <div key={`${group.label}-${group.values.join('-')}`} className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {group.label}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {group.values.slice(0, 6).map((value) => (
              <span
                key={value}
                className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function canonicalOptionKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function toShopifyOptionName(key: string) {
  const canonical = canonicalOptionKey(key);

  if (canonical === 'cor') return 'Cor';
  if (canonical === 'tecnologia') return 'Tecnologia';
  if (canonical === 'tamanho da cauda') return 'Tamanho da Cauda';
  if (canonical.includes('kit')) return 'Kit';

  return key
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFirstCleanValue(value: string | string[]) {
  if (Array.isArray(value)) {
    const first = value.find((item) => String(item).trim());
    return first ? String(first).trim() : '';
  }

  return value ? String(value).trim() : '';
}

function buildProductUrl(
  hit: {
    handle?: string;
    product_handle?: string;
    options?: Record<string, string | string[]>;
  },
  fallbackQuery = '',
) {
  const handle = hit.handle || hit.product_handle;

  if (!handle) {
    return fallbackQuery
      ? `/search?q=${encodeURIComponent(fallbackQuery)}`
      : '#';
  }

  const params = new URLSearchParams();
  const seen = new Set<string>();

  if (hit.options && typeof hit.options === 'object') {
    Object.entries(hit.options).forEach(([rawKey, rawValue]) => {
      const canonical = canonicalOptionKey(rawKey);
      const shopifyKey = toShopifyOptionName(rawKey);
      const cleanValue = getFirstCleanValue(rawValue);

      if (!cleanValue) return;
      if (seen.has(canonical)) return;

      seen.add(canonical);
      params.set(shopifyKey, cleanValue);
    });
  }

  const queryString = params.toString();

  return queryString
    ? `/products/${handle}?${queryString}`
    : `/products/${handle}`;
}

function ProductHit({
  hit,
  onNavigate,
}: {
  hit: HitItem;
  onNavigate?: () => void;
}) {
  const productUrl = buildProductUrl(hit);

  return (
    <article className="group h-full overflow-hidden rounded-[28px] border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)]">
      <Link to={productUrl} onClick={onNavigate} className="flex h-full flex-col">
        <div className="flex aspect-[1/1] items-center justify-center bg-neutral-50 p-5 md:p-6">
          {hit.image ? (
            <img
              src={hit.image}
              alt={hit.title || 'Produto'}
              className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full rounded-2xl bg-neutral-100" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 md:p-5">
          {(hit.handle || hit.product_handle) ? (
            <div className="mt-1 min-h-[18px]">
              <JudgemeProductStars productHandle={(hit.handle || hit.product_handle) as string} />
            </div>
          ) : null}

          <h3 className="mt-1 line-clamp-2 min-h-[44px] text-sm font-medium leading-5 text-neutral-900 md:text-[15px]">
            {hit.title || 'Produto'}
          </h3>

          <VariantSummary hit={hit} />

          {(hit.handle || hit.product_handle) && (
            <ProductStockBadge handle={(hit.handle || hit.product_handle) as string} />
          )}

          <div className="mt-auto pt-3">
            <PriceBlock hit={hit} />
          </div>
        </div>
      </Link>
    </article>
  );
}

// Sort gerenciado por URL param (?sort=price_asc|price_desc)
// Completamente desacoplado do estado interno do react-instantsearch
function SortBySelect() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSort = searchParams.get('sort') || 'default';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (value === 'default') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', value);
    }
    setSearchParams(newParams, {replace: true, preventScrollReset: true});
  };

  return (
    <div className="relative flex items-center">
      <select
        value={currentSort}
        onChange={handleChange}
        className="h-10 appearance-none rounded-full border border-neutral-300 bg-white pl-4 pr-9 text-sm font-medium text-neutral-800 outline-none transition hover:border-neutral-900 focus:border-neutral-900 cursor-pointer"
      >
        <option value="default">Mais relevantes</option>
        <option value="price_asc">Menor preço</option>
        <option value="price_desc">Maior preço</option>
      </select>
      <CaretDownIcon className="pointer-events-none absolute right-3 h-4 w-4 text-neutral-500" />
    </div>
  );
}

function ActiveFiltersCount() {
  const {items} = useCurrentRefinements();
  const count = items.reduce((acc, item) => acc + item.refinements.length, 0);
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-950 px-1.5 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}

function FullSearchToolbar({
  onOpenFilters,
  indexName,
}: {
  onOpenFilters: () => void;
  indexName: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
        {/* Mobile: botão filtros + stats */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white lg:hidden"
          >
            <FadersHorizontalIcon className="h-4 w-4" />
            Filtros
            <ActiveFiltersCount />
          </button>

          <Stats
            translations={{
              rootElementText({nbHits}) {
                return `${nbHits.toLocaleString('pt-BR')} produto${nbHits !== 1 ? 's' : ''} encontrado${nbHits !== 1 ? 's' : ''}`;
              },
            }}
            classNames={{root: 'text-sm text-neutral-500'}}
          />
        </div>

        {/* Ordenar por */}
        <SortBySelect />
      </div>

      {/* Filtros ativos como pills */}
      <CurrentRefinements
        classNames={{
          root: '',
          list: 'flex flex-wrap gap-2',
          item: '',
          label: 'hidden',
          category: 'inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800',
          categoryLabel: '',
          delete: 'ml-1 text-neutral-400 hover:text-neutral-900 transition',
        }}
      />
    </div>
  );
}

function FilterBlock({title, children}: {title: string; children: React.ReactNode}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-neutral-900">{title}</span>
        <CaretRightIcon
          className={`h-4 w-4 text-neutral-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && <div className="border-t border-neutral-100 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

function FiltersSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const content = (
    <div className="space-y-3">
      {/* Mobile header */}
      <div className="flex items-center justify-between pb-2 lg:hidden">
        <h3 className="text-base font-semibold text-neutral-950">Filtros</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:border-neutral-900 transition"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <FilterBlock title="Categorias">
        <HierarchicalMenu
          attributes={['categories.lvl0', 'categories.lvl1', 'categories.lvl2']}
          classNames={{
            list: 'space-y-1',
            item: 'text-sm',
            link: 'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950',
            selectedItem: '[&>a]:font-semibold [&>a]:text-neutral-950 [&>a]:bg-neutral-100',
            count: 'rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 tabular-nums',
            childList: 'ml-3 mt-1 border-l border-neutral-200 pl-3 space-y-1',
          }}
        />
      </FilterBlock>

      <FilterBlock title="Marca">
        <RefinementList
          attribute="brand"
          limit={8}
          showMore
          translations={{
            showMoreButtonText({isShowingMore}) {
              return isShowingMore ? 'Ver menos' : 'Ver mais';
            },
          }}
          classNames={{
            list: 'space-y-1',
            item: '',
            label: 'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-50',
            selectedItem: '[&>label]:font-medium [&>label]:text-neutral-950',
            checkbox: 'sr-only',
            labelText: 'flex-1',
            count: 'rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 tabular-nums',
            showMore: 'mt-3 flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition uppercase tracking-wider',
          }}
        />
      </FilterBlock>

      <FilterBlock title="Faixa de preço">
        <RangeInput
          attribute="price"
          classNames={{
            root: 'space-y-3',
            form: 'flex items-center gap-2',
            input: 'h-10 w-full rounded-full border border-neutral-300 px-4 text-sm outline-none focus:border-neutral-900 tabular-nums',
            separator: 'text-neutral-400 text-sm',
            submit: 'inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:opacity-80',
          }}
          translations={{submitButtonText: 'Ir', separatorElementText: 'até'}}
        />
      </FilterBlock>

      <ClearRefinements
        translations={{resetButtonText: 'Limpar todos os filtros'}}
        classNames={{
          button: 'inline-flex w-full items-center justify-center rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-900 hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-30',
        }}
      />
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block">{!mobileOpen && content}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-neutral-50 p-4 shadow-2xl">
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}

function FullResults({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const {hits: rawHits, showMore, isLastPage} = useInfiniteHits<HitItem>();
  const {status} = useInstantSearch();
  const isLoading = status === 'loading' || status === 'stalled';
  const {ref: sentinelRef, inView} = useInView({threshold: 0, rootMargin: '300px'});

  // Auto-load next page when sentinel enters viewport
  useEffect(() => {
    if (inView && !isLastPage && !isLoading) {
      showMore();
    }
  }, [inView, isLastPage, isLoading, showMore]);

  // Sort: out-of-stock products always go to the end
  const hits = [...rawHits].sort((a, b) => {
    const outA =
      a.available === false || (typeof a.inventory_quantity === 'number' && a.inventory_quantity === 0) ? 1 : 0;
    const outB =
      b.available === false || (typeof b.inventory_quantity === 'number' && b.inventory_quantity === 0) ? 1 : 0;
    return outA - outB;
  });

  // Show empty state only when truly finished loading with no results
  if (!isLoading && hits.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Mantém os cards montados durante loading — apenas reduz opacidade */}
      <ul
        className={`grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 transition-opacity duration-150 ${
          isLoading ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        {hits.map((hit) => (
          <li key={hit.objectID} className="h-full">
            <ProductHit hit={hit} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>

      {/* Sentinel: triggers load of next page when scrolled into view */}
      {!isLastPage && (
        <div ref={sentinelRef} className="h-8 w-full" aria-hidden="true" />
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          Carregando mais produtos...
        </div>
      )}
    </>
  );
}

function FullMode({
  onNavigate,
  indexName,
}: {
  onNavigate?: () => void;
  indexName: string;
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <FiltersSidebar
        mobileOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      />

      <div className="space-y-5">
        <FullSearchToolbar
          onOpenFilters={() => setMobileFiltersOpen(true)}
          indexName={indexName}
        />
        <FullResults onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function OverlayMode({
  minQueryLength,
  initialQuery,
  onNavigate,
  onSearchPageNavigate,
  maxPreviewHits,
}: {
  minQueryLength: number;
  initialQuery?: string;
  onNavigate?: () => void;
  onSearchPageNavigate?: (query: string) => void;
  maxPreviewHits: number;
}) {
  const [overlayQuery, setOverlayQuery] = useState(initialQuery || '');

  useEffect(() => {
    setOverlayQuery(initialQuery || '');
  }, [initialQuery]);

  return (
    <div className="space-y-6">
      <SearchQuerySync query={overlayQuery} minLength={minQueryLength} />

      <div className="md:pt-8">
        <AlgoliaSearchBox
          autoFocus
          minLength={minQueryLength}
          initialValue={initialQuery || ''}
          placeholder="Buscar produtos, marcas e muito mais..."
          onSubmit={onSearchPageNavigate}
          onValueChange={setOverlayQuery}
        />
      </div>

      <Configure hitsPerPage={maxPreviewHits} distinct />

      <AlgoliaHitsPreview
        minLength={minQueryLength}
        currentQuery={overlayQuery}
        onNavigate={onNavigate}
        onShowAll={onSearchPageNavigate}
      />
    </div>
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
  onSearchPageNavigate,
  initialQuery = '',
}: AlgoliaSearchProps) {
  // Sort gerenciado pela URL — completamente fora do react-instantsearch
  const [searchParams] = useSearchParams();
  const sortParam = mode === 'full' ? (searchParams.get('sort') || '') : '';
  const activeIndex =
    sortParam === 'price_asc'
      ? `${indexName}_price_asc`
      : sortParam === 'price_desc'
        ? `${indexName}_price_desc`
        : indexName;

  const searchClient = useMemo(() => {
    return algoliasearch(appId, searchKey) as any;
  }, [appId, searchKey]);

  if (!appId || !searchKey || !indexName) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Configure corretamente as variáveis do Algolia para exibir a busca.
      </div>
    );
  }

  return (
    // key muda quando o sort muda → InstantSearch remonta com o índice correto
    // Isso garante que o sort NUNCA reverta — o índice vem da URL, não de estado interno
    <InstantSearch
      key={activeIndex}
      searchClient={searchClient}
      indexName={activeIndex}
      stalledSearchDelay={500}
    >
      {mode === 'overlay' ? (
        <OverlayMode
          minQueryLength={minQueryLength}
          initialQuery={initialQuery}
          onNavigate={onNavigate}
          onSearchPageNavigate={onSearchPageNavigate}
          maxPreviewHits={8}
        />
      ) : (
        <>
          <SearchQuerySync query={initialQuery} />
          <Configure hitsPerPage={12} distinct />
          <FullMode onNavigate={onNavigate} indexName={indexName} />
        </>
      )}
    </InstantSearch>
  );
}