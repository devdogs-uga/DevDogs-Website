"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useSidebar } from ".";
import { useSidebarWidth } from "./SidebarWidthScript";

// const COLLAPSED_COOKIE = "appSidebarCollapsed";
// const WIDTH_COOKIE = "appSidebarWidth";
// const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
// const EXPANDED_W = 256;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_DEFAULT_WIDTH = 256;
const SIDEBAR_MAX_WITH = 400;

export default function SidebarLayout({ children }: PropsWithChildren) {
  const { setExpanded } = useSidebar();
  const [resizePending, setResizePending] = useState(false);

  const setWidth = useCallback((width: number) => {
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
    document.cookie = `--sidebar-width=${width}`;
  }, []);

  const resize = useCallback((e: PointerEvent) => {
    setWidth(e.pageX);
  }, []);

  const startResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setResizePending(true);

    if (e.isPrimary) {
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.addEventListener("pointermove", resize);
    }
  }, []);

  const endResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    e.currentTarget.removeEventListener("pointermove", resize);
    setResizePending(false);

    if (
      parseFloat(
        document.documentElement.style.getPropertyValue("--sidebar-width"),
      ) < SIDEBAR_MIN_WIDTH
    ) {
      setExpanded(false);
      requestAnimationFrame(() => {
        setWidth(SIDEBAR_DEFAULT_WIDTH);
      });
    }
  }, []);

  return (
    <div
      data-pending={resizePending || undefined}
      className="group/resize relative z-50 contents h-screen w-16 flex-col items-end not-data-pending:transition-[width] sm:flex lg:group-data-expanded/sidebar:w-(--sidebar-width)"
      style={{
        maxWidth: `${SIDEBAR_MAX_WITH}px`,
      }}
    >
      <div
        className="absolute contents h-full w-full min-w-0 not-group-data-pending/resize:transition-[min-width] max-lg:group-data-expanded/sidebar:min-w-64 sm:block"
        style={
          resizePending
            ? {
                minWidth: SIDEBAR_MIN_WIDTH,
                opacity: 1,
              }
            : undefined
        }
      >
        {children}
      </div>

      <div
        className="absolute inset-y-0 right-0 z-10 hidden w-1.5 cursor-col-resize transition-colors hover:bg-mauve-700/60 lg:group-data-expanded/sidebar:block"
        onPointerDown={startResize}
        onPointerUp={endResize}
      />
    </div>
  );
}
