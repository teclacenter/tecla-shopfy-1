import type {HydrogenComponentProps} from '@weaverse/hydrogen';
import {createSchema} from '@weaverse/hydrogen';

interface BrandsGridProps extends HydrogenComponentProps {
  title?: string;

  brand1Image?: string;
  brand1Alt?: string;
  brand1Link?: string;

  brand2Image?: string;
  brand2Alt?: string;
  brand2Link?: string;

  brand3Image?: string;
  brand3Alt?: string;
  brand3Link?: string;

  brand4Image?: string;
  brand4Alt?: string;
  brand4Link?: string;

  brand5Image?: string;
  brand5Alt?: string;
  brand5Link?: string;

  brand6Image?: string;
  brand6Alt?: string;
  brand6Link?: string;

  sectionPaddingTop?: string;
  sectionPaddingBottom?: string;
  logoHeight?: string;
}

export default function BrandsGrid(props: BrandsGridProps) {
  const {
    title,

    brand1Image,
    brand1Alt,
    brand1Link,

    brand2Image,
    brand2Alt,
    brand2Link,

    brand3Image,
    brand3Alt,
    brand3Link,

    brand4Image,
    brand4Alt,
    brand4Link,

    brand5Image,
    brand5Alt,
    brand5Link,

    brand6Image,
    brand6Alt,
    brand6Link,

    sectionPaddingTop,
    sectionPaddingBottom,
    logoHeight,
    ...rest
  } = props;

  const paddingTop = Number(sectionPaddingTop || 40);
  const paddingBottom = Number(sectionPaddingBottom || 40);
  const finalLogoHeight = Number(logoHeight || 56);

  const brands = [
    {image: brand1Image, alt: brand1Alt || 'Marca 1', link: brand1Link},
    {image: brand2Image, alt: brand2Alt || 'Marca 2', link: brand2Link},
    {image: brand3Image, alt: brand3Alt || 'Marca 3', link: brand3Link},
    {image: brand4Image, alt: brand4Alt || 'Marca 4', link: brand4Link},
    {image: brand5Image, alt: brand5Alt || 'Marca 5', link: brand5Link},
    {image: brand6Image, alt: brand6Alt || 'Marca 6', link: brand6Link},
  ].filter((brand) => brand.image);

  return (
    <section
      {...rest}
      className="w-full"
      style={{
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
      }}
    >
      <div className="mx-auto max-w-7xl px-6">
        {title ? (
          <h2 className="mb-8 text-3xl font-semibold tracking-tight text-black">
            {title}
          </h2>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14 lg:gap-x-16">
          {brands.map((brand, index) => {
            const logo = (
              <img
                src={brand.image}
                alt={brand.alt}
                loading="lazy"
                className="w-auto object-contain transition duration-200 hover:opacity-80"
                style={{height: `${finalLogoHeight}px`}}
              />
            );

            return (
              <div
                key={`${brand.alt}-${index}`}
                className="flex items-center justify-center"
              >
                {brand.link ? (
                  <a href={brand.link} aria-label={brand.alt}>
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const schema = createSchema({
  title: 'Brands Logos',
  type: 'brands-logos',
  inspector: [
    {
      group: 'Section',
      inputs: [
        {
          type: 'text',
          name: 'title',
          label: 'Título',
          defaultValue: 'Nossas Marcas Favoritas',
        },
        {
          type: 'text',
          name: 'sectionPaddingTop',
          label: 'Padding superior',
          defaultValue: '40',
        },
        {
          type: 'text',
          name: 'sectionPaddingBottom',
          label: 'Padding inferior',
          defaultValue: '40',
        },
        {
          type: 'text',
          name: 'logoHeight',
          label: 'Altura do logo',
          defaultValue: '56',
        },
      ],
    },
    {
      group: 'Marca 1',
      inputs: [
        {type: 'image', name: 'brand1Image', label: 'Logo'},
        {type: 'text', name: 'brand1Alt', label: 'Alt', defaultValue: 'Yamaha'},
        {type: 'url', name: 'brand1Link', label: 'Link', defaultValue: '/collections/yamaha'},
      ],
    },
    {
      group: 'Marca 2',
      inputs: [
        {type: 'image', name: 'brand2Image', label: 'Logo'},
        {type: 'text', name: 'brand2Alt', label: 'Alt', defaultValue: 'Kayserburg'},
        {type: 'url', name: 'brand2Link', label: 'Link', defaultValue: '/collections/kayserburg'},
      ],
    },
    {
      group: 'Marca 3',
      inputs: [
        {type: 'image', name: 'brand3Image', label: 'Logo'},
        {type: 'text', name: 'brand3Alt', label: 'Alt', defaultValue: 'Bulara'},
        {type: 'url', name: 'brand3Link', label: 'Link', defaultValue: '/collections/bulara'},
      ],
    },
    {
      group: 'Marca 4',
      inputs: [
        {type: 'image', name: 'brand4Image', label: 'Logo'},
        {type: 'text', name: 'brand4Alt', label: 'Alt', defaultValue: 'Viscount'},
        {type: 'url', name: 'brand4Link', label: 'Link', defaultValue: '/collections/viscount'},
      ],
    },
    {
      group: 'Marca 5',
      inputs: [
        {type: 'image', name: 'brand5Image', label: 'Logo'},
        {type: 'text', name: 'brand5Alt', label: 'Alt', defaultValue: 'Casio'},
        {type: 'url', name: 'brand5Link', label: 'Link', defaultValue: '/collections/casio'},
      ],
    },
    {
      group: 'Marca 6',
      inputs: [
        {type: 'image', name: 'brand6Image', label: 'Logo'},
        {type: 'text', name: 'brand6Alt', label: 'Alt', defaultValue: 'Pearl River'},
        {type: 'url', name: 'brand6Link', label: 'Link', defaultValue: '/collections/pearl-river'},
      ],
    },
  ],
});