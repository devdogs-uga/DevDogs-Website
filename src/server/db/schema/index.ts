// There's a bug in the version of Drizzle we're using that prevents these policies from taking effect.

// export const avatarInsertPolicy = pgPolicy("avatar_insert_policy", {
//   as: "permissive",
//   to: authenticatedRole,
//   for: "insert",
//   withCheck: and(
//     eq(objectsInStorage.bucketId, sql.raw(env.NEXT_PUBLIC_AVATARS_BUCKET)),
//     eq(objectsInStorage.name, authUid),
//     eq(objectsInStorage.pathTokens, sql`{${authUid}}`),
//   ),
// }).link(objectsInStorage);

// export const avatarUpdatePolicy = pgPolicy("avatar_update_policy", {
//   as: "permissive",
//   to: authenticatedRole,
//   for: "update",
//   using: and(
//     eq(objectsInStorage.bucketId, sql.raw(env.NEXT_PUBLIC_AVATARS_BUCKET)),
//     eq(objectsInStorage.name, authUid),
//     eq(objectsInStorage.pathTokens, sql`{${authUid}}`),
//   ),
//   withCheck: and(
//     eq(objectsInStorage.bucketId, sql.raw(env.NEXT_PUBLIC_AVATARS_BUCKET)),
//     eq(objectsInStorage.name, authUid),
//     eq(objectsInStorage.pathTokens, sql`{${authUid}}`),
//   ),
// }).link(objectsInStorage);

// export const avatarDeletePolicy = pgPolicy("avatar_delete_policy", {
//   as: "permissive",
//   to: authenticatedRole,
//   for: "update",
//   using: and(
//     eq(objectsInStorage.bucketId, sql.raw(env.NEXT_PUBLIC_AVATARS_BUCKET)),
//     eq(objectsInStorage.name, authUid),
//   ),
// }).link(objectsInStorage);

export * from "./public";
