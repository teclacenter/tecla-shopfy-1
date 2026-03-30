import {
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useState } from "react";
import { useLoaderData } from "react-router";
import type { loader as productRouteLoader } from "~/routes/products/product";

const FRENET_PROXY = "https://frenet-proxy.mateus-9ab.workers.dev/";
const SELLER_CEP = "29167650";

// Defaults when metafields are not set
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

interface ProductShippingCalculatorProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
}

export default function ProductShippingCalculator(
  props: ProductShippingCalculatorProps,
) {
  const { ref, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  const [cep, setCep] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  if (!product || !selectedVariant) return null;

  // Dimensions from metafields (frenet namespace)
  const dims = (product as any).frenetDimensions as
    | { key: string; value: string }[]
    | null;
  const getDim = (key: string, fallback: number) =>
    Number(dims?.find((m) => m.key === key)?.value ?? fallback);

  const altura = getDim("altura", DEFAULT_ALTURA);
  const comprimento = getDim("comprimento", DEFAULT_COMPRIMENTO);
  const largura = getDim("largura", DEFAULT_LARGURA);

  // Weight: Storefront API returns kg. Frenet expects kg.
  const weightRaw = (selectedVariant as any).weight as number | null;
  const weightUnit = (selectedVariant as any).weightUnit as string | null;
  let pesoKg = weightRaw ?? DEFAULT_PESO;
  // If the store uses GRAMS, convert
  if (weightUnit === "GRAMS") pesoKg = pesoKg / 1000;
  if (weightUnit === "POUNDS") pesoKg = pesoKg * 0.453592;
  if (weightUnit === "OUNCES") pesoKg = pesoKg * 0.0283495;

  const valor = Number(selectedVariant.price?.amount ?? 0);

  async function handleCalc() {
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) {
      setErrorMsg("Informe um CEP válido com 8 dígitos.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setOptions([]);
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
        setStatus("error");
      } else {
        setOptions(list);
        setStatus("success");
      }
    } catch {
      setErrorMsg("Erro ao calcular frete. Tente novamente.");
      setStatus("error");
    }
  }

  function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div ref={ref} {...rest} className="space-y-3">
      <p className="text-sm font-semibold text-neutral-700">Calcular frete</p>

      {/* Input row */}
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
          disabled={status === "loading"}
          className="h-11 bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Calcular"}
        </button>
      </div>

      {/* Error */}
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      {/* Results */}
      {status === "success" && options.length > 0 && (
        <ul className="space-y-2">
          {options.map((opt, i) => {
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
                  <p className="text-neutral-500 text-xs">
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
  );
}

export const schema = createSchema({
  type: "mp--shipping-calculator",
  title: "Calculadora de Frete",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [],
});
