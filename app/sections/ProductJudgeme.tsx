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
  showSummary?: boolean;
}

export default function ProductJudgeme(props: ProductJudgemeProps) {
  const {product, heading, description, showSummary, ...rest} = props;

  if (!product?.id) return null;

  const Badge = JudgemePreviewBadge as any;
  const Widget = JudgemeReviewWidget as any;

  return (
    <section
      {...rest}
      className="border-t border-neutral-200 bg-white py-10 md:py-14"
    >
      <div className="mx-auto max-w-7xl px-4">
        {(heading || description) && (
          <div className="mb-8 text-center">
            {heading ? (
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                {heading}
              </h2>
            ) : null}

            {description ? (
              <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600 md:text-base">
                {description}
              </p>
            ) : null}
          </div>
        )}

        {showSummary ? (
          <div className="mb-8 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div>
                <h3 className="text-lg font-medium text-neutral-900">
                  Avaliações de clientes
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Veja opiniões reais de quem comprou este produto.
                </p>
              </div>

              <div className="flex justify-center md:justify-end">
                <Badge product={product} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex justify-center">
            <Badge product={product} />
          </div>
        )}

        <div className="jdgm-widget-wrapper rounded-2xl border border-neutral-200 bg-white p-4 md:p-6">
          <Widget product={product} />
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
        {
          type: 'switch',
          name: 'showSummary',
          label: 'Mostrar resumo superior',
          defaultValue: true,
        },
      ],
    },
  ],
});