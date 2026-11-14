"use client";

import { useEffect, useRef, useState } from "react";
import type { Theme } from "@/lib/themes";

/** Photo that fades in once it has loaded (no pop-in); the container shows the `line` colour meanwhile. Cached images appear at once. */
export default function FadeImg({ src, alt, theme }: { src: string; alt: string; theme: Theme }) {
  const img = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(Boolean(img.current?.complete && img.current.naturalWidth > 0));
  }, [src]);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static pre-optimised photo
    <img
      ref={img}
      src={src}
      alt={alt}
      draggable={false}
      onLoad={() => setLoaded(true)}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ opacity: loaded ? 1 : 0, transition: `opacity ${theme.dur.base}ms ${theme.ease}` }}
    />
  );
}
