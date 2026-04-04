import { redirect } from "next/navigation";
import SettingsNavigation from "~/components/SettingsNavigation";
import UnderConstruction from "~/components/UnderConstruction";
import { expectUserWith } from "~/server/auth";

export default async function Settings() {
  await expectUserWith({}).catch(() => redirect("/api/auth"));
  return (
    <SettingsNavigation title="Feedback" pathname="/settings/feedback">
      <UnderConstruction />
    </SettingsNavigation>
  );
}
