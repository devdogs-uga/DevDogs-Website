"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { checkPreviewServer } from "@devdogsuga/docs-preview/client";
import { useCallback, useEffect, useState } from "react";
import { LuLoaderCircle } from "react-icons/lu";

const RETRY_SECONDS = 5;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export default function DocsPreviewDialog({
  open,
  onOpenChange,
  onConnected,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(RETRY_SECONDS);
  const [checking, setChecking] = useState(false);

  const attempt = useCallback(async () => {
    setChecking(true);
    const reachable = await checkPreviewServer();
    setChecking(false);
    if (reachable) {
      onConnected();
    } else {
      setSecondsLeft(RETRY_SECONDS);
    }
  }, [onConnected]);

  // Reset the countdown each time the dialog opens.
  useEffect(() => {
    if (open) setSecondsLeft(RETRY_SECONDS);
  }, [open]);

  // Tick the countdown and trigger an automatic retry at zero.
  useEffect(() => {
    if (!open || checking) return;
    if (secondsLeft <= 0) {
      void attempt();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, checking, secondsLeft, attempt]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-black/40 backdrop-blur-xs" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-70 w-[calc(100vw-2rem)] max-w-md -translate-1/2 focus:outline-none">
          <div className="flex flex-col gap-4 rounded-xl border border-mauve-700 bg-mauve-900 px-6 py-6 text-mauve-300 shadow-xl shadow-black/40">
            <Dialog.Title className="text-lg font-semibold text-white">
              Docs Preview server not running
            </Dialog.Title>

            <Dialog.Description className="text-sm">
              Start the local preview server from your project&apos;s root
              directory:
            </Dialog.Description>

            <pre className="rounded-sm bg-mauve-800 px-3 py-2 text-xs text-mauve-300">
              pnpm dlx @devdogsuga/docs-preview
            </pre>

            <p className="flex items-center gap-1.5 text-xs text-mauve-500">
              {checking ? (
                <>
                  <LuLoaderCircle className="animate-spin" />
                  Checking connection…
                </>
              ) : (
                `Retrying connection in ${secondsLeft}s…`
              )}
            </p>

            <div className="flex justify-end gap-2">
              <Dialog.Close className="rounded-sm border border-mauve-700 px-4 py-1.5 text-sm text-mauve-300 transition-colors hover:bg-mauve-800 hover:text-white">
                Go back
              </Dialog.Close>
              <button
                type="button"
                onClick={() => void attempt()}
                disabled={checking}
                className="rounded-sm border-2 border-cyan-400 bg-cyan-400 px-4 py-1.5 text-sm font-medium text-black transition hover:bg-mauve-950 hover:text-cyan-400 disabled:opacity-50"
              >
                Retry now
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
