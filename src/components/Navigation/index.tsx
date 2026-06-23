import { Suspense, type PropsWithChildren } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import DynamicNavigation from "./DynamicNavigation";

interface Props extends PropsWithChildren {
  prerenderLayout: "navbar" | "sidebar";
}

export default function Navigation({ children, prerenderLayout }: Props) {
  // const pathname = usePathname();
  // const navData = useNavData();
  // const isAuthRoute =
  //   pathname.startsWith("/account") ||
  //   pathname.startsWith("/console") ||
  //   pathname.startsWith("/tools");
  // const showSidebar =
  //   !!navData?.profile || pathname.startsWith("/docs") || isAuthRoute;
  const Fallback = prerenderLayout === "navbar" ? Navbar : Sidebar;

  return (
    // <FullscreenNavProvider>
      <div className="flex min-h-screen">
        <main
          id="main-content"
          className="@container relative flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto"
        >
          {children}
        </main>
        <Suspense fallback={<Fallback />}>
          <DynamicNavigation />
        </Suspense>
      </div>
    // </FullscreenNavProvider>
  );
}
