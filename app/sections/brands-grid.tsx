import type {HydrogenComponentProps} from '@weaverse/hydrogen';
import {createSchema} from '@weaverse/hydrogen';
import {useRef} from 'react';
import {CaretLeftIcon, CaretRightIcon} from '@phosphor-icons/react';

type ImageValue =
  | string
  | {
      src?: string;
      url?: string;
      altText?: string;
      image?: {
        url?: string;
      };
    }
  | null
  | undefined;

interface BrandsGridProps extends HydrogenComponentProps {
  title?: string;

  brand1Image?: ImageValue;
  brand1Alt?: string;
  brand1Link?: string;

  brand2Image?: ImageValue;
  brand2Alt?: string;
  brand2Link?: string;

  brand3Image?: ImageValue;
  brand3Alt?: string;
  brand3Link?: string;

  brand4Image?: ImageValue;
  brand4Alt?: string;
  brand4Link?: string;

  brand5Image?: ImageValue;
  brand5Alt?: string;
  brand5Link?: string;

  brand6Image?: ImageValue;
  brand6Alt?: string;
  brand6Link?: string;

  sectionPaddingTop?: string;
  sectionPaddingBottom?: string;
  logoHeight?: string;
  logoHeightMobile?: string;
}

function getImageUrl(image: ImageValue): string {
  if (!image) return '';
  if (typeof image === 'string') return image;
  if (image.src) return image.src;
  if (image.url) return image.url;
  if (image.image?.url) return image.image.url;
  return '';
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
    logoHeightMobile,
    ...rest
  } = props;

  const paddingTop = Number(sectionPaddingTop || 40);
  const paddingBottom = Number(sectionPaddingBottom || 40);
  const finalLogoHeight = Number(logoHeight || 56);
  const finalLogoHeightMobile = Number(logoHeightMobile || 36);

  const brands = [
    {image: getImageUrl(brand1Image), alt: brand1Alt || 'Marca 1', link: brand1Link},
    {image: getImageUrl(brand2Image), alt: brand2Alt || 'Marca 2', link: brand2Link},
    {image: getImageUrl(brand3Image), alt: brand3Alt || 'Marca 3', link: brand3Link},
    {image: getImageUrl(brand4Image), alt: brand4Alt || 'Marca 4', link: brand4Link},
    {image: getImageUrl(brand5Image), alt: brand5Alt || 'Marca 5', link: brand5Link},
    {image: getImageUrl(brand6Image), alt: brand6Alt || 'Marca 6', link: brand6Link},
  ].filter((brand) => brand.image);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const itemWidth = scrollRef.current.offsetWidth / 2;
    scrollRef.current.scrollBy({left: dir === 'right' ? itemWidth : -itemWidth, behavior: 'smooth'});
  };

  const BrandItem = ({brand, index}: {brand: typeof brands[number]; index: number}) => {
    const logo = (
      <img
        src={brand.image}
        alt={brand.alt}
        loading="lazy"
        className="block w-auto object-contain"
        style={{height: `${finalLogoHeightMobile}px`}}
      />
    );
    const cls = 'flex w-[calc(50%-8px)] flex-shrink-0 items-center justify-center snap-start';
    return brand.link ? (
      <a key={`${brand.alt}-${index}`} href={brand.link} aria-label={brand.alt} className={cls}>{logo}</a>
    ) : (
      <div key={`${brand.alt}-${index}`} className={cls}>{logo}</div>
    );
  };

  return (
    <section
      {...rest}
      className="w-full bg-[#f3f3f3]"
      style={{paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px`}}
    >
      <div className="mx-auto max-w-7xl px-6">
        {title ? (
          <h2 className="mb-10 text-3xl font-semibold tracking-tight text-black">
            {title}
          </h2>
        ) : null}

        {/* Mobile: scroll horizontal com setas */}
        <div className="relative flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Anterior"
            className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-900 hover:text-neutral-900"
          >
            <CaretLeftIcon className="h-4 w-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex flex-1 items-center gap-x-4 overflow-x-auto snap-x snap-mandatory pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {brands.map((brand, index) => (
              <BrandItem key={`${brand.alt}-${index}`} brand={brand} index={index} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Próximo"
            className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-900 hover:text-neutral-900"
          >
            <CaretRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop: linha única centralizada */}
        <div className="hidden lg:flex items-center justify-center gap-x-16">
          {brands.map((brand, index) => {
            const logo = (
              <img
                src={brand.image}
                alt={brand.alt}
                loading="lazy"
                className="block w-auto object-contain"
                style={{height: `${finalLogoHeight}px`}}
              />
            );
            return brand.link ? (
              <a key={`${brand.alt}-${index}`} href={brand.link} aria-label={brand.alt} className="flex items-center justify-center">{logo}</a>
            ) : (
              <div key={`${brand.alt}-${index}`} className="flex items-center justify-center">{logo}</div>
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
  settings: [
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
          label: 'Altura do logo (desktop)',
          defaultValue: '56',
        },
        {
          type: 'text',
          name: 'logoHeightMobile',
          label: 'Altura do logo (mobile)',
          defaultValue: '36',
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