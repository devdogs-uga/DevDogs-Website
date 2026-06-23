"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavDataProvider, type NavUserData } from "./NavDataProvider";
import {
  VerificationProvider,
  type VerificationData,
} from "./VerificationProvider";

type Setter = (nav: NavUserData | null, ver: VerificationData | null) => void;

const SetterContext = createContext<Setter>(() => {});

export function useSetNavDynamicData() {
  return useContext(SetterContext);
}

export default function NavDataRoot({ children }: { children: ReactNode }) {
  const [navData, setNavData] = useState<NavUserData | null>(null);
  const [verification, setVerification] = useState<VerificationData | null>(
    null,
  );

  const setter: Setter = (nav, ver) => {
    setNavData(nav);
    setVerification(ver);
  };

  return (
    <SetterContext.Provider value={setter}>
      <NavDataProvider data={navData}>
        <VerificationProvider data={verification}>
          {children}
        </VerificationProvider>
      </NavDataProvider>
    </SetterContext.Provider>
  );
}

export function NavDataHydrator({
  navData,
  verification,
}: {
  navData: NavUserData | null;
  verification: VerificationData | null;
}) {
  const setter = useSetNavDynamicData();

  useLayoutEffect(() => {
    setter(navData, verification);
  }, [navData, verification, setter]);

  return null;
}
