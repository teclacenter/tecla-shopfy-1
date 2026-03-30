import { mapSelectedProductOptionToObject } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import { useViewTransitionState } from "react-router";
import type {
  ProductCardFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { Spinner } from "~/components/spinner";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import JudgemeStarsRating from "~/sections/main-product/judgeme-stars-rating";
import {
  type BadgeStyleSettings,
  BestSellerBadge,
  BundleBadge,
  NewBadge,
  SaleBadge,
  SoldOutBadge,
} from "./badges";
import { QuickShopTrigger } from "./quick-shop";

// ─── Price Block ─────────────────────────────────────────────────────────────

function formatBRL(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function ProductPriceBlock({ minVariantPrice }: { minVariantPrice: MoneyV2 }) {
  const amount = parseFloat(minVariantPrice.amount);
  if (!amount || !Number.isFinite(amount)) return <div className="h-12" />;
  const pixAmount = amount * 0.9;
  return (
    <div className="space-y-1">
      <p className="text-base font-semibold leading-5 text-neutral-950 md:text-lg">
        {formatBRL(amount)} até 12X
      </p>
      <p className="text-sm font-medium leading-5 text-neutral-700 md:text-[15px]">
        {formatBRL(pixAmount)} à vista no Pix
      </p>
    </div>
  );
}

// ─── Variant Summary ─────────────────────────────────────────────────────────

function ProductVariantSummary({ product }: { product: ProductCardFragment }) {
  const groups = product.options
    .filter((opt) => opt.optionValues && opt.optionValues.length > 1)
    .map((opt) => ({
      label: opt.name,
      values: opt.optionValues.map((v: { name: string }) => v.name),
    }));

  if (!groups.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.values.slice(0, 6).map((value: string) => (
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

// ─── Product Card ─────────────────────────────────────────────────────────────

export function ProductCard({
  product,
  className,
  aboveTheFold,
}: {
  product: ProductCardFragment;
  className?: string;
  aboveTheFold?: boolean;
}) {
  const {
    pcardBorderRadius,
    pcardShowImageOnHover,
    pcardShowReviews,
    pcardEnableQuickShop,
    pcardShowQuickShopOnHover,
    pcardQuickShopButtonType,
    pcardQuickShopButtonText,
    pcardQuickShopPanelType,
    pcardShowSaleBadge,
    pcardShowBundleBadge,
    pcardShowBestSellerBadge,
    pcardShowNewBadge,
    pcardShowOutOfStockBadge,
    colorText,
    colorTextInverse,
    badgeBorderRadius,
    badgeTextTransform,
    newBadgeText,
    newBadgeColor,
    newBadgeDaysOld,
    bestSellerBadgeText,
    bestSellerBadgeColor,
    soldOutBadgeText,
    soldOutBadgeColor,
    bundleBadgeText,
    bundleBadgeColor,
    saleBadgeText,
    saleBadgeColor,
  } = useThemeSettings();

  const badgeStyle: BadgeStyleSettings = {
    colorText,
    colorTextInverse,
    badgeBorderRadius,
    badgeTextTransform,
  };

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const productPageHref = usePrefixPathWithLocale(
    `/products/${product.handle}`,
  );
  const isTransitioning = useViewTransitionState(productPageHref);

  const { images, badges, priceRange } = product;
  const { minVariantPrice } = priceRange;

  const firstVariant = product.selectedOrFirstAvailableVariant;
  const params = new URLSearchParams(
    mapSelectedProductOptionToObject(
      (selectedVariant || firstVariant)?.selectedOptions || [],
    ),
  );

  const isBestSellerProduct = badges
    .filter(Boolean)
    .some(({ key, value }) => key === "best_seller" && value === "true");
  const isBundle = Boolean(product?.isBundle?.requiresComponents);

  let [image, secondImage] = images.nodes;
  if (selectedVariant?.image) {
    image = selectedVariant.image;
    const imageUrl = image.url;
    const imageIndex = images.nodes.findIndex(({ url }) => url === imageUrl);
    if (imageIndex > 0 && imageIndex < images.nodes.length - 1) {
      secondImage = images.nodes[imageIndex + 1];
    }
  }

  const productUrl = `/products/${product.handle}?${params.toString()}`;
  const radius = pcardBorderRadius ?? 28;

  return (
    <div
      className={clsx(
        "group flex h-full flex-col overflow-hidden border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)]",
        "rounded-(--pcard-radius)",
        className,
      )}
      style={{ "--pcard-radius": `${radius}px` } as React.CSSProperties}
    >
      {/* ── Image ── */}
      <div className="relative">
        <Link
          to={productUrl}
          prefetch="intent"
          className="relative flex aspect-square items-center justify-center overflow-hidden bg-neutral-50"
        >
          {isImageLoading && <Spinner className="absolute inset-0 bg-neutral-50" />}

          {image ? (
            <Image
              className={clsx(
                "p-5 md:p-6 [&_img]:!object-contain transition duration-300 group-hover:scale-[1.03]",
                pcardShowImageOnHover &&
                  secondImage &&
                  "transition-opacity duration-300 group-hover:opacity-0",
                isTransitioning && "[&_img]:[view-transition-name:image-expand]",
              )}
              sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
              data={image}
              width={700}
              alt={image.altText || `Picture of ${product.title}`}
              loading={aboveTheFold ? "eager" : "lazy"}
              onLoad={() => setIsImageLoading(false)}
            />
          ) : (
            <div className="h-full w-full rounded-2xl bg-neutral-100" />
          )}

          {pcardShowImageOnHover && secondImage && (
            <Image
              className="absolute inset-0 p-5 md:p-6 [&_img]:!object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-neutral-50"
              sizes="auto"
              width={700}
              data={secondImage}
              alt={secondImage.altText || `Second picture of ${product.title}`}
              loading="lazy"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 right-2.5 flex gap-1">
          {isBundle && pcardShowBundleBadge && (
            <BundleBadge
              badgeStyle={badgeStyle}
              bundleBadgeText={bundleBadgeText}
              bundleBadgeColor={bundleBadgeColor}
            />
          )}
          {pcardShowSaleBadge && (
            <SaleBadge
              price={(selectedVariant || firstVariant)?.price as MoneyV2}
              compareAtPrice={
                (selectedVariant || firstVariant)?.compareAtPrice as MoneyV2
              }
              badgeStyle={badgeStyle}
              saleBadgeText={saleBadgeText}
              saleBadgeColor={saleBadgeColor}
            />
          )}
          {pcardShowBestSellerBadge && isBestSellerProduct && (
            <BestSellerBadge
              badgeStyle={badgeStyle}
              bestSellerBadgeText={bestSellerBadgeText}
              bestSellerBadgeColor={bestSellerBadgeColor}
            />
          )}
          {pcardShowNewBadge && (
            <NewBadge
              publishedAt={product.publishedAt}
              badgeStyle={badgeStyle}
              newBadgeText={newBadgeText}
              newBadgeColor={newBadgeColor}
              newBadgeDaysOld={newBadgeDaysOld}
            />
          )}
          {pcardShowOutOfStockBadge && (
            <SoldOutBadge
              badgeStyle={badgeStyle}
              soldOutBadgeText={soldOutBadgeText}
              soldOutBadgeColor={soldOutBadgeColor}
            />
          )}
        </div>

        {pcardEnableQuickShop && (
          <QuickShopTrigger
            productHandle={product.handle}
            showOnHover={pcardShowQuickShopOnHover}
            buttonType={pcardQuickShopButtonType}
            buttonText={pcardQuickShopButtonText}
            panelType={pcardQuickShopPanelType}
          />
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col p-4 md:p-5">
        {pcardShowReviews && (
          <div className="mt-1 min-h-[18px]">
            <JudgemeStarsRating
              productHandle={product.handle}
              ratingText="{{rating}} ({{total_reviews}} reviews)"
              errorText=""
            />
          </div>
        )}

        <Link
          to={productUrl}
          prefetch="intent"
          className="mt-1 line-clamp-2 min-h-[44px] text-sm font-medium leading-5 text-neutral-900 md:text-[15px]"
        >
          {product.title}
        </Link>

        <ProductVariantSummary product={product} />

        <div className="mt-auto pt-4">
          <ProductPriceBlock minVariantPrice={minVariantPrice as MoneyV2} />
        </div>
      </div>
    </div>
  );
}
