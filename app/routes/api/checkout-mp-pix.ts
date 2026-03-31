import type { ActionFunctionArgs } from "react-router";

interface MpPixResponse {
  id?: number;
  status?: string;
  message?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const accessToken = (context.env as any).MERCADO_PAGO_ACCESS_TOKEN as string;
  if (!accessToken) {
    return Response.json(
      { error: "Mercado Pago not configured" },
      { status: 500 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = rawBody as {
    email: string;
    name: string;
    cpfCnpj: string;
    amount: number;
    externalReference: string;
  };

  const { email, name, cpfCnpj, amount, externalReference } = body;

  if (!email || !name || !cpfCnpj || !amount || !externalReference) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rawDoc = cpfCnpj.replace(/\D/g, "");
  const identificationType = rawDoc.length === 14 ? "CNPJ" : "CPF";

  const payload = {
    transaction_amount: amount,
    payment_method_id: "pix",
    description: `Pedido ${externalReference}`,
    external_reference: externalReference,
    payer: {
      email,
      first_name: name.split(" ")[0],
      last_name: name.split(" ").slice(1).join(" ") || name.split(" ")[0],
      identification: {
        type: identificationType,
        number: rawDoc,
      },
    },
  };

  try {
    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json<MpPixResponse>();

    if (!res.ok) {
      return Response.json(
        { error: data?.message ?? "Erro ao criar pagamento PIX" },
        { status: res.status },
      );
    }

    return Response.json({
      paymentId: data.id,
      status: data.status,
      qrCode: data.point_of_interaction?.transaction_data?.qr_code ?? null,
      qrCodeBase64:
        data.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
    });
  } catch {
    return Response.json(
      { error: "Erro interno ao processar PIX" },
      { status: 500 },
    );
  }
}
