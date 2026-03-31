import type { ActionFunctionArgs } from "react-router";

const FRENET_PROXY = "https://frenet-proxy.mateus-9ab.workers.dev/";
const SELLER_CEP = "29167650";

interface FrenetItem {
  Height: number;
  Length: number;
  Width: number;
  Weight: number;
  Quantity: number;
  SKU: string;
}

interface FrenetShippingOption {
  ServiceDescription: string;
  Carrier: string;
  ShippingPrice: number;
  DeliveryTime: number;
  Error?: string | null;
}

interface FrenetResponse {
  ShippingSevicesArray?: FrenetShippingOption[];
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = rawBody as {
    recipientCep: string;
    items: FrenetItem[];
    invoiceValue: number;
  };

  const { recipientCep, items, invoiceValue } = body;

  if (!recipientCep || !items?.length) {
    return Response.json(
      { error: "recipientCep and items are required" },
      { status: 400 },
    );
  }

  const rawCep = recipientCep.replace(/\D/g, "");
  if (rawCep.length !== 8) {
    return Response.json({ error: "CEP inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(FRENET_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        SellerCEP: SELLER_CEP,
        RecipientCEP: rawCep,
        ShipmentInvoiceValue: invoiceValue ?? 0,
        ShippingServiceCode: null,
        ShippingItemArray: items,
        RecipientCountry: "BR",
      }),
    });

    if (!res.ok) {
      return Response.json(
        { error: "Erro ao consultar frete" },
        { status: 502 },
      );
    }

    const data = await res.json<FrenetResponse>();
    const options = (data.ShippingSevicesArray ?? [])
      .filter((s) => !s.Error)
      .map((s) => ({
        ServiceDescription: s.ServiceDescription,
        Carrier: s.Carrier,
        ShippingPrice: s.ShippingPrice,
        DeliveryTime: s.DeliveryTime,
      }));

    return Response.json({ options });
  } catch {
    return Response.json(
      { error: "Erro interno ao calcular frete" },
      { status: 500 },
    );
  }
}
