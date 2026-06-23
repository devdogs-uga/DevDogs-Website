"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import VerificationDialog from "~/components/VerificationDialog";

export interface VerificationStatus {
  hasPronouns: boolean;
  hasGraduationDate: boolean;
  hasGithub: boolean;
  hasDiscord: boolean;
  nameMatchesInvolvement: boolean;
}

export interface VerificationData {
  userId: string;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  involvementFullName: string | null;
}

interface VerificationContextValue {
  userId: string;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  involvementFullName: string | null;
  completed: number;
  total: number;
  dialogOpen: boolean;
  openDialog: () => void;
  setDialogOpen: (open: boolean) => void;
}

const VerificationContext = createContext<VerificationContextValue | null>(
  null,
);

export function useVerification(): VerificationContextValue | null {
  return useContext(VerificationContext);
}

export function VerificationProvider({
  data,
  children,
}: {
  data: VerificationData | null;
  children: ReactNode;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = useCallback(() => setDialogOpen(true), []);

  // Only used to capture the initial value without triggering the
  // exhaustive-deps rule — we want this to run exactly once on mount.
  const initialShouldAutoOpen = useRef(data !== null && !data.isVerified);

  useEffect(() => {
    if (!initialShouldAutoOpen.current) return;
    try {
      if (!sessionStorage.getItem("devdogs:verificationDialogSeen")) {
        sessionStorage.setItem("devdogs:verificationDialogSeen", "1");
        setDialogOpen(true);
      }
    } catch {
      // sessionStorage unavailable (e.g. private-mode restrictions)
    }
  }, []);

  if (!data) return <>{children}</>;

  const completed = Object.values(data.verificationStatus).filter(
    Boolean,
  ).length;

  return (
    <VerificationContext.Provider
      value={{
        userId: data.userId,
        verificationStatus: data.verificationStatus,
        isVerified: data.isVerified,
        involvementFullName: data.involvementFullName,
        completed,
        total: 5,
        dialogOpen,
        openDialog,
        setDialogOpen,
      }}
    >
      {children}
      <VerificationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </VerificationContext.Provider>
  );
}
