import {getSeoMeta} from '@shopify/hydrogen';
import type {LoaderFunctionArgs, MetaArgs} from 'react-router';
import {useLoaderData} from 'react-router';
import AlgoliaSearch from '~/components/AlgoliaSearch';
import {seoPayload} from '~/.server/seo';

export async function loader({request, context}: LoaderFunctionArgs) {
  const {searchParams} = new URL(request.url);
  const searchTerm = searchParams.get('q') || '';
  const env = context.env as any;

  return {
    seo: seoPayload.collection({
      url: request.url,
      collection: {
        id: 'search',
        title: 'Busca',
        handle: 'search',
        description: `Resultados para "${searchTerm}"`,
        seo: {
          title: searchTerm ? `Busca: ${searchTerm}` : 'Busca',
          description: searchTerm
            ? `Resultados de busca para "${searchTerm}"`
            : 'Busque produtos na loja',
        },
        products: {
          nodes: [],
        },
      },
    }),
    searchTerm,
    env: {
      ALGOLIA_APP_ID: env.ALGOLIA_APP_ID ?? '',
      ALGOLIA_SEARCH_API_KEY: env.ALGOLIA_SEARCH_API_KEY ?? '',
      ALGOLIA_INDEX_NAME: env.ALGOLIA_INDEX_NAME ?? '',
    },
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(
    ...matches.map((match) => (match.data as any)?.seo).filter(Boolean),
  );
};

export default function Search() {
  const {searchTerm, env} = useLoaderData<typeof loader>();

  return (
    <section className="px-4 py-8 md:px-6 md:py-10 xl:px-10">
      <div className="mx-auto max-w-[1600px]">
        <AlgoliaSearch
          appId={env.ALGOLIA_APP_ID}
          searchKey={env.ALGOLIA_SEARCH_API_KEY}
          indexName={env.ALGOLIA_INDEX_NAME}
          mode="full"
          initialQuery={searchTerm}
        />
      </div>
    </section>
  );
}