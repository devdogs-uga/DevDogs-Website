/** Default Supabase project that hosts the "Sign in with DevDogs" OAuth server. */
export declare const DEFAULT_API_URL = "https://api.devdogsuga.org";
/** DevDogs website, used for human-facing links (registering an OAuth client). */
export declare const WEBSITE_URL = "https://devdogsuga.org";
/**
 * Custom OAuth/OIDC provider identifier. Supabase requires custom provider
 * identifiers to be prefixed with "custom:".
 */
export declare const PROVIDER_IDENTIFIER = "custom:devdogs";
export declare const PROVIDER_NAME = "DevDogs";
export declare const PROVIDER_SCOPES: string[];
export declare const ENV_KEYS: {
    readonly baseUrl: "OAUTH_BASE_URL";
    readonly providerName: "OAUTH_PROVIDER_NAME";
    readonly clientId: "OAUTH_CLIENT_ID";
    readonly clientSecret: "OAUTH_CLIENT_SECRET";
};
