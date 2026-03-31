import type { ActionFunctionArgs } from "react-router";

interface MpCardResponse {
  id?: number;
  status?: string;
  status_detail?: string;
  message?: string;
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
    token: string;
    installments: number;
    paymentMethodId: string;
    issuerId: string;
    email: string;
    name: string;
    cpfCnpj: string;
    amount: number;
    externalReference: string;
  };

  const {
    token,
    installments,
    paymentMethodId,
    issuerId,
    email,
    name,
    cpfCnpj,
    amount,
    externalReference,
  } = body;

  if (
    !token ||
    !paymentMethodId ||
    !email ||
    !name ||
    !cpfCnpj ||
    !amount ||
    !externalReference
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rawDoc = cpfCnpj.replace(/\D/g, "");
  const identificationType = rawDoc.length === 14 ? "CNPJ" : "CPF";

  const payload = {
    transaction_amount: amount,
    token,
    description: `Pedido ${externalReference}`,
    installments: installments ?? 1,
    payment_method_id: paymentMethodId,
    issuer_id: issuerId,
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

    const data = await res.json<MpCardResponse>();

    if (!res.ok) {
      return Response.json(
        { error: data?.message ?? "Erro ao processar cartão" },
        { status: res.status },
      );
    }

    return Response.json({
      paymentId: data.id,
      status: data.status,
      statusDetail: data.status_detail,
    });
  } catch {
    return Response.json(
      { error: "Erro interno ao processar cartão" },
      { status: 500 },
    );
  }
}
