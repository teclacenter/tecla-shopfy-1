import {
  getAdjacentAndFirstAvailableVariants,
  ShopPayButton,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useState } from "react";
import { useLoaderData } from "react-router";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { isCombinedListing } from "~/utils/combined-listings";
import { useProductQtyStore } from "./product-quantity-selector";

const FRENET_PROXY = "https://frenet-proxy.mateus-9ab.workers.dev/";
const SELLER_CEP = "29167650";
const DEFAULT_ALTURA = 17;
const DEFAULT_COMPRIMENTO = 54;
const DEFAULT_LARGURA = 43;
const DEFAULT_PESO = 1;

interface ShippingOption {
  ServiceDescription: string;
  Carrier: string;
  ShippingPrice: number;
  DeliveryTime: number;
  Error: string | null;
}

function maskCep(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .substring(0, 9);
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface ProductATCButtonsProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  addToCartText: string;
  addBundleToCartText: string;
  soldOutText: string;
  showShopPayButton: boolean;
}

export default function ProductATCButtons(props: ProductATCButtonsProps) {
  const {
    ref,
    addToCartText,
    addBundleToCartText,
    soldOutText,
    showShopPayButton,
    ...rest
  } = props;
  const { product, storeDomain } = useLoaderData<typeof productRouteLoader>();
  const { quantity } = useProductQtyStore();

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Shipping calculator state
  const [cep, setCep] = useState("");
  const [calcStatus, setCalcStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const combinedListing = isCombinedListing(product);
  const isBundle = Boolean(product?.isBundle?.requiresComponents);

  if (!product || combinedListing) return null;

  const price = selectedVariant?.price?.amount;
  if (!price || Number(price) === 0) return null;

  let atcButtonText = "Adicionar ao carrinho";
  if (selectedVariant.availableForSale) {
    atcButtonText = isBundle ? addBundleToCartText : addToCartText;
  } else {
    atcButtonText = soldOutText;
  }

  // Dimensions from metafields
  const dims = (product as any).frenetDimensions as
    | { key: string; value: string }[]
    | null;
  const getDim = (key: string, fallback: number) => {
    if (!dims || !Array.isArray(dims)) return fallback;
    const found = dims.find((m) => m != null && m.key === key);
    return Number(found?.value ?? fallback);
  };
  const altura = getDim("altura", DEFAULT_ALTURA);
  const comprimento = getDim("comprimento", DEFAULT_COMPRIMENTO);
  const largura = getDim("largura", DEFAULT_LARGURA);

  const weightRaw = (selectedVariant as any).weight as number | null;
  const weightUnit = (selectedVariant as any).weightUnit as string | null;
  let pesoKg = weightRaw ?? DEFAULT_PESO;
  if (weightUnit === "GRAMS") pesoKg = pesoKg / 1000;
  if (weightUnit === "POUNDS") pesoKg = pesoKg * 0.453592;
  if (weightUnit === "OUNCES") pesoKg = pesoKg * 0.0283495;

  const valor = Number(selectedVariant.price?.amount ?? 0);

  async function handleCalc() {
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) {
      setErrorMsg("Informe um CEP válido com 8 dígitos.");
      setCalcStatus("error");
      return;
    }
    setCalcStatus("loading");
    setShippingOptions([]);
    setErrorMsg("");
    try {
      const res = await fetch(FRENET_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          SellerCEP: SELLER_CEP,
          RecipientCEP: rawCep,
          ShipmentInvoiceValue: valor,
          ShippingServiceCode: null,
          ShippingItemArray: [
            {
              Height: altura,
              Length: comprimento,
              Width: largura,
              Weight: pesoKg,
              Quantity: 1,
              SKU: selectedVariant.sku ?? "",
            },
          ],
          RecipientCountry: "BR",
        }),
      });
      if (!res.ok) throw new Error("response_error");
      const data = await res.json();
      const list: ShippingOption[] = (data?.ShippingSevicesArray ?? []).filter(
        (s: ShippingOption) => !s.Error,
      );
      if (list.length === 0) {
        setErrorMsg("Nenhuma opção de frete encontrada para este CEP.");
        setCalcStatus("error");
      } else {
        setShippingOptions(list);
        setCalcStatus("success");
      }
    } catch {
      setErrorMsg("Erro ao calcular frete. Tente novamente.");
      setCalcStatus("error");
    }
  }

  return (
    <div ref={ref} {...rest} className="space-y-3 empty:hidden">
      {/* ATC + ShopPay */}
      <AddToCartButton
        disabled={!selectedVariant?.availableForSale}
        lines={[
          {
            merchandiseId: selectedVariant?.id,
            quantity,
            selectedVariant,
          },
        ]}
        data-test="add-to-cart"
        className="w-full uppercase"
      >
        {atcButtonText}
      </AddToCartButton>
      {showShopPayButton && selectedVariant?.availableForSale && (
        <ShopPayButton
          width="100%"
          variantIdsAndQuantities={[{ id: selectedVariant?.id, quantity }]}
          storeDomain={storeDomain}
        />
      )}

      {/* Shipping calculator */}
      <div className="space-y-3 pt-1">
        <p className="text-sm font-semibold text-neutral-700">Calcular frete</p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Digite seu CEP"
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleCalc()}
            className="h-11 flex-1 border border-neutral-300 px-4 text-sm text-neutral-900 focus:border-neutral-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCalc}
            disabled={calcStatus === "loading"}
            className="h-11 bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-60"
          >
            {calcStatus === "loading" ? "..." : "Calcular"}
          </button>
        </div>

        {calcStatus === "error" && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        {calcStatus === "success" && shippingOptions.length > 0 && (
          <ul className="space-y-2">
            {shippingOptions.map((opt, i) => {
              const isFree = opt.ShippingPrice === 0;
              return (
                <li
                  key={i}
                  className="flex items-start justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-neutral-900">
                      {opt.ServiceDescription}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {opt.Carrier} · Prazo: {opt.DeliveryTime} dia(s) útil(eis)
                    </p>
                  </div>
                  <span
                    className={
                      isFree
                        ? "shrink-0 font-bold text-green-600"
                        : "shrink-0 font-semibold text-neutral-900"
                    }
                  >
                    {isFree ? "GRÁTIS" : formatBRL(opt.ShippingPrice)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export const schema = createSchema({
  type: "mp--atc-buttons",
  title: "Buy buttons",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "text",
          label: "Add to cart text",
          name: "addToCartText",
          defaultValue: "Adicionar ao carrinho",
          placeholder: "Adicionar ao carrinho",
        },
        {
          type: "text",
          label: "Bundle add to cart text",
          name: "addBundleToCartText",
          defaultValue: "Adicionar kit ao carrinho",
          placeholder: "Adicionar kit ao carrinho",
          helpText:
            "Apply if the product is a bundled product. Learn more about <a href='https://shopify.dev/docs/apps/build/product-merchandising/bundles' target='_blank'>Shopify product bundles</a>.",
        },
        {
          type: "text",
          label: "Sold out text",
          name: "soldOutText",
          defaultValue: "Esgotado",
          placeholder: "Esgotado",
        },
        {
          type: "switch",
          label: "Show Shop Pay button",
          name: "showShopPayButton",
          defaultValue: true,
        },
      ],
    },
  ],
});
