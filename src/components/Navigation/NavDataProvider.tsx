"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { profiles } from "~/server/db/schema";
import type { HighestRankingRole } from "~/server/actions/permissions";

export interface NavUserData {
  profile: typeof profiles.$inferSelect;
  hiddenNavHrefs: string[];
  highestRole: HighestRankingRole;
}

const NavDataContext = createContext<NavUserData | null>(null);

export function useNavData(): NavUserData | null {
  return useContext(NavDataContext);
}

export function NavDataProvider({
  data,
  children,
}: {
  data: NavUserData | null;
  children: ReactNode;
}) {
  return (
    <NavDataContext.Provider value={data}>{children}</NavDataContext.Provider>
  );
}
