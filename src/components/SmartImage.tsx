import { useMemo, useState } from "react";

type SmartImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

/**
 * Image robuste (production): lazy-load + fallback si URL cassée.
 */
export default function SmartImage({
  src,
  fallbackSrc = "/placeholder.svg",
  loading = "lazy",
  ...props
}: SmartImageProps) {
  const initial = useMemo(() => src || fallbackSrc, [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(initial);

  return (
    <img
      {...props}
      src={currentSrc}
      loading={loading}
      onError={(e) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        props.onError?.(e);
      }}
    />
  );
}
