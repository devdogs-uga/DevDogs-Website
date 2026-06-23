export type LocalSupabaseConfig = {
    apiUrl: string;
    serviceRoleKey: string;
};
/**
 * Runs `supabase status -o env` in `cwd` and extracts the local API URL and
 * service role key. Throws a descriptive error if Supabase isn't running or
 * the CLI isn't installed.
 */
export declare function detectLocalSupabase(cwd: string): LocalSupabaseConfig;
/**
 * Creates or updates the `custom:devdogs` provider on a local Supabase
 * instance using the Admin SDK. Returns the resulting identifier and issuer.
 */
export declare function checkProvider({ apiUrl, serviceRoleKey }: LocalSupabaseConfig, identifier: string): Promise<{
    exists: boolean;
    name?: string;
    issuer?: string;
}>;
export declare function upsertDevDogsProvider({ apiUrl, serviceRoleKey }: LocalSupabaseConfig, { identifier, name, clientId, clientSecret, issuer, }: {
    identifier: string;
    name: string;
    clientId: string;
    clientSecret: string;
    issuer: string;
}): Promise<{
    identifier: string;
    issuer: string;
}>;
