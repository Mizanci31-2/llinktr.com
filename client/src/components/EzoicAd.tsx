"use client";

import { useEffect, useState } from "react";
import { runEzoic } from "@/lib/ezoic";

type EzoicAdProps = {
  id: number;
  className?: string;
};

export default function EzoicAd({ id, className = "ezoic-ad-container" }: EzoicAdProps) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    setIsRendered(true);
    runEzoic(() => {
      window.ezstandalone?.showAds?.(id);
    });

    return () => {
      runEzoic(() => {
        window.ezstandalone?.destroyPlaceholders?.(id);
      });
    };
  }, [id]);

  return <div className={className}>{isRendered && <div id={`ezoic-pub-ad-placeholder-${id}`} />}</div>;
}
