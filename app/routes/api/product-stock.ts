import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";

const STOCK_QUERY = `#graphql
  query ProductStock($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      availableForSale
      selectedOrFirstAvailableVariant(
        selectedOptions: []
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        quantityAvailable
        availableForSale
      }
    }
  }
` as const;

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { productHandle } = params;
  if (!productHandle) return data({ outOfStock: false });

  try {
    const { storefront } = context;
    const result = await storefront.query(STOCK_QUERY, {
      variables: {
        handle: productHandle,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      cache: storefront.CacheShort(),
    });

    const product = result?.product;
    if (!product) return data({ outOfStock: false });

    const qty = product.selectedOrFirstAvailableVariant?.quantityAvailable;
    const outOfStock =
      product.availableForSale === false ||
      (qty !== null && qty !== undefined && qty === 0);

    return data({ outOfStock });
  } catch {
    return data({ outOfStock: false });
  }
}
