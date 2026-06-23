"use client";

import { useActionState } from "react";
import { LuRefreshCw } from "react-icons/lu";
import oauthAction from "~/server/actions/oauth";
import type { getModerationPageData } from "~/server/loaders/moderation";
import FormButton from "~/components/FormButton";
import Input from "~/components/Input";

type ModerationData = Awaited<ReturnType<typeof getModerationPageData>>;

export default function ModerationReportingField({
  clientId: initialClientId,
}: ModerationData) {
  const [{ reportApiKey }, dispatch, isPending] = useActionState(oauthAction, {
    clientId: initialClientId,
    clientSecret: null,
    redirectUris: [],
    reportApiKey: null,
    webhookSecret: null,
    reportWebhookUrl: null,
  });

  return (
    <div className="flex flex-col gap-1.5">
      {reportApiKey && (
        <Input mono copy className="max-w-md" value={reportApiKey} />
      )}

      <form action={dispatch} className="self-start">
        <input type="hidden" name="intent" value="generate-report-key" />
        <FormButton
          theme="black"
          disabled={isPending}
          type="submit"
          className="text-sm text-nowrap"
        >
          <LuRefreshCw /> {reportApiKey ? "Regenerate" : "Generate"} Report API
          Key
        </FormButton>
      </form>
    </div>
  );
}
