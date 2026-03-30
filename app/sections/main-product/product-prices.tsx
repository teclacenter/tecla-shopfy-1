import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData } from "react-router";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { isCombinedListing } from "~/utils/combined-listings";

interface ProductPricesProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  showCompareAtPrice: boolean;
}

function formatBRL(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

// Installment rules:
// PIX/Boleto : price * 0.90
// 1x         : price * 0.93  (7% off)
// 2x–12x     : price / N     (sem juros)
// 13x–18x    : price*1.05 / N (5% acréscimo)
// 19x–24x    : price*1.10 / N (10% acréscimo)
function buildInstallments(price: number) {
  const rows: { n: number; parcela: number; label: string; total: number }[] =
    [];

  rows.push({
    n: 1,
    parcela: price * 0.93,
    label: "sem juros (7% de desconto)",
    total: price * 0.93,
  });

  for (let n = 2; n <= 12; n++) {
    rows.push({ n, parcela: price / n, label: "sem juros", total: price });
  }

  const total5 = price * 1.05;
  for (let n = 13; n <= 18; n++) {
    rows.push({ n, parcela: total5 / n, label: "5% de acréscimo", total: total5 });
  }

  const total10 = price * 1.1;
  for (let n = 19; n <= 24; n++) {
    rows.push({ n, parcela: total10 / n, label: "10% de acréscimo", total: total10 });
  }

  return rows;
}

// Small PIX diamond icon (matches Pix brand shape)
function PixIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.25 2.75a3.182 3.182 0 0 0-4.5 0L2.75 9.75a3.182 3.182 0 0 0 0 4.5l7 7a3.182 3.182 0 0 0 4.5 0l7-7a3.182 3.182 0 0 0 0-4.5l-7-7Z"
        fill="#32BCAD"
      />
    </svg>
  );
}

function InstallmentModal({
  price,
  pixPrice,
}: {
  price: number;
  pixPrice: number;
}) {
  const rows = buildInstallments(price);
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
      <Dialog.Content
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl flex flex-col max-h-[90vh] rounded-sm"
        aria-describedby={undefined}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <Dialog.Title className="font-semibold text-base text-neutral-900">
            {formatBRL(pixPrice)} à Vista no Pix ou Boleto
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition"
              aria-label="Fechar"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-neutral-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-neutral-600 w-20">
                  Parcela
                </th>
                <th className="px-5 py-3 text-left font-semibold text-neutral-600">
                  Preço
                </th>
                <th className="px-5 py-3 text-right font-semibold text-neutral-600">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((row) => {
                const isDiscount = row.label.includes("desconto");
                const isInterest = row.label.includes("acréscimo");
                return (
                  <tr key={row.n} className="hover:bg-neutral-50 transition">
                    <td className="px-5 py-2.5 font-medium text-neutral-900">
                      {row.n}x
                    </td>
                    <td className="px-5 py-2.5 text-neutral-700">
                      <span className="font-medium">
                        {formatBRL(row.parcela)}
                      </span>{" "}
                      <span
                        className={
                          isDiscount
                            ? "text-green-700 text-xs"
                            : isInterest
                              ? "text-orange-600 text-xs"
                              : "text-neutral-500 text-xs"
                        }
                      >
                        {row.label}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-neutral-900">
                      {formatBRL(row.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 text-xs text-neutral-400 leading-relaxed">
          Os valores apresentados são para consulta. O valor real da parcela
          será exibido ao finalizar o pedido.
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export default function ProductPrices(props: ProductPricesProps) {
  const { ref, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  const combinedListing = isCombinedListing(product);

  if (!product) return null;

  const priceAmount = Number(selectedVariant?.price?.amount ?? 0);
  if (!priceAmount || priceAmount === 0) return null;

  const compareAmount = Number(selectedVariant?.compareAtPrice?.amount ?? 0);
  const hasCompare = compareAmount > priceAmount;

  const pixPrice = priceAmount * 0.9;

  if (combinedListing) {
    const minAmount = Number(product.priceRange.minVariantPrice.amount);
    return (
      <div ref={ref} {...rest} className="space-y-1">
        <p className="text-sm text-neutral-500">A partir de:</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-neutral-900">
            {formatBRL(minAmount * 0.9)}
          </span>
          <span className="flex items-center gap-1 text-sm text-neutral-600">
            <PixIcon />A vista no PIX
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} {...rest} className="space-y-1">
      {/* DE / riscado */}
      {hasCompare && (
        <p className="text-base font-medium text-neutral-400 line-through">
          {formatBRL(compareAmount)}
        </p>
      )}

      {/* A partir de + PIX price */}
      <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
        A partir de:
      </p>
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-2xl font-bold text-neutral-900">
          {formatBRL(pixPrice)}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-neutral-600">
          <PixIcon />
          A vista no PIX
        </span>
      </div>

      {/* Formas de pagamento */}
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800 transition w-fit pt-0.5"
          >
            Formas de Pagamento
          </button>
        </Dialog.Trigger>
        <InstallmentModal price={priceAmount} pixPrice={pixPrice} />
      </Dialog.Root>
    </div>
  );
}

export const schema = createSchema({
  type: "mp--prices",
  title: "Prices",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "switch",
          label: "Show compare at price",
          name: "showCompareAtPrice",
          defaultValue: true,
        },
      ],
    },
  ],
});
