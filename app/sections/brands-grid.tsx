import {createSchema} from '@weaverse/hydrogen';

type BrandItem = {
  name: string;
  link: string;
};

interface BrandsGridProps {
  title: string;
  brands: BrandItem[];
}

export default function BrandsGrid({title, brands}: BrandsGridProps) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-2xl font-semibold">{title}</h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {brands.map((brand, index) => (
            <a
              key={index}
              href={brand.link}
              className="flex min-h-[72px] items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center text-sm font-medium transition hover:shadow-md"
            >
              {brand.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 🔥 ISSO AQUI FAZ APARECER NO WEAVERSE */
export const schema = createSchema({
  type: 'brands-grid',
  title: 'Marcas (Grid)',
  settings: [
    {
      type: 'text',
      id: 'title',
      label: 'Título',
      defaultValue: 'Nossas Marcas',
    },
  ],
  children: [
    {
      type: 'brand-item',
      title: 'Marca',
      settings: [
        {
          type: 'text',
          id: 'name',
          label: 'Nome da marca',
          defaultValue: 'Yamaha',
        },
        {
          type: 'text',
          id: 'link',
          label: 'Link',
          defaultValue: '/search?q=Yamaha',
        },
      ],
    },
  ],
});