"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
  type SubmitEvent,
} from "react";
import FormButton from "./FormButton";

interface Props extends PropsWithChildren {
  title: string;
  description: ReactNode;
  /**
   * The server action to invoke when the user confirms.
   */
  action: (formData: FormData) => Promise<void> | void;
  /**
   * Label for the submit button.
   */
  submitLabel: string;
  /**
   * If provided, the user must type this exact string into a confirmation
   * input before the confirm button activates.
   */
  userConfirmText?: string;
}

export default function ConfirmDestructiveAction({
  title,
  description,
  action,
  submitLabel,
  userConfirmText,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);

  const disableConfirmButton = useMemo(
    () => userConfirmText !== undefined && userConfirmText !== typed,
    [userConfirmText, typed],
  );

  const handleSubmit = useCallback((e: SubmitEvent<HTMLFormElement>) => {
    if (confirmed.current) {
      confirmed.current = false;
      return;
    }

    e.preventDefault();
    setOpen(true);
    setTyped("");
  }, []);

  const handleConfirm = useCallback(() => {
    if (formRef.current && !disableConfirmButton) {
      confirmed.current = true;
      formRef.current.requestSubmit();
    }
  }, [disableConfirmButton]);

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <form
        className="contents"
        action={action}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        {children}
      </form>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-70 h-dvh w-screen bg-black/40 backdrop-blur-xs" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-70 w-screen max-w-md -translate-1/2 px-2">
          <div className="flex flex-col gap-6 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-6 text-zinc-300 shadow-xl">
            <AlertDialog.Title className="text-lg font-semibold text-white">
              {title}
            </AlertDialog.Title>

            <AlertDialog.Description>{description}</AlertDialog.Description>

            {userConfirmText !== undefined && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span>
                  Type{" "}
                  <span className="rounded-sm bg-zinc-800 px-1 py-0.5 font-mono text-rose-300">
                    {userConfirmText}
                  </span>{" "}
                  to confirm.
                </span>
                <input
                  className="rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono ring-0 ring-zinc-400 transition-shadow outline-none focus:ring-1"
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                />
              </label>
            )}

            <div className="flex items-center justify-end gap-4">
              <AlertDialog.Cancel className="rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-1 shadow-xs transition-[background-color,color,border-color,box-shadow] hover:border-zinc-600 hover:bg-zinc-700 hover:text-white hover:shadow-sm">
                Cancel
              </AlertDialog.Cancel>

              <AlertDialog.Action asChild>
                <FormButton
                  className="rounded-sm bg-rose-900 px-4 py-1 ring-rose-900 inset-ring-rose-900 hover:not-disabled:bg-rose-100 hover:not-disabled:text-rose-950"
                  disabled={disableConfirmButton}
                  onClick={handleConfirm}
                  type="button"
                >
                  {submitLabel}
                </FormButton>
              </AlertDialog.Action>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
