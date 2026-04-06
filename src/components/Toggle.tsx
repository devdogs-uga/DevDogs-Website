"use client";

import { useFormStatus } from "react-dom";
import { PiCircleNotchBold } from "react-icons/pi";

interface Props {
  /**
   * The current state of the toggle. When the form is submitted, the hidden
   * checkbox will carry the opposite value (i.e. the state-to-be).
   */
  checked: boolean;
  /**
   * The `name` of the hidden checkbox input submitted with the form. When
   * omitted, no checkbox is rendered (useful when the form manages its own
   * intent input, as in OAuthKeys).
   */
  name?: string;
  /**
   * Overrides the `useFormStatus` pending state. Pass this when pending state
   * is managed externally (e.g. via `useActionState` across multiple forms).
   */
  pending?: boolean;
  disabled?: boolean;
}

export default function Toggle({ checked, name, pending: pendingProp, disabled }: Props) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;

  return (
    <button
      className="group relative h-[calc(1.5em-4px)] w-full rounded-full border-3 border-zinc-700 bg-zinc-700 outline outline-zinc-600 hover:ring ring-purple-200/80 ring-offset-1 transition-colors data-enabled:border-zinc-900 data-enabled:bg-zinc-900 data-enabled:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
      type="submit"
      name={checked ? undefined : name}
      value={checked ? undefined : "on"}
      disabled={disabled}
      data-on={checked || pending || undefined}
      data-pending={pending || undefined}
      data-enabled={checked || undefined}
    >
      <span className="absolute top-0 left-0 flex aspect-square h-full items-center justify-center rounded-full bg-zinc-400 shadow-sm transition-[left,translate,background-color] ease-out group-data-enabled:bg-white group-data-on:left-full group-data-on:-translate-x-full">
        <PiCircleNotchBold className="size-3.5 animate-spin text-zinc-700 opacity-0 transition-opacity group-data-pending:opacity-100" />
      </span>
    </button>
  );
}
