import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { parse } from "dotenv";
import { PROVIDER_SCOPES } from "./config.js";
/**
 * Runs `supabase status -o env` in `cwd` and extracts the local API URL and
 * service role key. Throws a descriptive error if Supabase isn't running or
 * the CLI isn't installed.
 */
export function detectLocalSupabase(cwd) {
    let output;
    try {
        output = execSync("supabase status -o env", {
            cwd,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
    }
    catch (err) {
        if (err.code === "ENOENT") {
            throw new Error("supabase CLI not found — install it from https://supabase.com/docs/guides/cli");
        }
        const stderr = err.stderr?.trim();
        throw new Error(stderr || (err instanceof Error ? err.message : String(err)));
    }
    const env = parse(output);
    const apiUrl = env["API_URL"];
    const serviceRoleKey = env["SERVICE_ROLE_KEY"];
    if (!apiUrl || !serviceRoleKey) {
        throw new Error("Could not find API_URL or SERVICE_ROLE_KEY in `supabase status` output");
    }
    return { apiUrl, serviceRoleKey };
}
/**
 * Creates or updates the `custom:devdogs` provider on a local Supabase
 * instance using the Admin SDK. Returns the resulting identifier and issuer.
 */
export async function checkProvider({ apiUrl, serviceRoleKey }, identifier) {
    const supabase = createClient(apiUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.auth.admin.customProviders.getProvider(identifier);
    if (error && error.status !== 404)
        throw error;
    return {
        exists: !!data,
        name: data?.name ?? undefined,
        issuer: data?.issuer ?? undefined,
    };
}
export async function upsertDevDogsProvider({ apiUrl, serviceRoleKey }, { identifier, name, clientId, clientSecret, issuer, }) {
    const supabase = createClient(apiUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: existing, error: getError } = await supabase.auth.admin.customProviders.getProvider(identifier);
    // 404 just means the provider doesn't exist yet — any other error is real.
    if (getError && getError.status !== 404) {
        throw getError;
    }
    if (existing) {
        const { data, error } = await supabase.auth.admin.customProviders.updateProvider(identifier, {
            name,
            client_id: clientId,
            client_secret: clientSecret,
            issuer,
            scopes: PROVIDER_SCOPES,
            enabled: true,
        });
        if (error)
            throw error;
        if (!data)
            throw new Error("updateProvider returned no data");
        return { identifier: data.identifier, issuer: data.issuer ?? issuer };
    }
    const { data, error } = await supabase.auth.admin.customProviders.createProvider({
        provider_type: "oidc",
        identifier,
        name,
        client_id: clientId,
        client_secret: clientSecret,
        issuer,
        scopes: PROVIDER_SCOPES,
        enabled: true,
    });
    if (error)
        throw error;
    if (!data)
        throw new Error("createProvider returned no data");
    return { identifier: data.identifier, issuer: data.issuer ?? issuer };
}
