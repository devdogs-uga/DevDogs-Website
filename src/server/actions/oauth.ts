"use server";

import { eq } from "drizzle-orm";
import { authenticate, expectUserWith } from "../auth";
import { db } from "../db";
import { onboarding } from "../db/schema/tables";
import { supabaseAdmin } from "../supabaseAdmin";
import isLocalUri from "~/lib/isLocalUri";

const DEFAULT_REDIRECT_URIS = [
  "http://localhost:3000/api/auth", // Community Resource Forum
];

export type OAuthState = {
  clientId: string | null;
  clientSecret: string | null;
  redirectUris: string[];
};

export default async function oauthAction(
  prev: OAuthState,
  formData: FormData,
): Promise<OAuthState> {
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const intent = formData.get("intent")?.toString();

  const user = await expectUserWith({
    onboarding: { columns: { oauthClientId: true } },
  }).catch(() => authenticate("google", "/settings/keys"));

  const clientId = user.onboarding?.oauthClientId;

  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (intent) {
    case "toggle-client": {
      if (clientId) {
        await db.transaction(async (tx) => {
          await tx
            .update(onboarding)
            .set({ oauthClientId: null })
            .where(eq(onboarding.userId, user.id));
          await supabaseAdmin.auth.admin.oauth.deleteClient(clientId);
        });
        return { clientId: null, clientSecret: null, redirectUris: [] };
      }

      const { data, error } = await supabaseAdmin.auth.admin.oauth.createClient(
        {
          client_name: user.id,
          redirect_uris: DEFAULT_REDIRECT_URIS,
        },
      );
      if (error ?? !data) throw new Error("Failed to create OAuth client");

      await db
        .update(onboarding)
        .set({ oauthClientId: data.client_id })
        .where(eq(onboarding.userId, user.id));

      return {
        clientId: data.client_id,
        clientSecret: null,
        redirectUris: DEFAULT_REDIRECT_URIS,
      };
    }

    case "reset-secret": {
      if (!clientId) throw new Error("No OAuth client exists");

      const { data, error } =
        await supabaseAdmin.auth.admin.oauth.regenerateClientSecret(clientId);
      if (error || !data)
        throw new Error(`Failed to regenerate client secret: ${error?.message}`);

      return { ...prev, clientId, clientSecret: data.client_secret ?? null };
    }

    case "add-uri": {
      if (!clientId) throw new Error("No OAuth client exists");

      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const uri = formData.get("uri")?.toString().trim() ?? "";
      if (!isLocalUri(uri))
        throw new Error(
          "Redirect URIs must use http:// and point to localhost or a local IP address",
        );

      const { data: existing, error: getError } =
        await supabaseAdmin.auth.admin.oauth.getClient(clientId);
      if (getError || !existing)
        throw new Error(`Failed to fetch OAuth client: ${getError?.message}`);

      if (existing.redirect_uris.includes(uri)) return prev;

      const updated = [...existing.redirect_uris, uri];
      await supabaseAdmin.auth.admin.oauth.updateClient(clientId, {
        redirect_uris: updated,
      });
      return { ...prev, redirectUris: updated };
    }

    case "remove-uri": {
      if (!clientId) throw new Error("No OAuth client exists");

      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const uri = formData.get("uri")?.toString().trim() ?? "";

      const { data: existing, error: getError } =
        await supabaseAdmin.auth.admin.oauth.getClient(clientId);
      if (getError || !existing)
        throw new Error(`Failed to fetch OAuth client: ${getError?.message}`);

      const updated = existing.redirect_uris.filter((u) => u !== uri);
      await supabaseAdmin.auth.admin.oauth.updateClient(clientId, {
        redirect_uris: updated,
      });
      return { ...prev, redirectUris: updated };
    }

    default:
      throw new Error(`Unknown intent: ${String(intent)}`);
  }
}