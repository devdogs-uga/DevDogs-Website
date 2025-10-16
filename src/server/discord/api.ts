import { REST } from "@discordjs/rest";
import { env } from "~/env";

export function asUser(accessToken: string) {
  return new REST({
    authPrefix: "Bearer",
    version: "10",
  }).setToken(accessToken);
}

export function asBot() {
  return new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
}
