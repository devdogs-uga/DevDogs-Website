"use client";

import Link from "next/link";
import { useCallback, type MouseEvent } from "react";
import { DotsThreeVerticalIcon, LinkIcon } from "@phosphor-icons/react/ssr";

interface Props {
  title: string;
  href: string;
  shareText: string;
}

export default function ShareButton({ title, href, shareText }: Props) {
  const handleShareClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if ("canShare" in navigator && navigator.canShare()) {
        navigator
          .share({
            title,
            url: href,
            text: shareText,
          })
          .catch(console.error);
      } else {
      }
    },
    [title, href, shareText],
  );

  return (
    <Link
      href={href}
      target="_blank"
      className="flex items-center justify-between gap-2 rounded-sm border border-black bg-white px-4 py-2 text-mauve-950 hover:bg-mauve-100"
    >
      <LinkIcon />
      <span className="w-full text-center">{title}</span>
      <button
        className="-m-1 rounded-sm p-1 transition-colors hover:bg-mauve-100"
        type="button"
        onClick={handleShareClick}
      >
        <DotsThreeVerticalIcon />
      </button>
    </Link>
  );
}
