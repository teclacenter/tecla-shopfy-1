import type { LoaderFunctionArgs } from "react-router";

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const cep = url.searchParams.get("cep")?.replace(/\D/g, "") ?? "";

  if (cep.length !== 8) {
    return Response.json({ error: "CEP inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) {
      return Response.json(
        { error: "Erro ao consultar CEP" },
        { status: 502 },
      );
    }

    const data = await res.json<ViaCepResponse>();

    if (data.erro) {
      return Response.json({ error: "CEP não encontrado" }, { status: 404 });
    }

    return Response.json({
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      localidade: data.localidade ?? "",
      uf: data.uf ?? "",
    });
  } catch {
    return Response.json(
      { error: "Erro interno ao consultar CEP" },
      { status: 500 },
    );
  }
}
