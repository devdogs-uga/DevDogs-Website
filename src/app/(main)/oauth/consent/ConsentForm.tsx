"use client";

import { useActionState, useCallback, useState } from "react";
import { PiCircleNotchBold, PiWarningCircleBold } from "react-icons/pi";
import { TestAccountDialog } from "~/components/OAuthTestAccounts";
import {
  approveTestAccountAuthorization,
  denyOAuthAuthorization,
} from "~/server/actions/consent";
import type { TestAccount } from "~/server/actions/testAccounts";

// ---------------------------------------------------------------------------
// WrongAccountScreen
// ---------------------------------------------------------------------------

interface WrongAccountScreenProps {
  authorizationId: string;
  clientName: string;
}

export function WrongAccountScreen({ authorizationId, clientName }: WrongAccountScreenProps) {
  const [denyState, denyAction, denying] = useActionState(denyOAuthAuthorization, null);

  const handleSwitchAccount = useCallback(() => {
    const callbackPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    window.location.href = `/api/auth?callbackPath=${encodeURIComponent(callbackPath)}`;
  }, [authorizationId]);

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10 text-center">
      <PiWarningCircleBold className="text-5xl text-amber-400" />
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Wrong account</h2>
        <p className="text-sm text-zinc-400">
          <strong className="text-zinc-200">{clientName}</strong> belongs to a
          different DevDogs account. Sign in with the account that owns this
          client, or cancel.
        </p>
      </div>
      <form className="flex w-full max-w-xs flex-col gap-2" action={denyAction}>
        <input type="hidden" name="authorization_id" value={authorizationId} />
        <button
          type="button"
          className="w-full rounded-sm bg-purple-900 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-800"
          onClick={handleSwitchAccount}
        >
          Sign in with a different account
        </button>
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-2 font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={denying}
        >
          {denying ? <PiCircleNotchBold className="animate-spin" /> : "Cancel"}
        </button>
        {denyState && <p className="text-sm text-rose-400">{denyState}</p>}
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConsentForm
// ---------------------------------------------------------------------------

interface ConsentFormProps {
  authorizationId: string;
  testAccounts: TestAccount[];
}

export function ConsentForm({
  authorizationId,
  testAccounts: initialAccounts,
}: ConsentFormProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selected, setSelected] = useState<string | null>(
    initialAccounts[0]?.userId ?? null,
  );
  const [addOpen, setAddOpen] = useState(false);

  const [approveState, approveAction, approving] = useActionState(approveTestAccountAuthorization, null);
  const [denyState, denyAction, denying] = useActionState(denyOAuthAuthorization, null);

  const isPending = approving || denying;

  const handleAccountAdded = useCallback((account: TestAccount) => {
    setAccounts((prev) => [...prev, account]);
    setSelected(account.userId);
    setAddOpen(false);
  }, []);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          Your OAuth client is requesting access
        </h2>
        <p className="mt-1 text-sm text-zinc-400">Select a test account to authorize as.</p>
      </div>

      <form action={approveAction} className="flex flex-col gap-6">
        <input type="hidden" name="authorizationId" value={authorizationId} />
        {selected && (
          <input type="hidden" name="testUserId" value={selected} />
        )}

        <div className="flex flex-col gap-2">
          {accounts.length === 0 ? (
            <p className="rounded-sm border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
              No test accounts yet.{" "}
              <button
                type="button"
                className="text-zinc-300 underline hover:text-white"
                onClick={() => setAddOpen(true)}
                disabled={isPending}
              >
                Add one
              </button>{" "}
              to continue.
            </p>
          ) : (
            <>
              {accounts.map((account) => (
                <button
                  key={account.userId}
                  type="button"
                  role="radio"
                  aria-checked={selected === account.userId}
                  className="flex items-center gap-3 rounded-sm border px-4 py-3 text-left transition-colors aria-checked:border-purple-600 aria-checked:bg-purple-950/40 not-aria-checked:border-zinc-700 not-aria-checked:hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setSelected(account.userId)}
                  disabled={isPending}
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-current">
                    {selected === account.userId && (
                      <div className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{account.displayName}</span>
                    {/* <span className="truncate text-xs text-zinc-500">{account.email}</span> */}
                  </div>
                </button>
              ))}

              {accounts.length < 5 && (
                <button
                  type="button"
                  className="text-left text-sm text-zinc-500 underline hover:text-zinc-300 disabled:cursor-not-allowed"
                  onClick={() => setAddOpen(true)}
                  disabled={isPending}
                >
                  + Add another test account
                </button>
              )}
            </>
          )}
        </div>

        {approveState && <p className="text-sm text-rose-400">{approveState}</p>}

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-purple-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending || !selected}
          >
            {approving && <PiCircleNotchBold className="animate-spin" />}
            Authorize
          </button>
          <button
            type="submit"
            formAction={denyAction}
            className="flex w-full items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-2.5 font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
          >
            {denying ? <PiCircleNotchBold className="animate-spin" /> : "Cancel"}
          </button>
          {denyState && <p className="text-sm text-rose-400">{denyState}</p>}
        </div>
      </form>

      <TestAccountDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleAccountAdded}
      />
    </div>
  );
}
