/**
 * Writes `values` into `.env.local` in `cwd`, updating any existing
 * `KEY=...` lines in place and appending keys that aren't present yet.
 * Leaves all other lines (comments, unrelated vars) untouched.
 */
export declare function upsertEnvLocal(cwd: string, values: Record<string, string>): void;
