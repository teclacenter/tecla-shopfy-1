import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData } from "react-router";
import { Link } from "~/components/link";
import type { loader as productRouteLoader } from "~/routes/products/product";

interface ProductBreadcrumbProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  homeText: string;
}

export default function ProductBreadcrumb(props: ProductBreadcrumbProps) {
  return null;
}

export const schema = createSchema({
  type: "mp--breadcrumb",
  title: "Breadcrumb",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "text",
          label: "Home text",
          name: "homeText",
          defaultValue: "Início",
          placeholder: "Início",
        },
      ],
    },
  ],
});
