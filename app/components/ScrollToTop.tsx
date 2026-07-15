"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Sube al inicio de la página cada vez que cambia la ruta (navegación).
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
