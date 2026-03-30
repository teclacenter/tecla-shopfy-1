import { Image } from "@shopify/hydrogen";
import type { InspectorGroup, WeaverseImage } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "~/utils/cn";

const variants = cva("absolute inset-0 z-[-1] h-full w-full", {
  variants: {
    backgroundFit: {
      fill: "object-fill",
      cover: "object-cover",
      contain: "object-contain",
    },
    backgroundPosition: {
      "top left": "object-[top_left]",
      "top center": "object-[top_center]",
      "top right": "object-[top_right]",
      "center left": "object-[center_left]",
      "center center": "object-[center_center]",
      "center right": "object-[center_right]",
      "bottom left": "object-[bottom_left]",
      "bottom center": "object-[bottom_center]",
      "bottom right": "object-[bottom_right]",
    },
  },
  defaultVariants: {
    backgroundFit: "cover",
    backgroundPosition: "center center",
  },
});

export type BackgroundImageProps = VariantProps<typeof variants> & {
  backgroundImage?: WeaverseImage | string;
  backgroundImageMobile?: WeaverseImage | string;
};

export function BackgroundImage(props: BackgroundImageProps) {
  const { backgroundImage, backgroundImageMobile, backgroundFit, backgroundPosition } = props;

  if (!backgroundImage && !backgroundImageMobile) return null;

  const baseClass = variants({ backgroundFit, backgroundPosition });

  const desktopData = backgroundImage
    ? (typeof backgroundImage === "string" ? { url: backgroundImage, altText: "Section background" } : backgroundImage)
    : null;

  const mobileData = backgroundImageMobile
    ? (typeof backgroundImageMobile === "string" ? { url: backgroundImageMobile, altText: "Section background" } : backgroundImageMobile)
    : null;

  return (
    <>
      {desktopData && (
        <Image
          className={mobileData ? cn(baseClass, "hidden md:block") : baseClass}
          data={desktopData}
          sizes="auto"
        />
      )}
      {mobileData && (
        <Image
          className={desktopData ? cn(baseClass, "md:hidden") : baseClass}
          data={mobileData}
          sizes="auto"
        />
      )}
    </>
  );
}

export const backgroundInputs: InspectorGroup["inputs"] = [
  {
    type: "select",
    name: "backgroundFor",
    label: "Background for",
    configs: {
      options: [
        { value: "section", label: "Section" },
        { value: "content", label: "Content" },
      ],
    },
    defaultValue: "section",
  },
  {
    type: "color",
    name: "backgroundColor",
    label: "Background color",
    defaultValue: "",
  },
  {
    type: "image",
    name: "backgroundImage",
    label: "Background image",
  },
  {
    type: "image",
    name: "backgroundImageMobile",
    label: "Background image (mobile)",
    condition: (data: BackgroundImageProps) => Boolean(data.backgroundImage),
  },
  {
    type: "select",
    name: "backgroundFit",
    label: "Background fit",
    configs: {
      options: [
        { value: "fill", label: "Fill" },
        { value: "cover", label: "Cover" },
        { value: "contain", label: "Contain" },
      ],
    },
    defaultValue: "cover",
    condition: (data: BackgroundImageProps) => Boolean(data.backgroundImage),
  },
  {
    type: "position",
    name: "backgroundPosition",
    label: "Background position",
    defaultValue: "center center",
    condition: (data: BackgroundImageProps) => Boolean(data.backgroundImage),
  },
];
