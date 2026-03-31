import { useEffect, useRef, useState } from "react";
import { redirect, useLoaderData, useNavigate } from "react-router";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { OrderSummary } from "~/components/checkout/order-summary";

export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: "https://sdk.mercadopago.com/js/v2",
    as: "script",
  },
];

export async function loader({ context }: LoaderFunctionArgs) {
  const cart = await context.cart.get();
  if (!cart?.lines?.nodes?.length) return redirect("/cart");
  return {
    cart,
    mpPublicKey: (context.env as any).PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? "",
    pixDiscountPercent: parseInt(
      (context.env as any).PIX_DISCOUNT_PERCENT ?? "5",
      10,
    ),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").substring(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "$1-$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1-$2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCep(value: string): string {
  return value
    .replace(/\D/g, "")
    .substring(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskCpf(value: string): string {
  return value
    .replace(/\D/g, "")
    .substring(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCnpj(value: string): string {
  return value
    .replace(/\D/g, "")
    .substring(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function getInstallmentMultiplier(installments: number): number {
  if (installments === 1) return 1 - 0.07;
  if (installments <= 12) return 1;
  if (installments <= 18) return 1.05;
  return 1.1;
}

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: "Identificação" },
    { num: 2, label: "Entrega" },
    { num: 3, label: "Pagamento" },
  ];
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map(({ num, label }, idx) => {
        const isDone = step > num;
        const isActive = step === num;
        return (
          <div key={num} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition
                  ${isDone ? "border-neutral-900 bg-neutral-900 text-white" : ""}
                  ${isActive ? "border-neutral-900 bg-neutral-900 text-white" : ""}
                  ${!isDone && !isActive ? "border-neutral-300 bg-white text-neutral-400" : ""}
                `}
              >
                {isDone ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${isActive || isDone ? "text-neutral-900" : "text-neutral-400"}`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 mx-2 h-0.5 ${step > num ? "bg-neutral-900" : "bg-neutral-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field Components ────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-700 focus:outline-none rounded-sm";

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { cart, mpPublicKey, pixDiscountPercent } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // ── Step ──
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1 ──
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [personType, setPersonType] = useState<"fisica" | "juridica">("fisica");
  const [cpfCnpjValue, setCpfCnpjValue] = useState("");

  // ── Step 2 ──
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);

  // ── Step 3 ──
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [installments, setInstallments] = useState(1);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    paymentId: string | number;
    status: string;
  } | null>(null);
  const [cardProcessing, setCardProcessing] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPolling, setPixPolling] = useState(false);

  // ── Global ──
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mpCardFormRef = useRef<any>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cartTyped = cart as CartApiQueryFragment;
  const subtotal = parseFloat(cartTyped?.cost?.subtotalAmount?.amount ?? "0");

  // ── MP SDK Initialization ──
  useEffect(() => {
    if (step !== 3 || paymentMethod !== "card") return;
    if (typeof window === "undefined") return;

    function initMp() {
      if (!(window as any).MercadoPago) return;
      if (mpCardFormRef.current) return;

      const mp = new (window as any).MercadoPago(mpPublicKey, { locale: "pt-BR" });

      const cardForm = mp.cardForm({
        amount: String(computeTotal()),
        iframe: true,
        form: {
          id: "mp-card-form",
          cardholderName: {
            id: "mp-cardholderName",
            placeholder: "Nome como no cartão",
          },
          cardNumber: {
            id: "mp-cardNumber",
            placeholder: "Número do cartão",
          },
          expirationDate: {
            id: "mp-expirationDate",
            placeholder: "MM/AA",
          },
          securityCode: {
            id: "mp-securityCode",
            placeholder: "CVV",
          },
        },
        callbacks: {
          onFormMounted: (err: any) => {
            if (err) console.warn("MP cardForm mount error:", err);
          },
          onSubmit: async (event: Event) => {
            event.preventDefault();
            setCardProcessing(true);
            setError("");

            try {
              const {
                token,
                installments: _inst,
                paymentMethodId,
                issuerId,
              } = cardForm.getCardFormData();

              const totalAmount = computeTotal();

              const res = await fetch("/api/checkout/mp-card", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token,
                  installments,
                  paymentMethodId,
                  issuerId,
                  email,
                  name,
                  cpfCnpj: cpfCnpjValue.replace(/\D/g, ""),
                  amount: totalAmount,
                  externalReference: `checkout-${Date.now()}`,
                }),
              });

              const data = await res.json<{
                error?: string;
                paymentId?: number;
                status?: string;
                statusDetail?: string;
              }>();

              if (!res.ok || data.error) {
                setError(data.error ?? "Erro ao processar cartão.");
                return;
              }

              if (data.status === "approved" || data.status === "authorized") {
                await createOrder({
                  paymentMethod: "card",
                  paymentId: data.paymentId ?? "",
                  totalAmount,
                });
              } else {
                setError(
                  `Pagamento ${data.status ?? "recusado"}. Por favor, verifique os dados do cartão.`,
                );
              }
            } catch {
              setError("Erro ao processar pagamento. Tente novamente.");
            } finally {
              setCardProcessing(false);
            }
          },
          onError: (errors: any) => {
            console.error("MP cardForm errors:", errors);
          },
        },
      });

      mpCardFormRef.current = cardForm;
    }

    if ((window as any).MercadoPago) {
      initMp();
    } else {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = initMp;
      document.head.appendChild(script);
    }

    return () => {
      if (mpCardFormRef.current) {
        try {
          mpCardFormRef.current.unmount?.();
        } catch {
          // ignore
        }
        mpCardFormRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paymentMethod]);

  // ── Polling cleanup ──
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  function computeTotal(): number {
    const shippingCost = selectedShipping?.ShippingPrice ?? 0;
    if (paymentMethod === "pix") {
      const discount = (subtotal * pixDiscountPercent) / 100;
      return subtotal - discount + shippingCost;
    }
    if (paymentMethod === "card") {
      const multiplier = getInstallmentMultiplier(installments);
      return subtotal * multiplier + shippingCost;
    }
    return subtotal + shippingCost;
  }

  // ── CEP Lookup ──
  async function lookupCep(rawCep: string) {
    if (rawCep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`/api/checkout/cep?cep=${rawCep}`);
      const data = await res.json<{
        error?: string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      }>();
      if (!data.error) {
        setStreet(data.logradouro ?? "");
        setNeighborhood(data.bairro ?? "");
        setCity(data.localidade ?? "");
        setAddressState(data.uf ?? "");
      }
    } catch {
      // silently fail, user can fill manually
    } finally {
      setCepLoading(false);
    }
  }

  // ── Calculate Shipping ──
  async function calculateShipping() {
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) {
      setFieldErrors((e) => ({ ...e, cep: "Informe um CEP válido." }));
      return;
    }
    setShippingLoading(true);
    setShippingOptions([]);
    setSelectedShipping(null);
    setFieldErrors((e) => ({ ...e, shipping: "" }));

    const items = (cartTyped?.lines?.nodes ?? []).map((line: any) => ({
      Height: 17,
      Length: 54,
      Width: 43,
      Weight: 1,
      Quantity: line.quantity,
      SKU: line.merchandise?.id ?? "",
    }));

    try {
      const res = await fetch("/api/checkout/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientCep: rawCep,
          items,
          invoiceValue: subtotal,
        }),
      });
      const data = await res.json<{
        error?: string;
        options?: Array<{
          ServiceDescription: string;
          Carrier: string;
          ShippingPrice: number;
          DeliveryTime: number;
        }>;
      }>();

      if (!res.ok || data.error) {
        setFieldErrors((e) => ({
          ...e,
          shipping: data.error ?? "Erro ao calcular frete.",
        }));
        return;
      }

      if (!data.options?.length) {
        setFieldErrors((e) => ({
          ...e,
          shipping: "Nenhuma opção de frete encontrada para este CEP.",
        }));
        return;
      }

      setShippingOptions(data.options);
      setSelectedShipping(data.options[0]);
    } catch {
      setFieldErrors((e) => ({
        ...e,
        shipping: "Erro ao calcular frete. Tente novamente.",
      }));
    } finally {
      setShippingLoading(false);
    }
  }

  // ── Generate PIX ──
  async function generatePix() {
    setProcessing(true);
    setError("");
    setPixData(null);

    const externalReference = `checkout-${Date.now()}`;

    try {
      const res = await fetch("/api/checkout/mp-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          cpfCnpj: cpfCnpjValue.replace(/\D/g, ""),
          amount: computeTotal(),
          externalReference,
        }),
      });

      const data = await res.json<{
        error?: string;
        paymentId?: number;
        status?: string;
        qrCode?: string;
        qrCodeBase64?: string;
      }>();

      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao gerar PIX.");
        return;
      }

      setPixData({
        qrCode: data.qrCode ?? "",
        qrCodeBase64: data.qrCodeBase64 ?? "",
        paymentId: data.paymentId ?? "",
        status: data.status ?? "",
      });

      startPixPolling(data.paymentId ?? "", externalReference);
    } catch {
      setError("Erro ao gerar QR Code PIX. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  }

  function startPixPolling(paymentId: string | number, _extRef: string) {
    setPixPolling(true);
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/mp-status?id=${paymentId}`);
        const data = await res.json<{ status?: string }>();

        if (data.status === "approved") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPixPolling(false);
          await createOrder({
            paymentMethod: "pix",
            paymentId,
            totalAmount: computeTotal(),
          });
        }
      } catch {
        // keep polling
      }
    }, 5000);
  }

  async function createOrder({
    paymentMethod: pm,
    paymentId,
    totalAmount,
  }: {
    paymentMethod: string;
    paymentId: string | number;
    totalAmount: number;
  }) {
    setProcessing(true);
    setError("");

    const cartLines = (cartTyped?.lines?.nodes ?? []).map((line: any) => ({
      variantId: line.merchandise?.id ?? "",
      quantity: line.quantity,
      price: parseFloat(line.cost?.totalAmount?.amount ?? "0") / line.quantity,
      title: line.merchandise?.product?.title ?? "",
    }));

    const body = {
      email,
      name,
      phone: phone.replace(/\D/g, ""),
      cpfCnpj: cpfCnpjValue.replace(/\D/g, ""),
      address: {
        cep: cep.replace(/\D/g, ""),
        street,
        number,
        complement,
        neighborhood,
        city,
        state: addressState,
      },
      cartLines,
      shippingLine: {
        title: selectedShipping?.ServiceDescription ?? "Frete",
        price: selectedShipping?.ShippingPrice ?? 0,
        code: selectedShipping?.Carrier ?? "frete",
      },
      paymentMethod: pm,
      paymentId,
      totalAmount,
      pixDiscount: pm === "pix" ? pixDiscountPercent : undefined,
    };

    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json<{
        error?: string | unknown;
        orderId?: number;
        orderName?: string;
        confirmationNumber?: string | number;
      }>();

      if (!res.ok || data.error) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Erro ao registrar pedido.",
        );
        return;
      }

      navigate(`/checkout/sucesso?orderName=${encodeURIComponent(data.orderName ?? "")}`);
    } catch {
      setError("Erro ao criar pedido. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  }

  // ── Validation ──
  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Informe um e-mail válido.";
    }
    if (!name.trim() || name.trim().split(" ").length < 2) {
      errs.name = "Informe o nome completo.";
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      errs.phone = "Informe um telefone válido.";
    }
    const docDigits = cpfCnpjValue.replace(/\D/g, "");
    if (personType === "fisica" && docDigits.length !== 11) {
      errs.cpfCnpj ="Informe um CPF válido (11 dígitos).";
    }
    if (personType === "juridica" && docDigits.length !== 14) {
      errs.cpfCnpj ="Informe um CNPJ válido (14 dígitos).";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) errs.cep = "Informe um CEP válido.";
    if (!street.trim()) errs.street = "Informe a rua.";
    if (!number.trim()) errs.number = "Informe o número.";
    if (!neighborhood.trim()) errs.neighborhood = "Informe o bairro.";
    if (!city.trim()) errs.city = "Informe a cidade.";
    if (!addressState) errs.addressState = "Selecione o estado.";
    if (!selectedShipping) errs.shipping = "Selecione uma opção de frete.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleStep1Next() {
    if (validateStep1()) setStep(2);
  }

  function handleStep2Next() {
    if (validateStep2()) setStep(3);
  }

  // ── Installment Options ──
  const totalForInstallments = subtotal + (selectedShipping?.ShippingPrice ?? 0);

  function renderInstallmentOptions() {
    return Array.from({ length: 24 }, (_, i) => i + 1).map((n) => {
      const multiplier = getInstallmentMultiplier(n);
      const total = totalForInstallments * multiplier;
      const perInstallment = total / n;
      let label = "";
      if (n === 1) {
        label = `1x de ${formatBRL(total)} (7% de desconto)`;
      } else if (n <= 12) {
        label = `${n}x de ${formatBRL(perInstallment)} sem juros`;
      } else if (n <= 18) {
        label = `${n}x de ${formatBRL(perInstallment)} (+5%)`;
      } else {
        label = `${n}x de ${formatBRL(perInstallment)} (+10%)`;
      }
      return (
        <option key={n} value={n}>
          {label}
        </option>
      );
    });
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-8">Checkout</h1>

        <div className="flex flex-col-reverse gap-8 lg:flex-row lg:gap-12">
          {/* Left: Form */}
          <div className="flex-1 min-w-0">
            <StepIndicator step={step} />

            {/* ── STEP 1: Identificação ── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold mb-4 text-neutral-900">
                  Identificação
                </h2>

                <Field label="E-mail" error={fieldErrors.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </Field>

                <Field
                  label="Nome Completo"
                  error={fieldErrors.name}
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="João da Silva"
                    autoComplete="name"
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Razão Social para PJ
                  </p>
                </Field>

                <Field label="Telefone" error={fieldErrors.phone}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    className={inputClass}
                    placeholder="11-95354-8000"
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </Field>

                {/* Person Type Toggle */}
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                    Tipo de Pessoa
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPersonType("fisica");
                        setCpfCnpjValue("");
                      }}
                      className={`flex-1 py-2.5 text-sm font-medium border rounded-sm transition
                        ${personType === "fisica"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                        }`}
                    >
                      Pessoa Física
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPersonType("juridica");
                        setCpfCnpjValue("");
                      }}
                      className={`flex-1 py-2.5 text-sm font-medium border rounded-sm transition
                        ${personType === "juridica"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                        }`}
                    >
                      Pessoa Jurídica
                    </button>
                  </div>
                </div>

                <Field
                  label={personType === "fisica" ? "CPF" : "CNPJ"}
                  error={fieldErrors.cpfCnpj}
                >
                  <input
                    type="text"
                    value={cpfCnpjValue}
                    onChange={(e) =>
                      setCpfCnpjValue(
                        personType === "fisica"
                          ? maskCpf(e.target.value)
                          : maskCnpj(e.target.value),
                      )
                    }
                    className={inputClass}
                    placeholder={
                      personType === "fisica"
                        ? "000.000.000-00"
                        : "00.000.000/0000-00"
                    }
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </Field>

                {/* Anonymous checkbox (cosmetic) */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-700"
                  />
                  <span className="text-sm text-neutral-600">
                    Continuar sem criar conta
                  </span>
                </label>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full bg-neutral-900 text-white py-3.5 font-semibold hover:bg-neutral-700 transition rounded-sm mt-2"
                >
                  Continuar para Entrega
                </button>
              </div>
            )}

            {/* ── STEP 2: Entrega ── */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold mb-4 text-neutral-900">
                  Endereço de Entrega
                </h2>

                <Field label="CEP" error={fieldErrors.cep}>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => {
                      const masked = maskCep(e.target.value);
                      setCep(masked);
                      const raw = masked.replace(/\D/g, "");
                      if (raw.length === 8) lookupCep(raw);
                    }}
                    className={inputClass}
                    placeholder="00000-000"
                    inputMode="numeric"
                  />
                  {cepLoading && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Consultando CEP...
                    </p>
                  )}
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label="Rua" error={fieldErrors.street}>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className={inputClass}
                        placeholder="Av. Paulista"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Número" error={fieldErrors.number}>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className={inputClass}
                        placeholder="100"
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Complemento">
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className={inputClass}
                    placeholder="Apto 42 (opcional)"
                  />
                </Field>

                <Field label="Bairro" error={fieldErrors.neighborhood}>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className={inputClass}
                    placeholder="Bela Vista"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cidade" error={fieldErrors.city}>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                      placeholder="São Paulo"
                    />
                  </Field>
                  <Field label="Estado" error={fieldErrors.addressState}>
                    <select
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Selecione</option>
                      {BRAZILIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Shipping Calculation */}
                <div>
                  <button
                    type="button"
                    onClick={calculateShipping}
                    disabled={shippingLoading}
                    className="w-full border border-neutral-300 py-3.5 font-medium hover:bg-neutral-50 transition rounded-sm text-sm disabled:opacity-60"
                  >
                    {shippingLoading
                      ? "Calculando frete..."
                      : "Calcular Frete"}
                  </button>
                  {fieldErrors.shipping && (
                    <p className="text-sm text-red-600 mt-1">
                      {fieldErrors.shipping}
                    </p>
                  )}
                </div>

                {shippingOptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-700">
                      Opções de frete:
                    </p>
                    {shippingOptions.map((opt: any, i: number) => (
                      <label
                        key={i}
                        className={`flex items-center justify-between gap-3 border rounded-sm px-4 py-3 cursor-pointer transition
                          ${selectedShipping === opt
                            ? "border-neutral-900 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-400"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedShipping === opt}
                            onChange={() => setSelectedShipping(opt)}
                            className="h-4 w-4 text-neutral-900 border-neutral-300 focus:ring-neutral-700"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {opt.ServiceDescription}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {opt.Carrier} · {opt.DeliveryTime} dia(s) útil(eis)
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-neutral-900 shrink-0">
                          {opt.ShippingPrice === 0
                            ? "Grátis"
                            : formatBRL(opt.ShippingPrice)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full border border-neutral-300 py-3.5 font-medium hover:bg-neutral-50 transition rounded-sm"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2Next}
                    className="w-full bg-neutral-900 text-white py-3.5 font-semibold hover:bg-neutral-700 transition rounded-sm"
                  >
                    Continuar para Pagamento
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Pagamento ── */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4 text-neutral-900">
                  Pagamento
                </h2>

                {/* Payment Method Tabs */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("pix");
                      setPixData(null);
                      if (pollingRef.current) clearInterval(pollingRef.current);
                    }}
                    className={`flex-1 flex flex-col items-center gap-1.5 border-2 rounded-sm py-4 transition font-medium text-sm
                      ${paymentMethod === "pix"
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                      }`}
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.643 3.041a1.333 1.333 0 0 1 .714 0l7.334 2.134a1.333 1.333 0 0 1 .976 1.283v7.084a5.333 5.333 0 0 1-2.667 4.618l-5.333 3.084a1.333 1.333 0 0 1-1.334 0l-5.333-3.084A5.333 5.333 0 0 1 3.333 13.542V6.458a1.333 1.333 0 0 1 .976-1.283l7.334-2.134Z" />
                    </svg>
                    PIX
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("card");
                      if (pollingRef.current) clearInterval(pollingRef.current);
                    }}
                    className={`flex-1 flex flex-col items-center gap-1.5 border-2 rounded-sm py-4 transition font-medium text-sm
                      ${paymentMethod === "card"
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                      }`}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                    Cartão de Crédito
                  </button>
                </div>

                {/* ── PIX ── */}
                {paymentMethod === "pix" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-sm bg-green-50 border border-green-200 px-4 py-3">
                      <span className="text-green-700 font-semibold text-sm">
                        {pixDiscountPercent}% de desconto no PIX
                      </span>
                      <span className="text-green-600 text-sm">
                        — Total:{" "}
                        <strong>{formatBRL(computeTotal())}</strong>
                      </span>
                    </div>

                    {!pixData ? (
                      <button
                        type="button"
                        onClick={generatePix}
                        disabled={processing}
                        className="w-full bg-neutral-900 text-white py-3.5 font-semibold hover:bg-neutral-700 transition rounded-sm disabled:opacity-60"
                      >
                        {processing ? "Gerando..." : "Gerar QR Code PIX"}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {/* QR Code */}
                        {pixData.qrCodeBase64 && (
                          <div className="flex flex-col items-center gap-3">
                            <img
                              src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                              alt="QR Code PIX"
                              className="h-48 w-48 border border-neutral-200 rounded-sm"
                            />
                            <p className="text-xs text-neutral-500 text-center">
                              Escaneie o QR Code com o app do seu banco
                            </p>
                          </div>
                        )}

                        {/* Copy key */}
                        {pixData.qrCode && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-neutral-700">
                              Ou copie o código Pix:
                            </p>
                            <div className="flex gap-2">
                              <input
                                readOnly
                                value={pixData.qrCode}
                                className="flex-1 border border-neutral-300 px-3 py-2 text-xs rounded-sm bg-neutral-50 truncate"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard
                                    .writeText(pixData.qrCode)
                                    .then(() => {
                                      setPixCopied(true);
                                      setTimeout(() => setPixCopied(false), 2000);
                                    });
                                }}
                                className="shrink-0 border border-neutral-300 px-3 py-2 text-xs font-medium rounded-sm hover:bg-neutral-50 transition"
                              >
                                {pixCopied ? "Copiado!" : "Copiar"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Status polling indicator */}
                        {pixPolling && (
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Aguardando confirmação do pagamento...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── CARD ── */}
                {paymentMethod === "card" && (
                  <div className="space-y-5">
                    {/* Installments selector */}
                    <Field label="Parcelas">
                      <select
                        value={installments}
                        onChange={(e) =>
                          setInstallments(parseInt(e.target.value, 10))
                        }
                        className={inputClass}
                      >
                        {renderInstallmentOptions()}
                      </select>
                    </Field>

                    {/* MP Card Form */}
                    <form id="mp-card-form">
                      <div className="space-y-4">
                        <Field label="Nome no Cartão">
                          <div
                            id="mp-cardholderName"
                            className="h-12 border border-neutral-300 rounded-sm overflow-hidden"
                          />
                        </Field>

                        <Field label="Número do Cartão">
                          <div
                            id="mp-cardNumber"
                            className="h-12 border border-neutral-300 rounded-sm overflow-hidden"
                          />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Validade">
                            <div
                              id="mp-expirationDate"
                              className="h-12 border border-neutral-300 rounded-sm overflow-hidden"
                            />
                          </Field>
                          <Field label="CVV">
                            <div
                              id="mp-securityCode"
                              className="h-12 border border-neutral-300 rounded-sm overflow-hidden"
                            />
                          </Field>
                        </div>

                        <button
                          type="submit"
                          disabled={cardProcessing}
                          className="w-full bg-neutral-900 text-white py-3.5 font-semibold hover:bg-neutral-700 transition rounded-sm disabled:opacity-60"
                        >
                          {cardProcessing
                            ? "Processando..."
                            : `Pagar ${formatBRL(computeTotal())}`}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full border border-neutral-300 py-3.5 font-medium hover:bg-neutral-50 transition rounded-sm"
                >
                  Voltar para Entrega
                </button>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:w-[380px] lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <OrderSummary
                cart={cartTyped}
                selectedShipping={selectedShipping}
                paymentMethod={step === 3 ? paymentMethod : null}
                installments={installments}
                pixDiscountPercent={pixDiscountPercent}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
