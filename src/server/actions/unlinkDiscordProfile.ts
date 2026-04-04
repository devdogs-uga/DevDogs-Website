"use server";
import { refresh } from "next/cache";
import { authenticate, expectSession } from "../auth";
import { unlinkProfile } from "../auth/providers/discord";

export default async function unlinkDiscordProfile() {
  await expectSession().catch(() =>
    authenticate("google", "/settings/accounts"),
  );
  await unlinkProfile();
  refresh();
}
