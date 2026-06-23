import { expectUserWith } from "~/server/auth";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { connection } from "next/server";
import {
  profileWithVerification,
  ROOT_ROLE_ID,
  userRoles,
} from "~/server/db/schema";

export default async function DynamicNavigation() {
  await connection();
  const user = await expectUserWith({
    profile: true,
    userRoles: {
      columns: {},
      with: {
        role: {
          columns: {
            title: true,
          },
          orderBy: {
            rank: "asc",
          },
        },
      },
      where: {
        role: {
          id: {
            ne: ROOT_ROLE_ID,
          },
        },
      },
    },
  }).catch(() => null);

  if (!user) {
    return <Navbar />;
  }

  return <Sidebar user={user} />;
}
