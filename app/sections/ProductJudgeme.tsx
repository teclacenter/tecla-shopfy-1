import { createSchema } from '@weaverse/hydrogen';
import type { HydrogenComponentProps } from '@weaverse/hydrogen';
import { JudgemePreviewBadge, JudgemeReviewWidget } from '@judgeme/shopify-hydrogen';

export default function ProductJudgeme(props: HydrogenComponentProps) {
  const { product, ...rest } = props;
  if (!product?.id) return null;

  return (
    <section {...rest} className="py-12">
      <div className="mx-auto max-w-7xl px-4 text-center mb-6">
        <JudgemePreviewBadge productId={product.id} />
      </div>
      <JudgemeReviewWidget productId={product.id} />
    </section>
  );
}

export const schema = createSchema({
  title: 'Judge.me Reviews',
  type: 'product-judgeme',
});