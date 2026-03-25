type BrandItem = {
  name: string;
  href: string;
};

const brands: BrandItem[] = [
  {name: 'Yamaha', href: '/search?q=Yamaha'},
  {name: 'Roland', href: '/search?q=Roland'},
  {name: 'Korg', href: '/search?q=Korg'},
  {name: 'Casio', href: '/search?q=Casio'},
  {name: 'Kurzweil', href: '/search?q=Kurzweil'},
  {name: 'Nord', href: '/search?q=Nord'},
  {name: 'Alesis', href: '/search?q=Alesis'},
  {name: 'Viscount', href: '/search?q=Viscount'},
  {name: 'Pearl River', href: '/search?q=Pearl%20River'},
  {name: 'Kawai', href: '/search?q=Kawai'},
];

export default function BrandsGrid() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-2xl font-semibold">Marcas</h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {brands.map((brand) => (
            <a
              key={brand.name}
              href={brand.href}
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