import type { DetailedHTMLProps, InputHTMLAttributes, ReactNode } from "react";
import { PiLockBold } from "react-icons/pi";

interface Props extends Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  "prefix"
> {
  icon: ReactNode;
  prefix?: ReactNode;
}

export default function IconInput({
  icon,
  prefix,
  className,
  ...inputProps
}: Props) {
  return (
    <label className="flex max-w-sm has-disabled:*:cursor-not-allowed group overflow-hidden rounded-sm border border-zinc-700 ring-0 ring-zinc-400 transition-shadow focus-within:ring-1">
      <span className="flex items-center bg-zinc-800 px-3 text-zinc-500">
        {icon}
      </span>
      <span className="pointer-events-none bg-zinc-950 py-2 pl-3 -mr-3 z-10 empty:hidden text-nowrap text-zinc-400">
        {prefix}
      </span>
      <input
        className={
          "form-input w-full border-0 bg-zinc-950 px-3 disabled:text-zinc-300 inset-shadow-sm placeholder:text-zinc-600 focus:ring-0 " +
          className
        }
        {...inputProps}
      />
      {inputProps.readOnly && (
        <span className="text-rose-400/70 group-hover:text-rose-400 transition-colors flex items-center bg-zinc-950 pr-3">
          <PiLockBold />
        </span>
      )}
    </label>
  );
}
