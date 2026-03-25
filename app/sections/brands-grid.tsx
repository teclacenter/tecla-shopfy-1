import {createSchema} from '@weaverse/hydrogen';

interface BrandsGridProps {
  title?: string;
  brand1Name?: string;
  brand1Link?: string;
  brand2Name?: string;
  brand2Link?: string;
  brand3Name?: string;
  brand3Link?: string;
  brand4Name?: string;
  brand4Link?: string;
  brand5Name?: string;
  brand5Link?: string;
  brand6Name?: string;
  brand6Link?: string;
  brand7Name?: string;
  brand7Link?: string;
  brand8Name?: string;
  brand8Link?: string;
  brand9Name?: string;
  brand9Link?: string;
  brand10Name?: string;
  brand10Link?: string;
}

export default function BrandsGrid(props: BrandsGridProps) {
  const brands = [
    {name: props.brand1Name, link: props.brand1Link},
    {name: props.brand2Name, link: props.brand2Link},
    {name: props.brand3Name, link: props.brand3Link},
    {name: props.brand4Name, link: props.brand4Link},
    {name: props.brand5Name, link: props.brand5Link},
    {name: props.brand6Name, link: props.brand6Link},
    {name: props.brand7Name, link: props.brand7Link},
    {name: props.brand8Name, link: props.brand8Link},
    {name: props.brand9Name, link: props.brand9Link},
    {name: props.brand10Name, link: props.brand10Link},
  ].filter((brand) => brand.name && brand.link);

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-2xl font-semibold">
          {props.title || 'Nossas marcas'}
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {brands.map((brand, index) => (
            <a
              key={`${brand.name}-${index}`}
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

export const schema = createSchema({
  title: 'Brands Grid',
  type: 'brands-grid',
  inspector: [
    {
      group: 'Content',
      inputs: [
        {
          type: 'text',
          name: 'title',
          label: 'Título',
          defaultValue: 'Nossas marcas',
        },
      ],
    },
    {
      group: 'Marca 1',
      inputs: [
        {type: 'text', name: 'brand1Name', label: 'Nome', defaultValue: 'Yamaha'},
        {type: 'url', name: 'brand1Link', label: 'Link', defaultValue: '/search?q=Yamaha'},
      ],
    },
    {
      group: 'Marca 2',
      inputs: [
        {type: 'text', name: 'brand2Name', label: 'Nome', defaultValue: 'Roland'},
        {type: 'url', name: 'brand2Link', label: 'Link', defaultValue: '/search?q=Roland'},
      ],
    },
    {
      group: 'Marca 3',
      inputs: [
        {type: 'text', name: 'brand3Name', label: 'Nome', defaultValue: 'Korg'},
        {type: 'url', name: 'brand3Link', label: 'Link', defaultValue: '/search?q=Korg'},
      ],
    },
    {
      group: 'Marca 4',
      inputs: [
        {type: 'text', name: 'brand4Name', label: 'Nome', defaultValue: 'Casio'},
        {type: 'url', name: 'brand4Link', label: 'Link', defaultValue: '/search?q=Casio'},
      ],
    },
    {
      group: 'Marca 5',
      inputs: [
        {type: 'text', name: 'brand5Name', label: 'Nome', defaultValue: 'Kurzweil'},
        {type: 'url', name: 'brand5Link', label: 'Link', defaultValue: '/search?q=Kurzweil'},
      ],
    },
    {
      group: 'Marca 6',
      inputs: [
        {type: 'text', name: 'brand6Name', label: 'Nome', defaultValue: 'Nord'},
        {type: 'url', name: 'brand6Link', label: 'Link', defaultValue: '/search?q=Nord'},
      ],
    },
    {
      group: 'Marca 7',
      inputs: [
        {type: 'text', name: 'brand7Name', label: 'Nome', defaultValue: 'Alesis'},
        {type: 'url', name: 'brand7Link', label: 'Link', defaultValue: '/search?q=Alesis'},
      ],
    },
    {
      group: 'Marca 8',
      inputs: [
        {type: 'text', name: 'brand8Name', label: 'Nome', defaultValue: 'Viscount'},
        {type: 'url', name: 'brand8Link', label: 'Link', defaultValue: '/search?q=Viscount'},
      ],
    },
    {
      group: 'Marca 9',
      inputs: [
        {type: 'text', name: 'brand9Name', label: 'Nome', defaultValue: 'Pearl River'},
        {type: 'url', name: 'brand9Link', label: 'Link', defaultValue: '/search?q=Pearl%20River'},
      ],
    },
    {
      group: 'Marca 10',
      inputs: [
        {type: 'text', name: 'brand10Name', label: 'Nome', defaultValue: 'Kawai'},
        {type: 'url', name: 'brand10Link', label: 'Link', defaultValue: '/search?q=Kawai'},
      ],
    },
  ],
});