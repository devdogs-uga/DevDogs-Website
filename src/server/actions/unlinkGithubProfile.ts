"use server";
import { refresh } from "next/cache";
import { authenticate, expectSession } from "../auth";
import { unlinkProfile } from "../auth/providers/github";

export default async function unlinkGithubProfile() {
  await expectSession().catch(() =>
    authenticate("google", "/settings/accounts"),
  );
  await unlinkProfile();
  refresh();
}
