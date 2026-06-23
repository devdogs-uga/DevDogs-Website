"use client";

import type { ComponentProps, Dispatch, SetStateAction } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import SidebarContent from "./SidebarContent";
import SidebarLayout from "./SidebarLayout";
import DrawerLayout from "./DrawerLayout";
import DevDogsSearchDialog from "~/components/DevDogsSearchDialog";

interface SidebarContext {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  searchOpen: boolean;
  setSearchOpen: Dispatch<SetStateAction<boolean>>;
}

const sidebarContext = createContext<SidebarContext | null>(null);

export function useSidebar() {
  const context = useContext(sidebarContext);
  if (!context) {
    throw new Error(
      "`useSidebar()` can only be used in a child of `<Sidebar />`.",
    );
  }
  return context;
}

export default function Sidebar({
  user,
  docs,
}: ComponentProps<typeof SidebarContent>) {
  const [expanded, setExpanded] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const mediaQuery = window.matchMedia("(max-width: 64rem)");
    setOverlay(mediaQuery.matches);
    mediaQuery.addEventListener(
      "change",
      (e) => setOverlay(e.matches),
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <sidebarContext.Provider
      value={{ expanded, setExpanded, searchOpen, setSearchOpen }}
    >
      <aside
        className="group/sidebar sticky top-0 z-10 -order-1 flex min-h-screen flex-col sm:h-screen sm:flex-row"
        data-expanded={expanded || undefined}
      >
        <Dialog.Root open={expanded && overlay} onOpenChange={setExpanded}>
          <Dialog.Overlay className="fixed inset-0 z-49 h-dvh w-screen bg-black/50" />
          <Dialog.Content forceMount>
            <SidebarLayout>
              <DrawerLayout>
                <SidebarContent user={user} docs={docs} />
              </DrawerLayout>
            </SidebarLayout>
          </Dialog.Content>
        </Dialog.Root>
      </aside>
      <DevDogsSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </sidebarContext.Provider>
  );
}
