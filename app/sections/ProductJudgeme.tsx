import { createSchema } from '@weaverse/hydrogen';
import type { HydrogenComponentProps } from '@weaverse/hydrogen';
import { JudgemePreviewBadge, JudgemeReviewWidget } from '@judgeme/shopify-hydrogen';

export default function ProductJudgeme(props: HydrogenComponentProps) {
  // Weaverse injeta product.id no PDP
  const productId = (props as any).product?.id || 'gid://shopify/Product/1';

  const Badge = (JudgemePreviewBadge as any);
  const Widget = (JudgemeReviewWidget as any);

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <div className="mb-6 flex justify-center">
          <Badge productId={productId} />
        </div>
        <Widget productId={productId} />
      </div>
    </section>
  );
}

export const schema = createSchema({
  title: 'Judge.me Reviews',
  type: 'product-judgeme',
});