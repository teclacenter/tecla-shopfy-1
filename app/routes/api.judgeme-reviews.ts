import type {LoaderFunctionArgs} from 'react-router';

type JudgeMeApiReview = {
  id: string | number;
  rating?: number | string;
  body?: string;
  title?: string;
  product_title?: string;
  product_external_image_url?: string | null;
  product_image_url?: string | null;
  reviewer?: {
    name?: string;
  };
};

type JudgeMeApiResponse = {
  reviews?: JudgeMeApiReview[];
  total?: number | string;
};

export async function loader({request}: LoaderFunctionArgs) {
  const apiToken = process.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain =
    process.env.PUBLIC_STORE_DOMAIN || 'teclacenter.myshopify.com';

  if (!apiToken) {
    return Response.json(
      {error: 'JUDGEME_PRIVATE_API_TOKEN não configurado'},
      {status: 500},
    );
  }

  try {
    const url = new URL('https://judge.me/api/v1/reviews');
    url.searchParams.set('api_token', apiToken);
    url.searchParams.set('shop_domain', shopDomain);
    url.searchParams.set('published', 'true');
    url.searchParams.set('per_page', '12');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json(
        {error: `Erro ao buscar Judge.me: ${text}`},
        {status: 500},
      );
    }

    const data = (await response.json()) as JudgeMeApiResponse;

    const reviews = (data.reviews || []).map((review) => ({
      id: review.id,
      rating: Number(review.rating || 5),
      body: review.body || '',
      title: review.title || '',
      reviewer: review.reviewer?.name || 'Cliente',
      productTitle: review.product_title || '',
      productImage:
        review.product_external_image_url ||
        review.product_image_url ||
        null,
    }));

    const totalReviews = Number(data.total || reviews.length || 0);

    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
          ).toFixed(1)
        : '5.0';

    return Response.json({
      reviews,
      totalReviews,
      averageRating,
    });
  } catch (error: any) {
    return Response.json(
      {error: error?.message || 'Erro inesperado no Judge.me'},
      {status: 500},
    );
  }
}