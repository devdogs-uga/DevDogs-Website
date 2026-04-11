"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { PiPencilSimpleBold, PiPlusCircleBold, PiSpinnerBold, PiTrashBold, PiXBold } from "react-icons/pi";
import {
  addTestAccount,
  deleteTestAccount,
  updateTestAccount,
  type TestAccount,
} from "~/server/actions/testAccounts";
import FormButton from "./FormButton";

const MAX_TEST_ACCOUNTS = 5;

// ---------------------------------------------------------------------------
// TestAccountDialog — reusable create/edit dialog
// ---------------------------------------------------------------------------

interface TestAccountDialogProps {
  /** When provided, the dialog is in edit mode. */
  account?: TestAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (account: TestAccount) => void;
}

export function TestAccountDialog({
  account,
  open,
  onOpenChange,
  onSuccess,
}: TestAccountDialogProps) {
  const isEdit = account !== undefined;

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (isEdit) {
        await updateTestAccount(formData);
        return {
          ...account,
          displayName: formData.get("displayName") as string,
        } satisfies TestAccount;
      }
      return addTestAccount(formData);
    },
    onSuccess: (result) => {
      onSuccess(result);
      onOpenChange(false);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      mutation.mutate(new FormData(e.currentTarget));
    },
    [mutation],
  );

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 h-dvh w-screen bg-black/40 backdrop-blur-xs" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-70 w-screen max-w-md -translate-1/2 px-2 focus:outline-none"
          onInteractOutside={(e) => mutation.isPending && e.preventDefault()}
          onEscapeKeyDown={(e) => mutation.isPending && e.preventDefault()}
        >
          <div className="flex flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <Dialog.Title className="text-lg font-semibold">
                {isEdit ? "Edit Test Account" : "Add Test Account"}
              </Dialog.Title>
              <Dialog.Close
                className="rounded-sm p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={mutation.isPending}
                aria-label="Close"
              >
                <PiXBold />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-4">
              {isEdit && (
                <input type="hidden" name="authUserId" value={account.userId} />
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-zinc-300">Display Name</span>
                <input
                  className="form-input rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:ring-0"
                  name="displayName"
                  type="text"
                  defaultValue={account?.displayName}
                  placeholder="Jane Doe"
                  maxLength={255}
                  required
                  autoFocus
                />
              </label>

              {mutation.error && (
                <p className="text-sm text-rose-400">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Something went wrong"}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Dialog.Close
                  className="rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-sm text-zinc-300 transition-[background-color,border-color,color] hover:border-zinc-600 hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={mutation.isPending}
                >
                  Cancel
                </Dialog.Close>
                <FormButton
                  type="submit"
                  className="flex items-center gap-1.5 rounded-sm bg-purple-900 px-4 py-1.5 text-sm font-medium ring-purple-950 hover:not-disabled:bg-purple-200 hover:not-disabled:text-purple-950"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <PiSpinnerBold className="animate-spin" />
                  ) : null}
                  {isEdit ? "Save" : "Add"}
                </FormButton>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------
// OAuthTestAccounts — settings card
// ---------------------------------------------------------------------------

interface Props {
  initialAccounts: TestAccount[];
}

export default function OAuthTestAccounts({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<TestAccount[]>(initialAccounts);
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<TestAccount | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteTestAccount,
    onSuccess: (_, authUserId) => {
      setAccounts((prev) => prev.filter((a) => a.userId !== authUserId));
    },
  });

  const handleAdded = useCallback((account: TestAccount) => {
    setAccounts((prev) => [...prev, account]);
  }, []);

  const handleUpdated = useCallback((account: TestAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a.userId === account.userId ? account : a)),
    );
  }, []);

  const atLimit = accounts.length >= MAX_TEST_ACCOUNTS;

  return (
    <section className="w-full overflow-hidden rounded-md border border-zinc-800">
      <div className="flex flex-col gap-4 bg-zinc-900 px-4 py-5 inset-shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Test Accounts</h3>
          {!atLimit && (
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
              onClick={() => setAddOpen(true)}
            >
              <PiPlusCircleBold />
              Add
            </button>
          )}
        </div>

        {accounts.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No test accounts yet.{" "}
            <button
              type="button"
              className="text-zinc-400 underline hover:text-zinc-200"
              onClick={() => setAddOpen(true)}
            >
              Add one
            </button>{" "}
            to use during authorization.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-800">
            {accounts.map((account) => (
              <li
                key={account.userId}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate text-sm font-medium">{account.displayName}</span>
                  <span className="truncate text-xs text-zinc-500">{account.email}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded-sm p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    onClick={() => setEditAccount(account)}
                    aria-label={`Edit ${account.displayName}`}
                  >
                    <PiPencilSimpleBold />
                  </button>
                  <button
                    type="button"
                    className="rounded-sm p-1.5 text-rose-400/80 hover:bg-rose-600/20 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => deleteMutation.mutate(account.userId)}
                    disabled={deleteMutation.isPending && deleteMutation.variables === account.userId}
                    aria-label={`Delete ${account.displayName}`}
                  >
                    <PiTrashBold />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center border-t border-zinc-800 bg-black px-4 py-3">
        <p className="text-xs text-zinc-500">
          {accounts.length}/{MAX_TEST_ACCOUNTS} test accounts &nbsp;·&nbsp; Selected during authorization
        </p>
      </div>

      <TestAccountDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleAdded}
      />
      {editAccount && (
        <TestAccountDialog
          account={editAccount}
          open={editAccount !== null}
          onOpenChange={(o) => { if (!o) setEditAccount(null); }}
          onSuccess={handleUpdated}
        />
      )}
    </section>
  );
}
