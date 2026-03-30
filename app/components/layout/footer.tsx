import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  MinusIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import * as Accordion from "@radix-ui/react-accordion";
import { cva } from "class-variance-authority";
import Link from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";
import { cn } from "~/utils/cn";

const variants = cva("", {
  variants: {
    width: {
      full: "",
      stretch: "",
      fixed: "mx-auto max-w-(--page-width)",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "mx-auto px-3 md:px-4 lg:px-6",
    },
  },
});

const FOOTER_COLUMNS = [
  {
    id: "minha-conta",
    title: "Minha Conta",
    links: [
      { label: "Criar Conta", href: "https://www.teclacenter.com.br/criar-conta" },
      { label: "Entrar", href: "https://www.teclacenter.com.br/login/?return_url=index.php" },
      { label: "Afiliados", href: "https://www.teclacenter.com.br/afiliados/" },
      { label: "Rastreamento de Pedidos", href: "https://www.teclacenter.com.br/rastreamento-de-pedidos" },
    ],
  },
  {
    id: "sobre",
    title: "Sobre",
    links: [
      { label: "Política de Entrega", href: "https://www.teclacenter.com.br/politica-de-entrega/" },
      { label: "Política de Troca e Devolução", href: "https://www.teclacenter.com.br/trocas-e-devolucoes/" },
      { label: "Política de Privacidade", href: "https://www.teclacenter.com.br/politicas-de-privacidade/" },
      { label: "Pós-Vendas", href: "https://www.teclacenter.com.br/pos-vendas" },
    ],
  },
  {
    id: "servicos",
    title: "Serviços",
    links: [
      { label: "Quem Somos", href: "https://quem-somos.teclacenter.com.br/" },
      { label: "Contato", href: "https://www.teclacenter.com.br/contato" },
      { label: "Mapa do Site", href: "https://www.teclacenter.com.br/sitemap" },
      { label: "Avaliação de Usados", href: "https://quem-somos.teclacenter.com.br/avaliacao-de-usados/" },
    ],
  },
  {
    id: "categorias",
    title: "Minhas Categorias",
    links: [
      { label: "Ver Todas as Categorias", href: "/collections/" },
    ],
  },
  {
    id: "contato",
    title: "Contato",
    links: [
      { label: "TC Instrumentos Musicais", href: null },
      { label: "CNPJ 12.929.942/0001-38", href: null },
      { label: "sac@teclacenter.com.br", href: "mailto:sac@teclacenter.com.br" },
      { label: "Ver no Mapa", href: "https://goo.gl/maps/SxoogdqmaYKFBdPTA" },
    ],
  },
];

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-1.02-.09z"/>
    </svg>
  );
}

const SOCIAL_ACCOUNTS = [
  { name: "Instagram", to: "https://www.instagram.com/teclacenter/", Icon: InstagramLogoIcon },
  { name: "Facebook", to: "https://www.facebook.com/teclacenter/", Icon: FacebookLogoIcon },
  { name: "YouTube", to: "https://www.youtube.com/teclacenter", Icon: YoutubeIcon },
  { name: "TikTok", to: "https://www.tiktok.com/@teclacenter.oficial", Icon: TiktokIcon },
];

export function Footer() {
  const { shopName } = useShopMenu();
  const {
    footerWidth,
    footerLogoData,
    footerLogoWidth,
    copyright,
  } = useThemeSettings();

  return (
    <footer
      className={cn(
        "w-full bg-(--color-footer-bg) text-(--color-footer-text)",
        variants({ padding: footerWidth }),
      )}
    >
      <div className={cn("h-full w-full", variants({ width: footerWidth }))}>

        {/* Mobile: Logo on top */}
        <div className="flex justify-center py-8 lg:hidden">
          {footerLogoData ? (
            <div style={{ width: footerLogoWidth || 160 }}>
              <Image
                data={footerLogoData}
                sizes="auto"
                width={320}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <span className="text-xl font-bold uppercase">{shopName}</span>
          )}
        </div>

        {/* Desktop: 4 columns + logo */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] lg:gap-10 lg:py-14">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col gap-4">
              <h3 className="text-(--color-footer-text) font-semibold text-base opacity-60 uppercase tracking-wider">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        to={link.href}
                        className="text-sm hover:opacity-80 transition-opacity"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-sm opacity-70">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Logo column */}
          <div className="flex items-start justify-end">
            {footerLogoData ? (
              <div style={{ width: footerLogoWidth || 180 }}>
                <Image
                  data={footerLogoData}
                  sizes="auto"
                  width={360}
                  className="h-full w-full object-contain object-right"
                />
              </div>
            ) : (
              <span className="text-xl font-bold uppercase">{shopName}</span>
            )}
          </div>
        </div>

        {/* Mobile: Accordion */}
        <div className="lg:hidden">
          <Accordion.Root type="multiple" className="divide-y divide-white/10">
            {FOOTER_COLUMNS.map((col) => (
              <Accordion.Item key={col.id} value={col.id}>
                <Accordion.Trigger className="flex w-full items-center justify-between py-4 text-left font-semibold text-base group">
                  <span className="opacity-60 uppercase tracking-wider text-sm">{col.title}</span>
                  <PlusIcon className="h-4 w-4 group-data-[state=open]:hidden" />
                  <MinusIcon className="h-4 w-4 hidden group-data-[state=open]:block" />
                </Accordion.Trigger>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand [--expand-to:var(--radix-accordion-content-height)] [--collapse-from:var(--radix-accordion-content-height)]">
                  <ul className="flex flex-col gap-3 pb-4">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        {link.href ? (
                          <Link
                            to={link.href}
                            className="text-sm hover:opacity-80 transition-opacity"
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <span className="text-sm opacity-70">{link.label}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Bottom: Social + Copyright */}
        <div className="py-8">
          <div className="flex flex-col items-center gap-4 mb-6">
            <span className="text-sm font-semibold uppercase tracking-wider opacity-60">
              Siga-nos
            </span>
            <div className="flex gap-4">
              {SOCIAL_ACCOUNTS.map(({ to, name, Icon }) => (
                <Link
                  key={name}
                  to={to}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <p className="text-center text-xs opacity-50 max-w-2xl mx-auto">
            {copyright}
          </p>
        </div>

      </div>
    </footer>
  );
}
