import {createSchema} from '@weaverse/hydrogen';
import type {HydrogenComponentProps} from '@weaverse/hydrogen';
import {
  JudgemePreviewBadge,
  JudgemeReviewWidget,
} from '@judgeme/shopify-hydrogen';

interface ProductJudgemeProps extends HydrogenComponentProps {
  product?: any;
  heading?: string;
  description?: string;
  showHeader?: boolean;
}

export default function ProductJudgeme(props: ProductJudgemeProps) {
  const {product, heading, description, showHeader, ...rest} = props;

  const Badge = JudgemePreviewBadge as any;
  const Widget = JudgemeReviewWidget as any;

  if (!product?.id) {
    return <section {...rest} className="min-h-[40px]" />;
  }

  return (
    <section
      {...rest}
      className="border-t border-neutral-200 bg-white py-10 md:py-14"
    >
      <div className="mx-auto max-w-7xl px-4">
        {showHeader ? (
          <div className="mb-10">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                {heading || 'Avaliações de clientes'}
              </h2>

              {description ? (
                <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600 md:text-base">
                  {description}
                </p>
              ) : null}

              <div className="mt-4 flex justify-center">
                <Badge productId={product.id} />
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-6">
          <Widget productId={product.id} />
        </div>
      </div>
    </section>
  );
}

export const schema = createSchema({
  type: 'product-judgeme',
  title: 'Judge.me Reviews',
  settings: [
    {
      group: 'Content',
      inputs: [
        {
          type: 'switch',
          name: 'showHeader',
          label: 'Mostrar cabeçalho',
          defaultValue: true,
        },
        {
          type: 'text',
          name: 'heading',
          label: 'Título',
          defaultValue: 'Avaliações de clientes',
        },
        {
          type: 'textarea',
          name: 'description',
          label: 'Descrição',
          defaultValue:
            'Confira a experiência de clientes que já compraram este produto.',
        },
      ],
    },
  ],
});