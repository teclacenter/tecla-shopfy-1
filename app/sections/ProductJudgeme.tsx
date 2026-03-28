import { createSchema } from '@weaverse/hydrogen';
import type { HydrogenComponentProps } from '@weaverse/hydrogen';
import { JudgemePreviewBadge, JudgemeReviewWidget } from '@judgeme/shopify-hydrogen';

// Definindo a interface de props seguindo o padrão HydrogenComponentProps do Pilot [4, 5]
interface ProductJudgemeProps extends HydrogenComponentProps {
  product?: any;
  heading?: string;
  description?: string;
}

export default function ProductJudgeme(props: ProductJudgemeProps) {
  const { product, heading, description, ...rest } = props;

  // Se não houver produto carregado, o componente não renderiza nada [5]
  if (!product?.id) return null;

  // Caso o TypeScript continue reclamando das props 'product' ou 'productId', 
  // você pode usar o componente com um cast para 'any' para ignorar o erro de tipagem da biblioteca externa:
  const Badge = JudgemePreviewBadge as any;
  const Widget = JudgemeReviewWidget as any;

  return (
    <section {...rest} className="py-12">
      <div className="mx-auto max-w-7xl px-4 text-center">
        {heading && <h2 className="text-2xl font-bold mb-4">{heading}</h2>}
        {description && <p className="mb-6 text-gray-600">{description}</p>}
        
        {/* Usando productId que é o padrão recomendado em versões anteriores da integração [1, 6] */}
        <div className="mb-6 flex justify-center">
          <Badge productId={product.id} />
        </div>
        
        <Widget productId={product.id} />
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
          defaultValue: 'Avaliações de Clientes',
        },
        {
          type: 'textarea',
          name: 'description',
          label: 'Descrição',
          defaultValue: 'Confira o que nossos clientes dizem.',
        },
      ],
    },
  ],
});