import { Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const orderName = url.searchParams.get("orderName") ?? null;
  return { orderName };
}

export default function CheckoutSuccess() {
  const { orderName } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center py-16">
        {/* Checkmark icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Pedido confirmado!
        </h1>

        {orderName && (
          <p className="text-lg font-medium text-neutral-700 mb-4">
            Pedido {orderName}
          </p>
        )}

        <p className="text-sm text-neutral-500 mb-8">
          Obrigado pela sua compra! Você receberá um e-mail com os detalhes do
          seu pedido em breve.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-neutral-900 text-white py-3.5 font-semibold hover:bg-neutral-700 transition rounded-sm text-center"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
