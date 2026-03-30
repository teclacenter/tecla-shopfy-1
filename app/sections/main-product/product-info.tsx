import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ProductInfoProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
}

export default function ProductInfo(props: ProductInfoProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest}>
      <div
        className="sticky flex flex-col justify-start gap-5"
        style={{ top: "calc(var(--height-nav) + 20px)" }}
      >
        {children}
      </div>
    </div>
  );
}

export const schema = createSchema({
  type: "mp--info",
  title: "Product Info",
  limit: 1,
  childTypes: [
    "mp--breadcrumb",
    "mp--vendor",
    "mp--title",
    "mp--prices",
    "judgeme-stars-rating",
    "mp--summary",
    "mp--meta",
    "mp--bundled-variants",
    "mp--variant-selector",
    "mp--quantity-selector",
    "mp--atc-buttons",
    "mp--collapsible-details",
  ],
  enabledOn: {
    pages: ["PRODUCT"],
  },
  presets: {
    children: [
      {
        type: "mp--breadcrumb",
        homeText: "Início",
      },
      {
        type: "mp--vendor",
      },
      {
        type: "mp--title",
        headingTag: "h1",
      },
      {
        type: "mp--prices",
        showCompareAtPrice: true,
      },
      {
        type: "judgeme-stars-rating",
      },
      {
        type: "mp--summary",
      },
      {
        type: "mp--meta",
      },
      {
        type: "mp--bundled-variants",
        headingText: "Produtos do Kit",
        headingClassName: "text-2xl",
      },
      {
        type: "mp--variant-selector",
      },
      {
        type: "mp--quantity-selector",
      },
      {
        type: "mp--atc-buttons",
        addToCartText: "Adicionar ao carrinho",
        addBundleToCartText: "Adicionar kit ao carrinho",
        soldOutText: "Esgotado",
        showShopPayButton: true,
        buttonClassName: "w-full uppercase",
      },
      {
        type: "mp--collapsible-details",
        showShippingPolicy: true,
        showRefundPolicy: true,
      },
    ],
  },
});
