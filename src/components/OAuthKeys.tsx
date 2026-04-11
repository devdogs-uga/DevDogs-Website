"use client";

import Link from "next/link";
import { useActionState, type PropsWithChildren } from "react";
import { PiArrowsClockwiseBold, PiArrowUpBold, PiXBold } from "react-icons/pi";
import oauthAction from "~/server/actions/oauth";
import ConfirmDestructiveAction from "./ConfirmDestructiveAction";
import CopyInput from "./CopyInput";
import FormButton from "./FormButton";
import Toggle from "./Toggle";
import { env } from "~/env";

interface Props {
  clientId: string | null;
  redirectUris: string[];
  hasGithub: boolean;
}

function MonoText({ children }: PropsWithChildren) {
  return (
    <span className="cursor-default rounded-sm bg-zinc-800 px-1.25 py-0.5 font-mono text-rose-300">
      {children}
    </span>
  );
}

export default function OAuthKeys({
  clientId: defaultClientId,
  redirectUris: defaultRedirectUris,
  hasGithub,
}: Props) {
  const [{ clientId, clientSecret, redirectUris }, dispatch, isPending] =
    useActionState(oauthAction, {
      clientId: defaultClientId,
      clientSecret: null,
      redirectUris: defaultRedirectUris,
    });

  const atUriLimit = redirectUris.length >= 5;
  const oauthEnabled = clientId !== null;
  return (
    <div
      className="group flex flex-col"
      data-disabled={!oauthEnabled || undefined}
    >
      <div className="flex flex-col justify-between gap-6.5 bg-zinc-900 px-4 py-5 inset-shadow-sm">
        <h3 className="text-xl font-bold">OAuth</h3>

        <div className="contents group-data-disabled:cursor-not-allowed group-data-disabled:*:pointer-events-none group-data-disabled:*:opacity-50">
          <label className="flex flex-col gap-1.5">
            <span>Client ID</span>
            <CopyInput
              value={clientId ?? "•••••••••••••••••"}
              disabled={clientId === null}
            />
          </label>

          <div className="flex w-full max-w-md flex-col items-start gap-3">
            <label className="flex flex-col gap-1.5">
              <span>Client Secret</span>
              <p className="pb-1.5 text-xs text-balance text-zinc-300 sm:text-left">
                Client secrets cannot be accessed after they are generated:
                store them safely in your project&rsquo;s{" "}
                <MonoText>.env</MonoText> file!
              </p>

              <CopyInput
                value={clientSecret ?? "•••••••••••••••••"}
                disabled={clientSecret === null}
              />
            </label>

            <ConfirmDestructiveAction
              action={dispatch}
              title="Reset Client Secret"
              description="Genereating a new client secret invalidates your existing secret. This means you won't be able to continue using your existing secret in your projects."
              userConfirmText="Reset Client Secret"
              submitLabel="Reset"
            >
              <input type="hidden" name="intent" value="reset-secret" />
              <FormButton
                className="self-end rounded-sm bg-rose-900 px-3 py-1 text-sm font-medium text-nowrap ring-rose-950 hover:not-disabled:bg-rose-200 hover:not-disabled:text-rose-950"
                disabled={isPending}
                type="submit"
              >
                <PiArrowsClockwiseBold /> Reset Client Secret
              </FormButton>
            </ConfirmDestructiveAction>
          </div>

          <label className="flex flex-col gap-1.5">
            <span>Base URL</span>
            <p className="pb-1.5 text-xs text-balance text-zinc-300 sm:text-left">
              <span className="block">
                Authorization endpoint:{" "}
                <MonoText>GET /auth/v1/oauth/authorize</MonoText>
              </span>
              <span className="block">
                Token endpoint: <MonoText>POST /auth/v1/oauth/token</MonoText>
              </span>
            </p>
            <CopyInput
              value={
                oauthEnabled
                  ? env.NEXT_PUBLIC_SUPABASE_URL
                  : "•••••••••••••••••"
              }
              disabled={!oauthEnabled}
            />
          </label>

          <div className="flex flex-col gap-1.5 pb-1">
            <h4>Redirect URIs</h4>

            <p className="max-w-prose pb-1.5 text-xs text-balance text-zinc-300 sm:text-left">
              Up to 5 redirect URIs. Must use <MonoText>http://</MonoText> or{" "}
              <MonoText>https://</MonoText>.
            </p>

            <ul className="flex flex-col gap-3 pb-1.5 empty:hidden">
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

            {!atUriLimit && (
              <form action={dispatch} className="flex max-w-md gap-1.5">
                <input type="hidden" name="intent" value="add-uri" />
                <label className="flex w-full max-w-md overflow-hidden rounded-sm border border-zinc-700 bg-zinc-950 ring-0 ring-zinc-400 transition-shadow focus-within:ring-1 has-disabled:cursor-not-allowed">
                  <input
                    className="form-input w-full border-0 bg-zinc-950 px-3 font-mono inset-shadow-sm placeholder:text-zinc-600 focus:ring-0 disabled:pointer-events-none disabled:text-zinc-600"
                    name="uri"
                    type="url"
                    placeholder="https://example.com/callback"
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
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-zinc-800 bg-black p-4 font-medium sm:justify-between">
        <p className="mt-1 max-w-prose text-sm text-balance text-zinc-400">
          {oauthEnabled ? (
            "Your OAuth client is active. You can use it to authenticate users via DevDogs during project development."
          ) : !hasGithub ? (
            <>
              You must{" "}
              <Link
                className="underline hover:text-zinc-200"
                href="/settings/profile#connectedAccounts"
              >
                link a GitHub account
              </Link>{" "}
              before you can create an OAuth client.
            </>
          ) : (
            "Enable OAuth to generate credentials for authenticating users via DevDogs during project development."
          )}
        </p>

        <div className="w-16 text-lg/0">
          {oauthEnabled ? (
            <ConfirmDestructiveAction
              action={dispatch}
              title="Disable OAuth"
              description="Disabling OAuth will delete your client ID and secret. Any projects using them will lose access immediately."
              userConfirmText="Delete OAuth Client"
              submitLabel="Disable"
            >
              <input type="hidden" name="intent" value="toggle-client" />
              <Toggle checked={oauthEnabled} pending={isPending} />
            </ConfirmDestructiveAction>
          ) : (
            <form action={dispatch}>
              <input type="hidden" name="intent" value="toggle-client" />
              <Toggle
                checked={oauthEnabled}
                pending={isPending}
                disabled={!hasGithub}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
