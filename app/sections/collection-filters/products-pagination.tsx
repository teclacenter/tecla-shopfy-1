import { FunnelXIcon, XIcon } from "@phosphor-icons/react";
import { Pagination } from "@shopify/hydrogen";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import type {
  CollectionQuery,
  ProductCardFragment,
} from "storefront-api.generated";
import Link from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import type { AppliedFilter } from "~/types/others";
import {
  COMBINED_LISTINGS_CONFIGS,
  isCombinedListing,
} from "~/utils/combined-listings";
import { getAppliedFilterLink } from "./filter-utils";

export function ProductsPagination({
  gridSizeDesktop: desktopCols = 3,
  gridSizeMobile: mobileCols = 1,
  loadPrevText,
  loadMoreText,
}: {
  gridSizeDesktop: number;
  gridSizeMobile: number;
  loadPrevText: string;
  loadMoreText: string;
}) {
  const { collection, appliedFilters } = useLoaderData<
    CollectionQuery & {
      collections: Array<{ handle: string; title: string }>;
      appliedFilters: AppliedFilter[];
    }
  >();
  const [params] = useSearchParams();
  const location = useLocation();
  const { pathname } = location;

  return (
    <div className="grow space-y-6">
      {appliedFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            {appliedFilters.map((filter: AppliedFilter) => {
              const { label } = filter;
              return (
                <Link
                  key={label}
                  to={getAppliedFilterLink(filter, params, location)}
                  className="items-center gap-2 border border-line-subtle px-2 py-1 hover:border-line"
                  variant="custom"
                  preventScrollReset
                >
                  <span>{label}</span>
                  <XIcon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
          {appliedFilters.length > 1 ? (
            <Link
              to={pathname}
              variant="underline"
              aria-label="Limpar todos os filtros"
              preventScrollReset
            >
              Limpar filtros
            </Link>
          ) : null}
        </div>
      ) : null}
      {collection.products.nodes.length > 0 ? (
        <Pagination connection={collection.products}>
          {({
            nodes,
            isLoading,
            nextPageUrl,
            hasNextPage,
            hasPreviousPage,
            PreviousLink,
            state,
          }) => (
            <div
              className="flex w-full flex-col items-center gap-8"
              style={
                {
                  "--cols-mobile": `repeat(${mobileCols}, minmax(0, 1fr))`,
                  "--cols-desktop": `repeat(${desktopCols}, minmax(0, 1fr))`,
                } as React.CSSProperties
              }
            >
              {hasPreviousPage && (
                <PreviousLink className="mx-auto px-6 py-2 border border-neutral-300 text-sm">
                  {isLoading ? "Carregando..." : loadPrevText}
                </PreviousLink>
              )}
              <ProductsLoadedOnScroll
                nodes={nodes}
                nextPageUrl={nextPageUrl}
                hasNextPage={hasNextPage}
                state={state}
              />
              {/* Loading indicator */}
              {isLoading && hasNextPage && (
                <div className="flex items-center gap-2 py-4 text-sm text-neutral-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
                  Carregando mais produtos...
                </div>
              )}
            </div>
          )}
        </Pagination>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 pt-20">
          <FunnelXIcon size={50} weight="light" />
          <div className="text-lg">Nenhum produto encontrado com esses filtros.</div>
        </div>
      )}
    </div>
  );
}

interface ProductsLoadedOnScrollProps {
  nodes: any;
  nextPageUrl: string;
  hasNextPage: boolean;
  state: any;
}

function ProductsLoadedOnScroll(props: ProductsLoadedOnScrollProps) {
  const { nodes, nextPageUrl, hasNextPage, state } = props;
  const navigate = useNavigate();
  const { ref, inView } = useInView({ threshold: 0, rootMargin: "200px" });

  // Track last navigated URL to avoid double-firing
  const lastNavUrl = useRef<string | null>(null);

  useEffect(() => {
    if (inView && hasNextPage && nextPageUrl !== lastNavUrl.current) {
      lastNavUrl.current = nextPageUrl;
      navigate(nextPageUrl, {
        replace: true,
        preventScrollReset: true,
        state,
      });
    }
  }, [inView, hasNextPage, nextPageUrl, navigate, state]);

  return (
    <>
      <div
        className={clsx([
          "w-full gap-x-4 gap-y-6 lg:gap-y-10",
          "grid grid-cols-(--cols-mobile) lg:grid-cols-(--cols-desktop)",
        ])}
      >
        {nodes
          .filter(
            (product: ProductCardFragment) =>
              !(
                COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList &&
                isCombinedListing(product)
              ),
          )
          .sort((a: ProductCardFragment, b: ProductCardFragment) => {
            const isOut = (p: ProductCardFragment) => {
              if (p.availableForSale === false) return true;
              const qty = p.selectedOrFirstAvailableVariant?.quantityAvailable;
              return qty !== null && qty !== undefined && qty === 0;
            };
            return (isOut(a) ? 1 : 0) - (isOut(b) ? 1 : 0);
          })
          .map((product: ProductCardFragment, index: number) => (
            <ProductCard
              key={product.id}
              product={product}
              aboveTheFold={index < 4}
            />
          ))}
      </div>
      {/* Sentinel: triggers load of next page when scrolled into view */}
      {hasNextPage && (
        <div ref={ref} className="h-8 w-full" aria-hidden="true" />
      )}
    </>
  );
}
