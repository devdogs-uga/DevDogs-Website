import { expectUserWith } from "~/server/auth";
import { canSeeCredentialsPage } from "~/server/actions/credentials";
import {
  canUserManageVerification,
  getCallerContext,
  getHighestRankingRole,
} from "~/server/actions/permissions";
import {
  getInvolvementFullName,
  getVerificationStatus,
} from "~/server/loaders/verification";
import type { NavUserData } from "./NavDataProvider";
import type { VerificationData } from "./VerificationProvider";
import { NavDataHydrator } from "./NavDataRoot";

export default async function NavDynamicData() {
  const user = await expectUserWith({ profile: true }).catch(() => null);

  let navData: NavUserData | null = null;
  let verification: VerificationData | null = null;

  if (user) {
    const [
      showCredentials,
      canVerification,
      callerCtx,
      highestRole,
      verificationData,
    ] = await Promise.all([
      canSeeCredentialsPage(user.id),
      canUserManageVerification(user.id).catch(() => false),
      getCallerContext(user.id).catch(() => null),
      getHighestRankingRole(user.id),
      user.profile ? getVerificationStatus(user.id) : Promise.resolve(null),
    ]);

    const hiddenNavHrefs = [
      !showCredentials && "/console/credentials",
      !canVerification && "/console/verification",
      !callerCtx?.resolvedPermissions.canManageRoles && "/console/permissions",
    ].filter(Boolean) as string[];

    navData = {
      profile: user.profile!,
      hiddenNavHrefs,
      highestRole: highestRole ?? { title: "Member", color: null },
    };

    if (user.profile && verificationData) {
      verification = {
        userId: user.id,
        verificationStatus: verificationData.verificationStatus,
        isVerified: verificationData.isVerified,
        involvementFullName: getInvolvementFullName(user.profile),
      };
    }
  }

  return <NavDataHydrator navData={navData} verification={verification} />;
}
