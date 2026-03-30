import {createSchema} from '@weaverse/hydrogen';
import type {HydrogenComponentProps} from '@weaverse/hydrogen';
import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {JudgemeProductStars} from '~/components/judgeme-product-stars';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecommendModel =
  | 'trending-items'
  | 'recently-viewed'
  | 'related-products'
  | 'bought-together'
  | 'looking-similar';

const PRODUCT_MODELS: RecommendModel[] = ['related-products', 'bought-together', 'looking-similar'];

interface AlgoliaRecommendProps extends HydrogenComponentProps {
  title?: string;
  model?: RecommendModel;
  productObjectId?: string;
  maxItems?: string;
  appId?: string;
  searchKey?: string;
  indexName?: string;
  sectionPaddingTop?: string;
  sectionPaddingBottom?: string;
}

interface ProductHit {
  objectID: string;
  title?: string;
  handle?: string;
  product_handle?: string;
  image?: string;
  brand?: string;
  vendor?: string;
  meta?: {magento?: {marca?: string}; [key: string]: unknown};
  price?: string | number;
  min_price?: string | number;
  max_price?: string | number;
  price_min?: string | number;
  price_max?: string | number;
  has_variants?: boolean;
  variants_count?: number;
  option_names?: string[];
  options?: Record<string, string | string[]>;
  variant_options?: Record<string, string | string[]>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RECENTLY_VIEWED_KEY = 'tc_recently_viewed';
const MAX_RECENTLY_VIEWED = 20;

export function trackProductView(objectID: string) {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]') as string[];
    const updated = [objectID, ...stored.filter((id) => id !== objectID)].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
}

function getRecentlyViewedIDs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatPrice(value?: number | null) {
  if (!value || !Number.isFinite(value)) return '';
  return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(value);
}

function normalizeValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map((i) => String(i).trim()).filter(Boolean))];
  }
  if (typeof value === 'string') {
    return [...new Set(value.split(/[,|;/]/).map((i) => i.trim()).filter(Boolean))];
  }
  return [];
}

function prettifyLabel(label: string) {
  const n = label.replace(/[_-]+/g, ' ').trim().toLowerCase();
  if (n.includes('cor')) return 'Cor';
  if (n.includes('kit')) return 'Kit';
  if (n.includes('tamanho') || n.includes('size')) return 'Tamanho';
  if (n.includes('tecnologia')) return 'Tecnologia';
  return n.charAt(0).toUpperCase() + n.slice(1);
}

function canonicalKey(key: string) {
  return key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]+/g, ' ');
}

function toShopifyOptionName(key: string) {
  const c = canonicalKey(key);
  if (c === 'cor') return 'Cor';
  if (c === 'tecnologia') return 'Tecnologia';
  if (c === 'tamanho da cauda') return 'Tamanho da Cauda';
  if (c.includes('kit')) return 'Kit';
  return key.trim().replace(/[_-]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getFirstCleanValue(value: string | string[]) {
  if (Array.isArray(value)) return value.find((i) => String(i).trim())?.trim() ?? '';
  return String(value).trim();
}

function getVariantGroups(hit: ProductHit) {
  const groups: {label: string; values: string[]}[] = [];
  const push = (label: string, raw: unknown) => {
    const values = normalizeValues(raw);
    if (values.length) groups.push({label: prettifyLabel(label), values});
  };

  if (Array.isArray(hit.option_names) && hit.options) {
    hit.option_names.forEach((name) => push(name, hit.options?.[name]));
  } else if (hit.options) {
    Object.entries(hit.options).forEach(([k, v]) => push(k, v));
  }
  if (hit.variant_options) {
    Object.entries(hit.variant_options).forEach(([k, v]) => push(k, v));
  }

  const merged = new Map<string, Set<string>>();
  groups.forEach(({label, values}) => {
    const key = label.toLowerCase();
    if (!merged.has(key)) merged.set(key, new Set());
    values.forEach((v) => merged.get(key)!.add(v));
  });

  return Array.from(merged.entries()).map(([key, vals]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    values: Array.from(vals),
  }));
}

function getPriceModel(hit: ProductHit) {
  const min = toNumber(hit.min_price) ?? toNumber(hit.price_min) ?? toNumber(hit.price);
  const max = toNumber(hit.max_price) ?? toNumber(hit.price_max) ?? toNumber(hit.price);
  if (min === null) return null;
  const isConfigurable =
    hit.has_variants === true ||
    (typeof hit.variants_count === 'number' && hit.variants_count > 1) ||
    (max !== null && max > (min ?? 0));
  return {isConfigurable, min, max, pixValue: min * 0.9};
}

function buildUrl(hit: ProductHit) {
  const handle = hit.handle || hit.product_handle;
  if (!handle) return '#';
  const params = new URLSearchParams();
  const seen = new Set<string>();
  if (hit.options) {
    Object.entries(hit.options).forEach(([rawKey, rawVal]) => {
      const c = canonicalKey(rawKey);
      const val = getFirstCleanValue(rawVal);
      if (!val || seen.has(c)) return;
      seen.add(c);
      params.set(toShopifyOptionName(rawKey), val);
    });
  }
  const qs = params.toString();
  return qs ? `/products/${handle}?${qs}` : `/products/${handle}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VariantSummary({hit}: {hit: ProductHit}) {
  const groups = getVariantGroups(hit);
  if (!groups.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.values.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-700"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PriceBlock({hit}: {hit: ProductHit}) {
  const model = getPriceModel(hit);
  if (!model) return <div className="h-7" />;
  return (
    <div className="pt-1">
      <p className="text-base font-semibold leading-5 text-neutral-950">
        {model.isConfigurable ? `A partir de ${formatPrice(model.min)}` : `${formatPrice(model.min)} até 12X`}
      </p>
      <p className="mt-1 text-sm font-medium leading-5 text-neutral-700">
        {formatPrice(model.pixValue)} à vista no Pix
      </p>
    </div>
  );
}

function ProductCard({hit}: {hit: ProductHit}) {
  return (
    <Link
      to={buildUrl(hit)}
      className="group flex-shrink-0 overflow-hidden rounded-3xl border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
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
        {(hit.handle || hit.product_handle) ? (
          <div className="min-h-[18px]">
            <JudgemeProductStars productHandle={(hit.handle || hit.product_handle) as string} />
          </div>
        ) : null}
        <p className="line-clamp-2 min-h-[44px] text-sm font-medium leading-5 text-neutral-900 md:text-[15px]">
          {hit.title || 'Produto'}
        </p>
        <VariantSummary hit={hit} />
        <PriceBlock hit={hit} />
      </div>
    </Link>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function AlgoliaRecommend(props: AlgoliaRecommendProps) {
  const {
    title,
    model = 'trending-items',
    productObjectId,
    maxItems,
    appId,
    searchKey,
    indexName,
    sectionPaddingTop,
    sectionPaddingBottom,
    ...rest
  } = props;

  const finalAppId = appId || '7YY9HNWQYA';
  const finalSearchKey = searchKey || 'a3da6b0051f3ea3e5f1367314a65a91e';
  const finalIndexName = indexName || 'shopify_products';
  const finalMax = Number(maxItems || 8);
  const paddingTop = Number(sectionPaddingTop || 48);
  const paddingBottom = Number(sectionPaddingBottom || 48);
  const needsProduct = PRODUCT_MODELS.includes(model);

  const [hits, setHits] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(true);
  // objectID resolvido: manual (Weaverse) ou auto-detectado pela URL
  const [resolvedObjectId, setResolvedObjectId] = useState<string>('');

  // Auto-detecta o objectID do produto pela URL (/products/:handle → busca no Algolia)
  useEffect(() => {
    if (!needsProduct) return;
    if (productObjectId?.trim()) { setResolvedObjectId(productObjectId.trim()); return; }

    const match = typeof window !== 'undefined'
      ? window.location.pathname.match(/\/products\/([^/?#]+)/)
      : null;
    if (!match) return;

    const handle = match[1];
    fetch(`https://${finalAppId}-dsn.algolia.net/1/indexes/${finalIndexName}/query`, {
      method: 'POST',
      headers: {
        'X-Algolia-Application-Id': finalAppId,
        'X-Algolia-API-Key': finalSearchKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({params: `filters=handle%3A${encodeURIComponent(handle)}&hitsPerPage=1`}),
    })
      .then((r) => r.json())
      .then((d: {hits?: {objectID: string}[]}) => {
        const id = d.hits?.[0]?.objectID;
        if (id) setResolvedObjectId(id);
      })
      .catch(() => {});
  }, [needsProduct, productObjectId, finalAppId, finalSearchKey, finalIndexName]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      // Modelos que precisam de produto: aguarda resolução do objectID
      if (needsProduct && !resolvedObjectId) {
        if (!cancelled) { setHits([]); setLoading(false); }
        return;
      }

      try {
        if (model === 'recently-viewed') {
          const ids = getRecentlyViewedIDs().slice(0, finalMax);
          if (!ids.length) {
            if (!cancelled) { setHits([]); setLoading(false); }
            return;
          }
          const res = await fetch(
            `https://${finalAppId}-dsn.algolia.net/1/indexes/${finalIndexName}/objects`,
            {
              method: 'POST',
              headers: {
                'X-Algolia-Application-Id': finalAppId,
                'X-Algolia-API-Key': finalSearchKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({requests: ids.map((id) => ({indexName: finalIndexName, objectID: id}))}),
            },
          );
          const data = await res.json() as {results?: ProductHit[]};
          if (!cancelled) setHits((data.results ?? []) as ProductHit[]);
        } else {
          const request: Record<string, unknown> = {
            indexName: finalIndexName,
            model,
            maxRecommendations: finalMax,
            threshold: 0,
          };
          if (needsProduct) {
            request.objectID = resolvedObjectId;
          }
          const res = await fetch(
            `https://${finalAppId}-dsn.algolia.net/1/indexes/*/recommendations`,
            {
              method: 'POST',
              headers: {
                'X-Algolia-Application-Id': finalAppId,
                'X-Algolia-API-Key': finalSearchKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({requests: [request]}),
            },
          );
          const data = await res.json() as {results?: {hits: ProductHit[]}[]};
          if (!cancelled) setHits((data.results?.[0]?.hits ?? []) as ProductHit[]);
        }
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [model, resolvedObjectId, needsProduct, finalMax, finalAppId, finalSearchKey, finalIndexName]);

  return (
    <section
      {...rest}
      style={{paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px`}}
      className={!loading && !hits.length ? 'hidden' : 'w-full bg-white'}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-10">
        {title ? (
          <h2 className="mb-6 text-2xl font-semibold text-neutral-900 md:mb-8 md:text-3xl">
            {title}
          </h2>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-neutral-100 bg-neutral-50">
                <div className="aspect-square rounded-t-3xl bg-neutral-200" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-1/3 rounded bg-neutral-200" />
                  <div className="h-4 w-full rounded bg-neutral-200" />
                  <div className="h-4 w-2/3 rounded bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile: scroll horizontal */}
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 lg:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {hits.map((hit) => (
                <div key={hit.objectID} className="w-[calc(50vw-24px)] flex-shrink-0 snap-start">
                  <ProductCard hit={hit} />
                </div>
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="hidden lg:grid lg:grid-cols-4 lg:gap-5">
              {hits.map((hit) => (
                <ProductCard key={hit.objectID} hit={hit} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export const schema = createSchema({
  title: 'Vitrine Algolia Recommend',
  type: 'algolia-recommend',
  settings: [
    {
      group: 'Configuração',
      inputs: [
        {
          type: 'text',
          name: 'title',
          label: 'Título da vitrine',
          defaultValue: 'Recomendado para você',
        },
        {
          type: 'select',
          name: 'model',
          label: 'Tipo de vitrine',
          defaultValue: 'trending-items',
          configs: {
            options: [
              {value: 'trending-items', label: 'Trending (mais vistos)'},
              {value: 'recently-viewed', label: 'Visualizados recentemente'},
              {value: 'related-products', label: 'Produtos relacionados'},
              {value: 'bought-together', label: 'Comprados juntos'},
              {value: 'looking-similar', label: 'Produtos similares'},
            ],
          },
        },
        {
          type: 'text',
          name: 'productObjectId',
          label: 'ID do produto (Algolia objectID)',
          placeholder: 'Ex: shopify_products_7654321',
          helpText: 'Obrigatório para: Relacionados, Comprados juntos e Similares. Copie o objectID do produto no painel do Algolia.',
        },
        {
          type: 'text',
          name: 'maxItems',
          label: 'Máximo de produtos',
          defaultValue: '8',
        },
        {
          type: 'text',
          name: 'sectionPaddingTop',
          label: 'Padding superior (px)',
          defaultValue: '48',
        },
        {
          type: 'text',
          name: 'sectionPaddingBottom',
          label: 'Padding inferior (px)',
          defaultValue: '48',
        },
      ],
    },
    {
      group: 'Algolia (avançado)',
      inputs: [
        {
          type: 'text',
          name: 'appId',
          label: 'App ID',
          defaultValue: '7YY9HNWQYA',
        },
        {
          type: 'text',
          name: 'searchKey',
          label: 'Search API Key',
          defaultValue: 'a3da6b0051f3ea3e5f1367314a65a91e',
        },
        {
          type: 'text',
          name: 'indexName',
          label: 'Nome do índice',
          defaultValue: 'shopify_products',
        },
      ],
    },
  ],
});
