import type { LoaderFunctionArgs } from "react-router";

interface MpPaymentResponse {
  status?: string;
  status_detail?: string;
  message?: string;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Payment ID is required" }, { status: 400 });
  }

  const accessToken = (context.env as any).MERCADO_PAGO_ACCESS_TOKEN as string;
  if (!accessToken) {
    return Response.json(
      { error: "Mercado Pago not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json<MpPaymentResponse>();

    if (!res.ok) {
      return Response.json(
        { error: data?.message ?? "Erro ao consultar pagamento" },
        { status: res.status },
      );
    }

    return Response.json({
      status: data.status,
      statusDetail: data.status_detail,
    });
  } catch {
    return Response.json(
      { error: "Erro interno ao consultar status" },
      { status: 500 },
    );
  }
}
