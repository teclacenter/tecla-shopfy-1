import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  useThemeSettings,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

export interface HeroImageProps extends VariantProps<typeof variants> {
  ref: React.Ref<HTMLElement>;
  mobileHeight?: "small" | "medium" | "large" | "full";
  mobileContentPosition?: string;
}

const variants = cva("flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    height: {
      small: "min-h-[40vh] lg:min-h-[50vh]",
      medium: "min-h-[50vh] lg:min-h-[60vh]",
      large: "min-h-[70vh] lg:min-h-[80vh]",
      full: "",
    },
    enableTransparentHeader: {
      true: "",
      false: "",
    },
    contentPosition: {
      "top left": "items-start justify-start [&_.paragraph]:text-left",
      "top center": "items-center justify-start [&_.paragraph]:text-center",
      "top right": "items-end justify-start [&_.paragraph]:text-right",
      "center left": "items-start justify-center [&_.paragraph]:text-left",
      "center center": "items-center justify-center [&_.paragraph]:text-center",
      "center right": "items-end justify-center [&_.paragraph]:text-right",
      "bottom left": "items-start justify-end [&_.paragraph]:text-left",
      "bottom center": "items-center justify-end [&_.paragraph]:text-center",
      "bottom right": "items-end justify-end [&_.paragraph]:text-right",
    },
  },
  compoundVariants: [
    {
      height: "full",
      enableTransparentHeader: true,
      className: "h-screen-no-topbar",
    },
    {
      height: "full",
      enableTransparentHeader: false,
      className: "h-screen-dynamic",
    },
  ],
  defaultVariants: {
    height: "large",
    contentPosition: "center center",
  },
});

const MOBILE_HEIGHT_MAP: Record<string, string> = {
  small: "max-lg:min-h-[30vh]",
  medium: "max-lg:min-h-[50vh]",
  large: "max-lg:min-h-[70vh]",
  full: "max-lg:min-h-screen",
};

const MOBILE_CONTENT_POSITION_MAP: Record<string, string> = {
  "top left": "max-lg:items-start max-lg:justify-start max-lg:[&_.paragraph]:text-left",
  "top center": "max-lg:items-center max-lg:justify-start max-lg:[&_.paragraph]:text-center",
  "top right": "max-lg:items-end max-lg:justify-start max-lg:[&_.paragraph]:text-right",
  "center left": "max-lg:items-start max-lg:justify-center max-lg:[&_.paragraph]:text-left",
  "center center": "max-lg:items-center max-lg:justify-center max-lg:[&_.paragraph]:text-center",
  "center right": "max-lg:items-end max-lg:justify-center max-lg:[&_.paragraph]:text-right",
  "bottom left": "max-lg:items-start max-lg:justify-end max-lg:[&_.paragraph]:text-left",
  "bottom center": "max-lg:items-center max-lg:justify-end max-lg:[&_.paragraph]:text-center",
  "bottom right": "max-lg:items-end max-lg:justify-end max-lg:[&_.paragraph]:text-right",
};

export default function HeroImage(props: HeroImageProps & SectionProps) {
  const { ref, children, height, contentPosition, mobileHeight, mobileContentPosition, ...rest } = props;
  const { enableTransparentHeader } = useThemeSettings();

  const baseClasses = variants({ contentPosition, height, enableTransparentHeader });
  const mobileClasses = [
    mobileHeight ? MOBILE_HEIGHT_MAP[mobileHeight] : "",
    mobileContentPosition ? MOBILE_CONTENT_POSITION_MAP[mobileContentPosition] : "",
  ].filter(Boolean).join(" ");

  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName={`${baseClasses} ${mobileClasses}`.trim()}
    >
      {children}
    </Section>
  );
}

export const schema = createSchema({
  type: "hero-image",
  title: "Hero image",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "height",
          label: "Section height",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "full", label: "Fullscreen" },
            ],
          },
        },
        {
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center center",
        },
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
    {
      group: "Mobile",
      inputs: [
        {
          type: "select",
          name: "mobileHeight",
          label: "Height (mobile)",
          configs: {
            options: [
              { value: "small", label: "Small (30vh)" },
              { value: "medium", label: "Medium (50vh)" },
              { value: "large", label: "Large (70vh)" },
              { value: "full", label: "Fullscreen" },
            ],
          },
          helpText: "Overrides section height on screens smaller than 1024px.",
        },
        {
          type: "position",
          name: "mobileContentPosition",
          label: "Content position (mobile)",
          helpText: "Overrides content position on screens smaller than 1024px.",
        },
      ],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundFor" && inp.name !== "backgroundColor",
        ),
      ],
    },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    height: "large",
    contentPosition: "center center",
    backgroundImage: IMAGES_PLACEHOLDERS.banner_1,
    backgroundFit: "cover",
    enableOverlay: true,
    overlayOpacity: 40,
    children: [
      {
        type: "subheading",
        content: "Subheading",
        color: "#ffffff",
      },
      {
        type: "heading",
        content: "Hero image with text overlay",
        as: "h2",
        color: "#ffffff",
        size: "default",
      },
      {
        type: "paragraph",
        content:
          "Use this text to share information about your brand with your customers. Describe a product, share announcements, or welcome customers to your store.",
        color: "#ffffff",
      },
    ],
  },
});
