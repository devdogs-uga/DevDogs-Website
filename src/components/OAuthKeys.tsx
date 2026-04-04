"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type PropsWithChildren,
} from "react";
import {
  PiArrowsClockwiseBold,
  PiArrowUpBold,
  PiCircleNotchBold,
  PiXBold,
} from "react-icons/pi";
import isLocalUri from "~/lib/isLocalUri";
import oauthAction from "~/server/actions/oauth";
import CopyInput from "./CopyInput";
import FormButton from "./FormButton";

interface Props {
  oauthUrl: string;
  clientId: string | null;
  redirectUris: string[];
}

type PendingIntent = "reset-secret" | "toggle-client";

function MonoText({ children }: PropsWithChildren) {
  return (
    <span className="cursor-default rounded-sm bg-zinc-800 px-1.25 py-0.5 font-mono text-rose-300">
      {children}
    </span>
  );
}

export default function OAuthKeys({
  oauthUrl,
  clientId: defaultClientId,
  redirectUris: defaultRedirectUris,
}: Props) {
  const [pendingIntent, setPendingIntent] = useState<PendingIntent | null>(
    null,
  );
  const [{ clientId, clientSecret, redirectUris }, dispatch, isPending] =
    useActionState(oauthAction, {
      clientId: defaultClientId,
      clientSecret: null,
      redirectUris: defaultRedirectUris,
    });

  const handleRedirectUriInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.currentTarget.setCustomValidity(
        isLocalUri(e.currentTarget.value)
          ? ""
          : "Only local and internal URLs are supported.",
      );
    },
    [],
  );

  useEffect(() => {
    if (!isPending) {
      setPendingIntent(null);
    }
  }, [isPending]);

  const oauthEnabled = clientId !== null;
  return (
    <AlertDialog.Root
      open={pendingIntent !== null}
      onOpenChange={(open) => {
        if (!open) setPendingIntent(null);
      }}
    >
      <div
        className="group flex flex-col"
        data-disabled={!oauthEnabled || undefined}
      >
        <div className="flex flex-col justify-between gap-6.5 bg-zinc-900 px-4 py-5 inset-shadow-sm">
          <h3 className="text-xl font-bold">OAuth</h3>

          <div className="contents group-data-disabled:cursor-not-allowed group-data-disabled:*:pointer-events-none group-data-disabled:*:opacity-50">
            <label className="flex flex-col gap-1.5">
              <span className="text-zinc-300">Client ID</span>
              <CopyInput
                value={clientId ?? "•••••••••••••••••"}
                disabled={clientId === null}
              />
            </label>

            <div className="flex w-full max-w-md flex-col items-start gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-zinc-300">Client Secret</span>
                <p className="pb-1.5 text-xs text-balance text-zinc-400 sm:text-left">
                  Client secrets cannot be accessed after they are generated:
                  store them safely in your project&rsquo;s{" "}
                  <MonoText>.env</MonoText> file!
                </p>

                <CopyInput
                  value={clientSecret ?? "•••••••••••••••••"}
                  disabled={clientSecret === null}
                />
              </label>

              <FormButton
                className="self-end rounded-sm bg-purple-900 px-3 py-1 text-sm font-medium text-nowrap ring-purple-950 hover:not-disabled:bg-purple-200 hover:not-disabled:text-purple-950"
                disabled={isPending}
                type="button"
                onClick={() => setPendingIntent("reset-secret")}
              >
                <PiArrowsClockwiseBold /> Reset Client Secret
              </FormButton>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-zinc-300">OAuth URL</span>
              <p className="pb-1.5 text-xs text-balance text-zinc-400 sm:text-left">
                <span className="block">
                  Authorization endpoint:{" "}
                  <MonoText>GET /auth/v1/oauth/authorize</MonoText>
                </span>
                <span className="block">
                  Token endpoint: <MonoText>POST /auth/v1/oauth/token</MonoText>
                </span>
              </p>
              <CopyInput
                value={oauthEnabled ? oauthUrl : "•••••••••••••••••"}
                disabled={!oauthEnabled}
              />
            </label>

            <div className="flex flex-col gap-1.5 pb-1">
              <h4 className="text-zinc-300">Redirect URIs</h4>

              <p className="max-w-prose text-xs text-balance text-zinc-400 sm:text-left">
                Redirect URIs can only reference local and internal hosts (e.g.,
                <MonoText>127.0.0.1</MonoText> or <MonoText>0.0.0.0</MonoText>
                ).
              </p>

              <ul className="flex flex-col gap-3 py-3 empty:hidden">
                {redirectUris.map((uri) => (
                  <li key={uri} className="flex items-center gap-1.5 text-sm">
                    <form action={dispatch}>
                      <input type="hidden" name="intent" value="remove-uri" />
                      <input type="hidden" name="uri" value={uri} />
                      <button
                        className="rounded-sm p-1.25 text-rose-400/80 hover:not-disabled:bg-rose-600/20 hover:not-disabled:text-rose-300"
                        type="submit"
                        aria-label={`Remove ${uri}`}
                      >
                        <PiXBold />
                      </button>
                    </form>
                    <MonoText>{uri}</MonoText>
                  </li>
                ))}
              </ul>

              <form action={dispatch} className="flex max-w-md gap-1.5">
                <input type="hidden" name="intent" value="add-uri" />
                <label className="flex w-full max-w-md overflow-hidden rounded-sm border border-zinc-700 bg-zinc-950 ring-0 ring-zinc-400 transition-shadow focus-within:ring-1 has-disabled:cursor-not-allowed">
                  <input
                    className="form-input w-full border-0 bg-zinc-950 px-3 font-mono inset-shadow-sm placeholder:text-zinc-600 focus:ring-0 disabled:pointer-events-none disabled:text-zinc-600"
                    name="uri"
                    type="url"
                    placeholder="http://localhost:3000/api/auth"
                    onChange={handleRedirectUriInputChange}
                    required
                  />
                </label>
                <FormButton
                  className="rounded-sm bg-purple-900 px-4 py-1 font-medium text-nowrap ring-purple-950 hover:not-disabled:bg-purple-200 hover:not-disabled:text-purple-950"
                  type="submit"
                >
                  <PiArrowUpBold />
                  Add
                </FormButton>
              </form>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 border-t border-zinc-800 bg-black p-4 font-medium sm:flex-row sm:justify-between">
          <p className="mt-1 max-w-prose text-sm text-balance text-zinc-400">
            {oauthEnabled
              ? "Your OAuth client is active. You can use it to authenticate users via DevDogs during project development."
              : "Enable OAuth to generate credentials for authenticating users via DevDogs during project development."}
          </p>

          <form
            className="contents"
            action={oauthEnabled ? undefined : dispatch}
            onSubmit={
              oauthEnabled
                ? (e) => {
                    e.preventDefault();
                    setPendingIntent("toggle-client");
                  }
                : undefined
            }
          >
            {!oauthEnabled && (
              <input type="hidden" name="intent" value="toggle-client" />
            )}
            <button
              className="group relative h-7 w-16 rounded-full border-3 border-zinc-700 bg-zinc-700 ring ring-zinc-600 transition-colors data-enabled:border-zinc-900 data-enabled:bg-zinc-900 data-enabled:ring-zinc-600"
              type="submit"
              data-on={oauthEnabled || isPending || undefined}
              data-pending={isPending || undefined}
              data-enabled={oauthEnabled || undefined}
            >
              <span className="absolute top-0 left-0 flex aspect-square h-full items-center justify-center rounded-full bg-zinc-400 shadow-sm transition-[left,translate,background-color] ease-out group-data-enabled:bg-white group-data-on:left-full group-data-on:-translate-x-full">
                <PiCircleNotchBold className="size-3.5 animate-spin text-zinc-700 opacity-0 transition-opacity group-data-pending:opacity-100" />
              </span>
            </button>
          </form>
        </div>

        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-70 h-dvh w-screen bg-black/40 backdrop-blur-xs" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 z-70 w-screen max-w-md -translate-1/2 px-2">
            <form
              className="flex flex-col gap-6 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-6 text-zinc-300 shadow-xl"
              action={dispatch}
            >
              <input type="hidden" name="intent" value={pendingIntent ?? ""} />

              {pendingIntent === "reset-secret" && (
                <>
                  <AlertDialog.Title className="text-lg font-semibold text-white">
                    Reset Client Keys
                  </AlertDialog.Title>
                  <AlertDialog.Description>
                    Resetting your client keys invalidates your existing client
                    ID and secret. This means you won&rsquo;t be able to
                    continue using them in your projects.
                  </AlertDialog.Description>
                  <div className="flex items-center justify-end gap-4">
                    <AlertDialog.Cancel className="rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-1 shadow-xs transition-[background-color,color,border-color,box-shadow] hover:border-zinc-600 hover:bg-zinc-700 hover:text-white hover:shadow-sm">
                      Cancel
                    </AlertDialog.Cancel>
                    <FormButton
                      className="rounded-sm bg-rose-900 px-4 py-1 ring-rose-900 inset-ring-rose-900 hover:bg-rose-100 hover:text-rose-950"
                      disabled={isPending}
                      type="submit"
                    >
                      Reset
                    </FormButton>
                  </div>
                </>
              )}

              {pendingIntent === "toggle-client" && (
                <>
                  <AlertDialog.Title className="text-lg font-semibold text-white">
                    {oauthEnabled ? "Disable OAuth" : "Enable OAuth"}
                  </AlertDialog.Title>
                  <AlertDialog.Description>
                    {oauthEnabled
                      ? "Disabling OAuth will delete your client ID and secret. Any projects using them will lose access immediately."
                      : "This will create a new OAuth client."}
                  </AlertDialog.Description>
                  <div className="flex items-center justify-end gap-4">
                    <AlertDialog.Cancel className="rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-1 shadow-xs transition-[background-color,color,border-color,box-shadow] hover:border-zinc-600 hover:bg-zinc-700 hover:text-white hover:shadow-sm">
                      Cancel
                    </AlertDialog.Cancel>
                    <FormButton
                      className={
                        oauthEnabled
                          ? "rounded-sm bg-rose-900 px-4 py-1 ring-rose-900 inset-ring-rose-900 hover:bg-rose-100 hover:text-rose-950"
                          : "rounded-sm bg-purple-900 px-4 py-1 ring-purple-950 hover:bg-purple-200 hover:text-purple-950"
                      }
                      disabled={isPending}
                      type="submit"
                    >
                      {oauthEnabled ? "Disable" : "Enable"}
                    </FormButton>
                  </div>
                </>
              )}
            </form>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </div>
    </AlertDialog.Root>
  );
}
