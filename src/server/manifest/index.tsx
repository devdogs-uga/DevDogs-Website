import type { ManifestPage, ManifestRoot } from "./types";

export const appManifest: ManifestRoot = {
  name: "DevDogs",
  children: [
    {
      type: "folder",
      id: "public",
      name: null,
      children: [
        {
          type: "page",
          id: "/",
          name: "Home",
          description:
            "DevDogs is a club at UGA devoted to bettering our community through open-source software.",
          url: "/",
          icon: "House",
          restrictVisibility: false,
          showInSidebar: false,
        },
        {
          type: "page",
          id: "/community",
          name: "Community",
          description: "Meet the members and leadership of DevDogs.",
          url: "/community",
          icon: "Users",
          restrictVisibility: false,
        },
        {
          type: "page",
          id: "/events",
          name: "Events",
          description:
            "Upcoming meetings, workshops, and events hosted by DevDogs.",
          url: "/events",
          icon: "Calendar",
          restrictVisibility: false,
        },
        {
          type: "page",
          id: "/partners",
          name: "Partners",
          description:
            "Organizations and sponsors that partner with DevDogs.",
          url: "/partners",
          icon: "Handshake",
          restrictVisibility: false,
        },
        {
          type: "page",
          id: "/docs",
          name: "Documentation",
          description:
            "Guides, references, and tutorials for DevDogs projects.",
          url: "/docs",
          icon: "BookOpen",
          restrictVisibility: false,
        },
        {
          type: "page",
          id: "/projects",
          name: "Projects",
          description:
            "Open-source projects built and maintained by DevDogs.",
          url: "/projects",
          icon: "FileText",
          restrictVisibility: false,
          showInSidebar: false,
        },
        {
          type: "page",
          id: "/legal/privacy",
          name: "Privacy Policy",
          description:
            "How DevDogs collects, uses, and protects your data.",
          url: "/legal/privacy",
          icon: "Scale",
          restrictVisibility: false,
          showInSidebar: false,
        },
      ],
    },
    {
      type: "folder",
      id: "dev-tools",
      name: "Dev Tools",
      children: [
        {
          type: "page",
          id: "/tools/oauth",
          name: "OAuth",
          description:
            "Set up a local OAuth client to test DevDogs sign-in from your own project.",
          url: "/tools/oauth",
          icon: "Key",
          restrictVisibility: [{}],
          sections: [
            {
              id: "oauth-client",
              title: "OAuth Client",
              restrictVisibility: false,
              fields: [
                {
                  id: "enable-oauth",
                  title: "Enable OAuth",
                  description:
                    "Turns on a local-only OAuth client for your project. Disabling it permanently deletes your client ID and secret.",
                  restrictVisibility: false,
                },
              ],
            },
            {
              id: "credentials",
              title: "Credentials",
              restrictVisibility: false,
              fields: [
                {
                  id: "client-credentials",
                  title: "Client ID & Secret",
                  description:
                    "Copy these into your project's environment variables to enable DevDogs sign-in locally.",
                  restrictVisibility: false,
                },
              ],
            },
            {
              id: "test-accounts",
              title: "Test Accounts",
              restrictVisibility: false,
              fields: [
                {
                  id: "test-accounts-list",
                  title: "Test Accounts",
                  description:
                    "Sandboxed identities you can sign in as during the OAuth flow, without using your real DevDogs account.",
                  restrictVisibility: false,
                },
              ],
            },
          ],
        },
        {
          type: "page",
          id: "/tools/moderation",
          name: "Reporting API",
          description:
            "Wire up content moderation reporting for your project, then test the full flow with sandboxed test accounts.",
          url: "/tools/moderation",
          icon: "Siren",
          restrictVisibility: [{}],
          sections: [
            {
              id: "reporting",
              title: "Reporting",
              restrictVisibility: false,
              fields: [
                {
                  id: "report-api-key",
                  title: "Report API Key",
                  description:
                    "Used by your server to submit content reports server-to-server. Store it in your .env file immediately — it is shown only once.",
                  restrictVisibility: false,
                },
              ],
            },
            {
              id: "local-server",
              title: "Local Server",
              restrictVisibility: false,
              fields: [
                {
                  id: "local-server-url",
                  title: "Local Server URL",
                  description:
                    "Payloads are delivered from your browser as application/json POST requests. Your local server must allow cross-origin requests from this origin.",
                  restrictVisibility: false,
                },
              ],
            },
            {
              id: "test-reports",
              title: "Test Reports",
              restrictVisibility: false,
              fields: [
                {
                  id: "test-reports-list",
                  title: "Test Reports",
                  description:
                    "Reports filed by your test users. Use this to simulate the moderation experience before going live.",
                  restrictVisibility: false,
                },
              ],
            },
          ],
        },
        {
          type: "page",
          id: "/tools/feedback",
          name: "Feedback API",
          description:
            "Configure feedback topics and test the feedback submission flow with sandboxed test accounts.",
          url: "/tools/feedback",
          icon: "MessageSquare",
          restrictVisibility: [{}],
        },
      ],
    },
    {
      type: "folder",
      id: "console",
      name: "Console",
      children: [
        {
          type: "page",
          id: "/account",
          name: "Account",
          showInSidebar: false,
          description:
            "Manage your profile information, connected accounts, and verification status.",
          url: "/account",
          icon: "User",
          restrictVisibility: [{}],
          sections: [
            {
              id: "profile",
              title: "Profile",
              restrictVisibility: false,
              fields: [
                {
                  id: "avatar",
                  title: "Profile Photo",
                  description:
                    "Shown on your public profile, the community page, and anywhere else your account appears.",
                  restrictVisibility: false,
                },
                {
                  id: "preferredName",
                  title: "Preferred Name",
                  description:
                    "Displayed across DevDogs instead of your legal name.",
                  restrictVisibility: false,
                },
                {
                  id: "pronouns",
                  title: "Pronouns",
                  description:
                    "Select from common options or add your own. Shown on your public profile.",
                  restrictVisibility: false,
                },
                {
                  id: "graduation",
                  title: "Graduation",
                  description:
                    "Your expected graduation semester and year — used to verify your student status.",
                  restrictVisibility: false,
                },
                {
                  id: "bio",
                  title: "Bio",
                  description: "A short description of yourself.",
                  restrictVisibility: false,
                },
                {
                  id: "links",
                  title: "Links",
                  description:
                    "Add up to five links (e.g., portfolio, resume, socials) to display on your public profile. Drag to reorder.",
                  restrictVisibility: false,
                },
              ],
            },
            {
              id: "connectedAccounts",
              title: "Connected Accounts",
              restrictVisibility: false,
              fields: [
                {
                  id: "email",
                  title: "UGA MyID Email",
                  description:
                    "Obtained via UGA SSO and used for sign-in. This can't be changed here.",
                  restrictVisibility: false,
                },
                {
                  id: "github",
                  title: "GitHub",
                  description:
                    "Linking GitHub adds you to the DevDogs organization and grants access to this year's project repositories.",
                  restrictVisibility: false,
                },
                {
                  id: "discord",
                  title: "Discord",
                  description:
                    "Linking Discord adds you to the DevDogs Discord server.",
                  restrictVisibility: false,
                },
                {
                  id: "linkedin",
                  title: "LinkedIn",
                  description:
                    "Link your LinkedIn profile to display it on your public profile.",
                  restrictVisibility: false,
                },
              ],
            },
            {
              id: "status",
              title: "Status",
              restrictVisibility: false,
              fields: [
                {
                  id: "roles",
                  title: "Roles",
                  description:
                    "Your roles within the club. Only officers can change these.",
                  restrictVisibility: false,
                },
                {
                  id: "verification",
                  title: "Profile Verification",
                  description:
                    "Complete all the steps below for your profile to appear on the DevDogs community page.",
                  restrictVisibility: false,
                },
              ],
            },
          ],
        },
        {
          type: "page",
          id: "/console/moderation",
          name: "Moderation",
          description:
            "Review content reports filed against community profiles and resolve them with the appropriate action.",
          url: "/console/moderation",
          icon: "Shield",
          restrictVisibility: [{ canModerate: true }],
        },
        {
          type: "page",
          id: "/console/feedback",
          name: "Feedback",
          description:
            "Review and respond to feedback submissions from members across all topics.",
          url: "/console/feedback",
          icon: "MessageSquare",
          restrictVisibility: [{ canModerate: true }],
        },
        {
          type: "page",
          id: "/console/credentials",
          name: "Credentials",
          description:
            "Shared accounts and secrets used for testing integrations, visible only to roles you grant access to.",
          url: "/console/credentials",
          icon: "KeyRound",
          restrictVisibility: [{ canCreateCredentials: true }],
        },
        {
          type: "page",
          id: "/console/audit-log",
          name: "Audit Log",
          description:
            "A record of moderation actions and content reports filed across all production OAuth clients.",
          url: "/console/audit-log",
          icon: "ScrollText",
          restrictVisibility: [{ canViewAuditLog: true }],
        },
        {
          type: "page",
          id: "/console/verification",
          name: "Verification",
          description:
            "Upload the UGA Involvement Network roster to verify member profiles and unlock community page visibility.",
          url: "/console/verification",
          icon: "BadgeCheck",
          restrictVisibility: [{ canManageVerification: true }],
          sections: [
            {
              id: "import-involvement",
              title: "Import Involvement",
              restrictVisibility: false,
              fields: [
                {
                  id: "roster-csv",
                  title: "Roster CSV",
                  description:
                    "Export the membership roster from the UGA Involvement Network and upload it here. Members whose name and email match a profile are marked verified.",
                  restrictVisibility: false,
                },
              ],
            },
          ],
        },
        {
          type: "page",
          id: "/console/permissions",
          name: "Permissions",
          description:
            "Every member starts with no permissions; Root has all permissions and can only change hands via transfer below.",
          url: "/console/permissions",
          icon: "Lock",
          restrictVisibility: [{ canManageRoles: true }],
          sections: [
            {
              id: "root-access",
              title: "Root Access",
              restrictVisibility: false,
            },
            {
              id: "assign-roles",
              title: "Assign Roles",
              restrictVisibility: false,
            },
            {
              id: "role-definitions",
              title: "Role Definitions",
              restrictVisibility: false,
            },
          ],
        },
      ],
    },
  ],
} satisfies ManifestRoot;

export function flattenAppPages(): (ManifestPage & { group: string })[] {
  const pages: (ManifestPage & { group: string })[] = [];
  for (const folder of appManifest.children) {
    for (const child of folder.children) {
      if (child.type === "page") {
        pages.push({ ...child, group: folder.name ?? "" });
      }
    }
  }
  return pages;
}
