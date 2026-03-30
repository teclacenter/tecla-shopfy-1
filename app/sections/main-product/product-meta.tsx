import {
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData } from "react-router";
import type { loader as productRouteLoader } from "~/routes/products/product";

interface ProductMetaProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
}

export default function ProductMeta(props: ProductMetaProps) {
  const { ref, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  if (!product) return null;

  const sku = selectedVariant?.sku;
  const available = selectedVariant?.availableForSale;

  return (
    <div ref={ref} {...rest} className="space-y-2 text-sm">
      {/* Disponibilidade */}
      <div className="flex items-center gap-2">
        <span
          className={[
            "inline-block h-2.5 w-2.5 rounded-full",
            available ? "bg-green-500" : "bg-red-500",
          ].join(" ")}
        />
        <span className={available ? "text-green-700" : "text-red-600"}>
          {available ? "Em estoque" : "Fora de estoque"}
        </span>
      </div>

      {/* SKU */}
      {sku && (
        <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
          <span className="text-neutral-500">SKU</span>
          <span className="font-medium text-neutral-900">{sku}</span>
        </div>
      )}
    </div>
  );
}

export const schema = createSchema({
  type: "mp--meta",
  title: "SKU & Disponibilidade",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [],
});
