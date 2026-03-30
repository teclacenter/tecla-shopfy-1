import {Link} from 'react-router';
import {useHits, useInstantSearch, useSearchBox} from 'react-instantsearch';

type HitItem = {
  objectID: string;
  title?: string;
  handle?: string;
  product_handle?: string;
  image?: string;
  price?: string | number;
  min_price?: string | number;
  max_price?: string | number;
  price_min?: string | number;
  price_max?: string | number;
  brand?: string;
  vendor?: string;
  has_variants?: boolean;
  variants_count?: number;
  option_names?: string[];
  options?: Record<string, string | string[]>;
  variant_options?: Record<string, string | string[]>;
};

type Props = {
  minLength?: number;
  currentQuery?: string;
  onNavigate?: () => void;
  onShowAll?: (query: string) => void;
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
  if (normalized.includes('tecnologia')) return 'Tecnologia';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

function getVariantGroups(hit: HitItem) {
  const groups: Array<{label: string; values: string[]}> = [];

  const pushGroup = (label: string, rawValue: unknown) => {
    const values = normalizeValues(rawValue);
    if (values.length) {
      groups.push({
        label: prettifyOptionLabel(label),
        values,
      });
    }
  };

  if (Array.isArray(hit.option_names) && hit.options && typeof hit.options === 'object') {
    hit.option_names.forEach((optionName) => {
      pushGroup(optionName, hit.options?.[optionName]);
    });
  } else if (hit.options && typeof hit.options === 'object') {
    Object.entries(hit.options).forEach(([key, value]) => {
      pushGroup(key, value);
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

  if (min === null) return null;

  return {
    isConfigurable,
    min,
    max,
    pixValue: min * 0.9,
  };
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

function VariantSummary({hit}: {hit: HitItem}) {
  const groups = getVariantGroups(hit);

  if (!groups.length) return null;

  return (
    <div className="mt-2 space-y-2">
      {groups.map((group) => (
        <div key={`${group.label}-${group.values.join('-')}`}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {group.label}
          </p>

          <div className="flex flex-wrap gap-1">
            {group.values.map((value) => (
              <span
                key={value}
                className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-700"
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

function PriceBlock({hit}: {hit: HitItem}) {
  const model = getPriceModel(hit);

  if (!model) {
    return <div className="h-7" />;
  }

  if (model.isConfigurable) {
    return (
      <div className="pt-1">
        <p className="text-base font-semibold leading-5 text-neutral-950 md:text-lg">
          A partir de {formatPrice(model.min)}
        </p>
        <p className="mt-1 text-sm font-medium leading-5 text-neutral-700">
          {formatPrice(model.pixValue)} à vista no Pix
        </p>
      </div>
    );
  }

  return (
    <div className="pt-1">
      <p className="text-base font-semibold leading-5 text-neutral-950 md:text-lg">
        {formatPrice(model.min)} até 12X
      </p>
      <p className="mt-1 text-sm font-medium leading-5 text-neutral-700">
        {formatPrice(model.pixValue)} à vista no Pix
      </p>
    </div>
  );
}

export default function AlgoliaHitsPreview({
  minLength = 3,
  currentQuery = '',
  onNavigate,
  onShowAll,
}: Props) {
  const {query} = useSearchBox();
  const effectiveQuery = currentQuery || query;
  const {hits} = useHits<HitItem>();
  const {status} = useInstantSearch();

  const trimmedQuery = effectiveQuery.trim();
  const hasMinQuery = trimmedQuery.length >= minLength;

  if (!hasMinQuery) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        Digite pelo menos {minLength} letras para iniciar a busca.
      </div>
    );
  }

  if (status === 'loading' || status === 'stalled') {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        Buscando produtos...
      </div>
    );
  }

  if (!hits.length) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        Nenhum produto encontrado para <strong>{trimmedQuery}</strong>.
      </div>
    );
  }

  const handleShowAll = () => {
    if (!trimmedQuery) return;

    if (onShowAll) {
      onShowAll(trimmedQuery);
      return;
    }

    onNavigate?.();
  };

  return (
    <div className="space-y-6">
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Busca rápida
          </p>
          <h3 className="mt-1 text-xl font-semibold text-neutral-900">
            Produtos encontrados
          </h3>
        </div>

        <button
          type="button"
          onClick={handleShowAll}
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
        >
          Ver todos
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {hits.slice(0, 8).map((hit, index) => (
          <Link
            key={hit.objectID}
            to={buildProductUrl(hit, trimmedQuery)}
            onClick={onNavigate}
            className={`${index >= 6 ? 'hidden md:block' : ''} group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]`}
          >
            <div className="flex aspect-[1/1] items-center justify-center bg-neutral-50 p-4 md:p-6">
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

            <div className="space-y-2 p-4 md:p-5">
              <div className="min-h-[18px]">
                {(hit.brand || hit.vendor) ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    {hit.brand || hit.vendor}
                  </p>
                ) : null}
              </div>

              <p className="line-clamp-2 min-h-[44px] text-sm font-medium leading-5 text-neutral-900 md:text-[15px]">
                {hit.title || 'Produto'}
              </p>

              <VariantSummary hit={hit} />
              <PriceBlock hit={hit} />
            </div>
          </Link>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white pb-2 pt-2 md:hidden">
        <button
          type="button"
          onClick={handleShowAll}
          className="inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Ver todos os resultados
        </button>
      </div>
    </div>
  );
}