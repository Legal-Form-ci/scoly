import { useState, useEffect } from "react";

type SmartImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

/**
 * Image robuste (production): lazy-load + fallback si URL cassée.
 * Se met à jour quand src change (fix carousel).
 */
export default function SmartImage({
  src,
  fallbackSrc = "/placeholder.svg",
  loading = "lazy",
  ...props
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  // Reset when src changes (fix carousel issue)
  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setHasError(false);
    } else {
      setCurrentSrc(fallbackSrc);
    }
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
    props.onError?.(e);
  };

  return (
    <img
      {...props}
      src={currentSrc}
      loading={loading}
      onError={handleError}
    />
  );
}
