"use client";

import Script from "next/script";
import { useInsertionEffect, useState } from "react";
// const DEFAULT_SIDEBAR_WIDTH = "256px";

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);

  useInsertionEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${sidebarWidth}px`,
    );
    document.cookie = `--sidebar-width=${sidebarWidth}`;
  }, [sidebarWidth]);

  return [sidebarWidth, setSidebarWidth] as const;
}

/** Inline script that reads sidebar cookies and sets CSS custom properties before React renders, preventing layout shift with PPR. */
export default function SidebarWidthScript() {
  return (
    // <script
    //   dangerouslySetInnerHTML={{
    //     __html: `(function(){var c=document.cookie;var d=document.documentElement;var collapsed=/appSidebarCollapsed=true/.test(c);var w=(c.match(/appSidebarWidth=(\\d+)/)||[])[1]||256;d.style.setProperty('--sidebar-w',collapsed?'64px':w+'px');if(collapsed)d.dataset.sidebarCollapsed='true'})()`,
    //   }}
    // />
    <Script strategy="beforeInteractive">{`
      const sidebarW = parseInt(decodeURIComponent(document.cookie).split(";").find(s => s.startsWith("--sidebar-width="))?.split("=")?.[1]);
      if (!isNaN(sidebarW)) document.documentElement.style.setProperty("--sidebar-width", sidebarW + "px");
    `}</Script>
  );
}
