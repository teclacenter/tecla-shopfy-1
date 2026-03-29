import {createSchema} from '@weaverse/hydrogen';
import type {HydrogenComponentProps} from '@weaverse/hydrogen';
import AlgoliaSearch from '~/components/AlgoliaSearch';

interface SearchAlgoliaProps extends HydrogenComponentProps {
  heading?: string;
  description?: string;
  appId?: string;
  searchKey?: string;
  indexName?: string;
}

export default function SearchAlgolia(props: SearchAlgoliaProps) {
  const {
    heading,
    description,
    appId = '',
    searchKey = '',
    indexName = '',
    ...rest
  } = props;

  return (
    <section {...rest} className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        {heading ? (
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            {heading}
          </h2>
        ) : null}

        {description ? (
          <p className="mt-2 max-w-2xl text-neutral-600">{description}</p>
        ) : null}

        <div className="mt-8">
          <AlgoliaSearch
            appId={appId}
            searchKey={searchKey}
            indexName={indexName}
          />
        </div>
      </div>
    </section>
  );
}

export const schema = createSchema({
  type: 'algolia-search',
  title: 'Algolia Search',
  settings: [
    {
      group: 'Content',
      inputs: [
        {
          type: 'text',
          name: 'heading',
          label: 'Título',
          defaultValue: 'Busca de produtos',
        },
        {
          type: 'textarea',
          name: 'description',
          label: 'Descrição',
          defaultValue: 'Encontre produtos com filtros, ordenação e paginação.',
        },
      ],
    },
    {
      group: 'Algolia',
      inputs: [
        {
          type: 'text',
          name: 'appId',
          label: 'Algolia App ID',
          defaultValue: '',
        },
        {
          type: 'text',
          name: 'searchKey',
          label: 'Algolia Search API Key',
          defaultValue: '',
        },
        {
          type: 'text',
          name: 'indexName',
          label: 'Algolia Index Name',
          defaultValue: '',
        },
      ],
    },
  ],
});