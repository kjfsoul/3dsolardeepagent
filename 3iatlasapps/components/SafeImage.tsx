"use client";
import Image from "next/image";
import React, { useState } from "react";

type Props = Omit<React.ComponentProps<typeof Image>, 'src' | 'onError'> & { 
  src: string;
  fallbackSrc?: string;
};

export default function SafeImage({ 
  src, 
  alt, 
  fallbackSrc = "/images/placeholder-product.png",
  width,
  height,
  ...rest 
}: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  
  return (
    <Image
      {...rest}
      src={imgSrc || fallbackSrc}
      alt={alt || "Product image"}
      fill={!width && !height}
      width={width}
      height={height}
      sizes={!width ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
