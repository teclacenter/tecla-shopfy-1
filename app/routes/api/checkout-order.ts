import type { ActionFunctionArgs } from "react-router";

interface CartLine {
  variantId: string;
  quantity: number;
  price: number;
  title: string;
}

interface ShippingLine {
  title: string;
  price: number;
  code: string;
}

interface OrderAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface OrderBody {
  email: string;
  name: string;
  phone: string;
  cpfCnpj: string;
  address: OrderAddress;
  cartLines: CartLine[];
  shippingLine: ShippingLine;
  paymentMethod: string;
  paymentId: string | number;
  totalAmount: number;
  pixDiscount?: number;
}

interface ShopifyOrderResponse {
  order?: {
    id: number;
    name: string;
    confirmation_number?: string;
    order_number?: number;
  };
  errors?: unknown;
}

function extractVariantId(gid: string): number {
  const parts = gid.split("/");
  return parseInt(parts[parts.length - 1], 10);
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const storeDomain = (context.env as any).PUBLIC_STORE_DOMAIN as string;
  const adminToken = (context.env as any).SHOPIFY_ADMIN_API_TOKEN as string;

  if (!storeDomain || !adminToken) {
    return Response.json({ error: "Store not configured" }, { status: 500 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = rawBody as OrderBody;

  const {
    email,
    name,
    phone,
    cpfCnpj,
    address,
    cartLines,
    shippingLine,
    paymentMethod,
    paymentId,
    pixDiscount,
  } = body;

  if (!email || !name || !address || !cartLines?.length || !shippingLine) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const firstName = name.split(" ")[0];
  const lastName = name.split(" ").slice(1).join(" ") || name.split(" ")[0];

  const lineItems = cartLines.map((line) => ({
    variant_id: extractVariantId(line.variantId),
    quantity: line.quantity,
    price: line.price.toFixed(2),
    title: line.title,
  }));

  const noteLines = [
    `CPF/CNPJ: ${cpfCnpj}`,
    `Método de pagamento: ${paymentMethod}`,
    `ID do pagamento MP: ${paymentId}`,
    pixDiscount ? `Desconto PIX: ${pixDiscount}%` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const tags = ["checkout_proprio", paymentMethod, `mp_id_${paymentId}`].join(
    ",",
  );

  const orderPayload = {
    order: {
      email,
      phone,
      financial_status: "paid",
      send_receipt: false,
      note: noteLines,
      tags,
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        address1: `${address.street}, ${address.number}`,
        address2: address.complement ?? "",
        city: address.city,
        province: address.state,
        zip: address.cep.replace(/\D/g, ""),
        country: "BR",
        phone,
      },
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address1: `${address.street}, ${address.number}`,
        address2: address.complement ?? "",
        city: address.city,
        province: address.state,
        zip: address.cep.replace(/\D/g, ""),
        country: "BR",
        phone,
      },
      line_items: lineItems,
      shipping_lines: [
        {
          title: shippingLine.title,
          price: shippingLine.price.toFixed(2),
          code: shippingLine.code,
        },
      ],
    },
  };

  try {
    const res = await fetch(
      `https://${storeDomain}/admin/api/2024-01/orders.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": adminToken,
        },
        body: JSON.stringify(orderPayload),
      },
    );

    const data = await res.json<ShopifyOrderResponse>();

    if (!res.ok) {
      console.error("Shopify order creation error:", data);
      return Response.json(
        { error: data?.errors ?? "Erro ao criar pedido" },
        { status: res.status },
      );
    }

    const order = data.order!;
    return Response.json({
      orderId: order.id,
      orderName: order.name,
      confirmationNumber: order.confirmation_number ?? order.order_number,
    });
  } catch {
    return Response.json(
      { error: "Erro interno ao criar pedido" },
      { status: 500 },
    );
  }
}
