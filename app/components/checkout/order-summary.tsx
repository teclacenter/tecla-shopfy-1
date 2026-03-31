import type { CartApiQueryFragment } from "storefront-api.generated";

interface FrenetShipping {
  ServiceDescription: string;
  Carrier: string;
  ShippingPrice: number;
  DeliveryTime: number;
}

interface OrderSummaryProps {
  cart: CartApiQueryFragment;
  selectedShipping?: FrenetShipping | null;
  paymentMethod?: "pix" | "card" | null;
  installments?: number;
  pixDiscountPercent?: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getInstallmentMultiplier(installments: number): number {
  if (installments === 1) return 1 - 0.07; // -7% discount
  if (installments <= 12) return 1; // no change
  if (installments <= 18) return 1.05; // +5%
  return 1.1; // +10%
}

function getInstallmentLabel(installments: number): string {
  if (installments === 1) return "Desconto à vista";
  if (installments <= 12) return "Sem juros";
  if (installments <= 18) return "+5% de juros";
  return "+10% de juros";
}

export function OrderSummary({
  cart,
  selectedShipping,
  paymentMethod,
  installments = 1,
  pixDiscountPercent = 5,
}: OrderSummaryProps) {
  const lines = cart?.lines?.nodes ?? [];
  const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount ?? "0");
  const shippingCost = selectedShipping?.ShippingPrice ?? 0;

  let adjustmentLabel: string | null = null;
  let adjustmentAmount = 0;
  let total = subtotal + shippingCost;

  if (paymentMethod === "pix") {
    adjustmentAmount = -(subtotal * pixDiscountPercent) / 100;
    adjustmentLabel = `Desconto PIX (${pixDiscountPercent}%)`;
    total = subtotal + shippingCost + adjustmentAmount;
  } else if (paymentMethod === "card" && installments) {
    const multiplier = getInstallmentMultiplier(installments);
    const adjustedSubtotal = subtotal * multiplier;
    adjustmentAmount = adjustedSubtotal - subtotal;
    if (installments === 1) {
      adjustmentLabel = "Desconto à vista (7%)";
    } else if (multiplier !== 1) {
      adjustmentLabel = getInstallmentLabel(installments);
    }
    total = adjustedSubtotal + shippingCost;
  }

  return (
    <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-6">
      <h2 className="text-lg font-semibold mb-4 text-neutral-900">
        Resumo do pedido
      </h2>

      {/* Cart Lines */}
      <ul className="space-y-4 mb-6">
        {lines.map((line: any) => {
          const merchandise = line.merchandise;
          const image = merchandise?.image ?? merchandise?.product?.featuredImage;
          const variantTitle =
            merchandise?.title !== "Default Title" ? merchandise?.title : null;
          const lineTotal =
            parseFloat(line.cost?.totalAmount?.amount ?? "0");

          return (
            <li key={line.id} className="flex gap-3">
              {image && (
                <div className="relative shrink-0">
                  <img
                    src={image.url}
                    alt={image.altText ?? merchandise?.product?.title ?? ""}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-sm border border-neutral-200 object-cover"
                  />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-600 text-[10px] font-bold text-white">
                    {line.quantity}
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col justify-center min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {merchandise?.product?.title ?? "Produto"}
                </p>
                {variantTitle && (
                  <p className="text-xs text-neutral-500">{variantTitle}</p>
                )}
              </div>
              <div className="shrink-0 text-sm font-semibold text-neutral-900">
                {formatBRL(lineTotal)}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-neutral-200 pt-4 space-y-2">
        {/* Subtotal */}
        <div className="flex justify-between text-sm text-neutral-700">
          <span>Subtotal</span>
          <span>{formatBRL(subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm text-neutral-700">
          <span>Frete</span>
          <span>
            {selectedShipping
              ? shippingCost === 0
                ? "Grátis"
                : formatBRL(shippingCost)
              : "—"}
          </span>
        </div>

        {/* PIX discount or installment adjustment */}
        {adjustmentLabel && adjustmentAmount !== 0 && (
          <div
            className={`flex justify-between text-sm ${adjustmentAmount < 0 ? "text-green-700" : "text-orange-600"}`}
          >
            <span>{adjustmentLabel}</span>
            <span>
              {adjustmentAmount < 0
                ? `- ${formatBRL(Math.abs(adjustmentAmount))}`
                : `+ ${formatBRL(adjustmentAmount)}`}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>

        {/* Installments breakdown */}
        {paymentMethod === "card" && installments && installments > 1 && (
          <p className="text-xs text-neutral-500 text-right">
            {installments}x de {formatBRL(total / installments)}
          </p>
        )}
      </div>

      {selectedShipping && (
        <div className="mt-4 rounded-sm bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
          <span className="font-medium">{selectedShipping.ServiceDescription}</span>
          {" · "}
          Prazo: {selectedShipping.DeliveryTime} dia(s) útil(eis)
        </div>
      )}
    </div>
  );
}
