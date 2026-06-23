"use client";

import Image from "next/image";
import Link from "next/link";
import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react/ssr";
import devdog from "~/assets/devdog.png";

// ── Context ───────────────────────────────────────────────────────────────────

interface FullscreenNavContextValue {
  isOpen: boolean;
  open: (origin: string) => void;
  close: () => void;
  toggle: (origin: string) => void;
}

const FullscreenNavContext = createContext<FullscreenNavContextValue | null>(
  null,
);

export function useFullscreenNav() {
  const ctx = useContext(FullscreenNavContext);
  if (!ctx)
    throw new Error(
      "useFullscreenNav must be used within FullscreenNavProvider",
    );
  return ctx;
}

// ── Overlay ───────────────────────────────────────────────────────────────────

function FullscreenNavOverlay({
  origin,
  closing,
  onClose,
}: {
  origin: string;
  closing: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-60 flex flex-col bg-black"
      style={
        {
          "--menu-origin": origin,
          animation: closing
            ? "menu-collapse 0.38s cubic-bezier(0.4,0,0.2,1) forwards"
            : "menu-expand 0.38s cubic-bezier(0.4,0,0.2,1) forwards",
        } as React.CSSProperties
      }
    >
      <div className="flex h-18 shrink-0 items-center justify-between px-4 md:h-19 md:px-6">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 lg:gap-2.5"
        >
          <figure className="size-7 shrink-0">
            <Image alt="" src={devdog} />
          </figure>
          <span className="font-display text-lg font-semibold text-white">
            DevDogs
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="flex size-10 items-center justify-center rounded-sm text-xl text-mauve-300 transition-colors hover:bg-mauve-800 hover:text-white"
        >
          <XIcon />
        </button>
      </div>
      <nav className="flex flex-1 flex-col justify-center gap-0 px-6 md:px-10">
        <Link
          href="/events"
          onClick={onClose}
          className="font-display border-b border-mauve-800/50 py-4 text-5xl font-extrabold text-white transition-colors hover:text-cyan-400 md:text-6xl lg:text-7xl"
        >
          Events
        </Link>
        <Link
          href="mailto:devdogs@uga.edu"
          onClick={onClose}
          className="font-display border-b border-mauve-800/50 py-4 text-5xl font-extrabold text-white transition-colors hover:text-cyan-400 md:text-6xl lg:text-7xl"
        >
          Partners
        </Link>
        <Link
          href="/join"
          onClick={onClose}
          className="font-display py-4 text-5xl font-extrabold text-cyan-400 transition-colors hover:text-white md:text-6xl lg:text-7xl"
        >
          Join DevDogs →
        </Link>
      </nav>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function FullscreenNavProvider({ children }: { children: ReactNode }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [menuOrigin, setMenuOrigin] = useState("calc(100% - 46px) 36px");

  const isOpen = menuVisible && !menuClosing;

  const open = useCallback((origin: string) => {
    setMenuOrigin(origin);
    setMenuClosing(false);
    setMenuVisible(true);
  }, []);

  const close = useCallback(() => {
    setMenuClosing(true);
    setTimeout(() => {
      setMenuVisible(false);
      setMenuClosing(false);
    }, 380);
  }, []);

  const toggle = useCallback(
    (origin: string) => {
      if (menuVisible && !menuClosing) close();
      else if (!menuVisible) open(origin);
    },
    [menuVisible, menuClosing, open, close],
  );

  useEffect(() => {
    document.body.style.overflow = menuVisible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuVisible]);

  return (
    <FullscreenNavContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      {menuVisible && (
        <FullscreenNavOverlay
          origin={menuOrigin}
          closing={menuClosing}
          onClose={close}
        />
      )}
    </FullscreenNavContext.Provider>
  );
}

// ── Trigger ───────────────────────────────────────────────────────────────────

// Wraps any button element, merging data-state="open"/"closed" and the toggle
// handler onto the child — following the Radix data-attribute pattern so the
// child can style its open state purely via CSS/Tailwind (data-[state=open]:...).
export function FullscreenNavTrigger({ children }: { children: ReactElement }) {
  const { toggle, isOpen } = useFullscreenNav();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cloneElement(children as ReactElement<Record<string, any>>, {
    "data-state": isOpen ? "open" : "closed",
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      (children.props as { onClick?: React.MouseEventHandler }).onClick?.(e);
      const rect = e.currentTarget.getBoundingClientRect();
      toggle(
        `${Math.round(rect.left + rect.width / 2)}px ${Math.round(rect.top + rect.height / 2)}px`,
      );
    },
  });
}
