import { CaretDownIcon } from "@phosphor-icons/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useLocation, useSearchParams } from "react-router";
import Link from "~/components/link";
import type { SortParam } from "~/types/others";
import { cn } from "~/utils/cn";

const SORT_LIST: { label: string; key: SortParam }[] = [
  { label: "Destaques", key: "featured" },
  {
    label: "Relevância",
    key: "relevance",
  },
  {
    label: "Menor preço",
    key: "price-low-high",
  },
  {
    label: "Maior preço",
    key: "price-high-low",
  },
  {
    label: "Mais vendidos",
    key: "best-selling",
  },
  {
    label: "Mais recentes",
    key: "newest",
  },
];

export function Sort() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const currentSort =
    SORT_LIST.find(({ key }) => key === searchParams.get("sort")) ||
    SORT_LIST[0];
  const params = new URLSearchParams(searchParams);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex h-12 items-center gap-1.5 border px-4 py-2.5 focus-visible:outline-hidden">
        <span className="hidden lg:inline">
          Ordenar por: <span className="font-semibold">{currentSort.label}</span>
        </span>
        <span className="lg:hidden">Ordenar</span>
        <CaretDownIcon />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="flex h-fit w-44 flex-col gap-2 border border-line-subtle bg-background p-5"
        >
          {SORT_LIST.map(({ key, label }) => {
            params.set("sort", key);
            return (
              <DropdownMenu.Item key={key} asChild>
                <Link
                  to={`${location.pathname}?${params.toString()}`}
                  className={cn(
                    "underline-offset-[6px] hover:underline hover:outline-hidden",
                    currentSort.key === key && "font-bold",
                  )}
                  preventScrollReset
                >
                  {label}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
