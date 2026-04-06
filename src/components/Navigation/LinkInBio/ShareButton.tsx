"use client";

import Link from "next/link";
import { useCallback, type MouseEvent } from "react";
import { PiDotsThreeVertical, PiLink } from "react-icons/pi";

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
      className="flex items-center justify-between gap-2 rounded-sm bg-rose-200 px-4 py-2 text-black hover:underline"
    >
      <PiLink />
      <span className="w-full text-center">{title}</span>
      <button
        className="-m-1 rounded-full p-1 transition-colors hover:bg-rose-300"
        type="button"
        onClick={handleShareClick}
      >
        <PiDotsThreeVertical />
      </button>
    </Link>
  );
}
