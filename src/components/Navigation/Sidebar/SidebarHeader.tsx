"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/ssr";
import devdog from "~/assets/devdog.png";
import { FullscreenNavTrigger, useFullscreenNav } from "../FullscreenNav";
import { CollapsedSearchTrigger } from "./SidebarSearch";

const labelMotion = {
  initial: { opacity: 0, width: 0 },
  animate: { opacity: 1, width: "auto" },
  exit: { opacity: 0, width: 0 },
  transition: { duration: 0.18 },
};

export default function SidebarHeader() {
  const { isOpen: isNavOpen } = useFullscreenNav();

  return (
    <div className="flex h-9 items-center">
      <motion.h1
        className="contents"
      >
        <Link
          href="/"
          className="flex items-center overflow-hidden not-group-data-expanded/sidebar:w-0 flex-1 rounded-sm w-full py-1 text-white transition-colors hover:bg-mauve-800"
        >
          <span className="flex shrink-0 items-center justify-center pl-1.75">
            <figure className="size-6">
              <Image alt="" src={devdog} />
            </figure>
          </span>
          <span className="font-display overflow-hidden text-lg font-semibold whitespace-nowrap pl-[1ch] pr-1.75">
            DevDogs
          </span>
        </Link>
      </motion.h1>

      <FullscreenNavTrigger>
        <button
          type="button"
          aria-label={isNavOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isNavOpen}
          className="flex shrink-0 items-center justify-center rounded-sm px-2.5 py-2 text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-white"
        >
          <DotsSixVerticalIcon />
        </button>
      </FullscreenNavTrigger>
    </div>
  );
}
