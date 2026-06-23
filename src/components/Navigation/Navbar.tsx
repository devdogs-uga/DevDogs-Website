"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import devdog from "~/assets/devdog.png";
import { FullscreenNavTrigger, useFullscreenNav } from "./FullscreenNav";
import JoinUsButton from "./JoinUsButton";
import LinkInBio from "./LinkInBio";
import { SearchMobileTrigger } from "./Sidebar/SidebarSearch";

export default function Navbar() {
  const { isOpen: isNavOpen, close: closeNav } = useFullscreenNav();

  // Link-in-bio has its own independent state — it's not the fullscreen nav.
  const [libOpen, setLibOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isFromLinkInBio = useMemo(
    () =>
      searchParams
        .getAll("utm_content")
        .some((s) => s.toLowerCase().replaceAll(/[^a-z]/g, "") === "linkinbio"),
    [searchParams],
  );

  useEffect(() => {
    if (isFromLinkInBio) setLibOpen(true);
  }, [isFromLinkInBio]);

  // Scroll-hide: slide nav out on scroll-down, back in on scroll-up.
  // Pause while any overlay is open so nav stays visible.
  const anyOpen = isNavOpen || libOpen;
  useEffect(() => {
    const onScroll = () => {
      if (anyOpen) return;
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (navRef.current) {
        if (delta > 5 && y > 80) {
          navRef.current.style.transform = "translateY(-100%)";
        } else if (delta < -5) {
          navRef.current.style.transform = "translateY(0)";
        }
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [anyOpen]);

  // Restore nav bar visibility when an overlay opens.
  useEffect(() => {
    if (anyOpen && navRef.current)
      navRef.current.style.transform = "translateY(0)";
  }, [anyOpen]);

  // Body scroll lock for link-in-bio panel (fullscreen nav lock is in provider).
  useEffect(() => {
    if (!libOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [libOpen]);

  // Close overlays on route change.
  useEffect(() => {
    if (isNavOpen && !isFromLinkInBio) closeNav();
    if (libOpen) setLibOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleLib = useCallback(() => setLibOpen((o) => !o), []);

  // Link-in-bio mode: hamburger controls the LiB panel directly.
  const libHamburger = (
    <button
      type="button"
      onClick={toggleLib}
      data-state={libOpen ? "open" : "closed"}
      aria-label={libOpen ? "Close menu" : "Open menu"}
      aria-expanded={libOpen}
      className="group flex size-10 flex-col items-end justify-center gap-1.5 rounded-sm pr-2 pl-2.5 text-mauve-300 transition-colors hover:bg-mauve-800 hover:text-white"
    >
      <span className="block h-0.5 w-full bg-current transition-all duration-300 group-data-[state=open]:translate-y-1 group-data-[state=open]:rotate-45" />
      <span className="block h-0.5 w-3 bg-current transition-all duration-300 group-data-[state=open]:w-full group-data-[state=open]:-translate-y-1 group-data-[state=open]:-rotate-45" />
    </button>
  );

  // Normal mode: hamburger is a FullscreenNavTrigger so it inherits data-state
  // from the provider and the click sets the animation origin automatically.
  const navHamburger = (
    <FullscreenNavTrigger>
      <button
        type="button"
        aria-label={isNavOpen ? "Close menu" : "Open menu"}
        aria-expanded={isNavOpen}
        className="group flex size-10 flex-col items-end justify-center gap-1.5 rounded-sm pr-2 pl-2.5 text-mauve-300 transition-colors hover:bg-mauve-800 hover:text-white"
      >
        <span className="block h-0.5 w-full bg-current transition-all duration-300 group-data-[state=open]:translate-y-1 group-data-[state=open]:rotate-45" />
        <span className="block h-0.5 w-3 bg-current transition-all duration-300 group-data-[state=open]:w-full group-data-[state=open]:-translate-y-1 group-data-[state=open]:-rotate-45" />
      </button>
    </FullscreenNavTrigger>
  );

  return (
    <>
      {/* ── Fixed navbar — slides out on scroll-down, back in on scroll-up ── */}
      <div
        ref={navRef}
        className="sticky inset-x-0 top-0 z-70 flex h-18 translate-y-0 items-center overflow-hidden border-b-4 border-rose-500 bg-mauve-950 px-4 transition-transform duration-300 md:h-19 md:px-6"
      >
        <Link
          href="/"
          className="relative z-10 flex items-center gap-2 lg:gap-2.5"
        >
          <figure className="size-7 shrink-0">
            <Image alt="" src={devdog} />
          </figure>
          <span className="font-display text-lg font-semibold text-white">
            DevDogs
          </span>
        </Link>

        <div className="relative z-10 ml-auto flex items-center gap-2">
          {isFromLinkInBio ? libHamburger : navHamburger}
          {!isFromLinkInBio && <SearchMobileTrigger />}
          {!isFromLinkInBio && <JoinUsButton />}
        </div>
      </div>

      {/* ── Link-in-bio panel ── */}
      {isFromLinkInBio && libOpen && (
        <div className="fixed inset-0 top-18 z-40 flex flex-col bg-mauve-900 md:top-19">
          <div className="flex grow flex-col justify-center px-3">
            <LinkInBio />
          </div>
        </div>
      )}
    </>
  );
}
