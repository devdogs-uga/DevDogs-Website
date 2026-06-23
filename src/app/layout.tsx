import "~/styles/globals.css";

import { type Metadata } from "next";
import {
  Alan_Sans,
  Cascadia_Code,
  Geist,
  Hanken_Grotesk,
} from "next/font/google";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { FullscreenNavProvider } from "~/components/Navigation/FullscreenNav";
import AnimationInit from "~/ui/animation-init";
import NavigationProgress from "~/ui/navigation-progress";
import QueryProvider from "~/ui/query-provider";
import Toaster from "~/components/Toaster";
import Script from "next/script";
import { cn } from "~/lib/cn";

export const metadata: Metadata = {
  title: "DevDogs",
  description:
    "DevDogs is a club at UGA devoted to bettering our community through open-source software.",
  applicationName: "DevDogs",
};

const geist = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans" });

const display = Alan_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = Cascadia_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        display.variable,
        mono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="bg-black text-mauve-950">
        <Script strategy="beforeInteractive" src="/sidebar.js" />
        <NavigationProgress />
        <FullscreenNavProvider>
          <TooltipProvider>
            <QueryProvider>
              <AnimationInit />
              <Toaster />
              {children}
            </QueryProvider>
          </TooltipProvider>
        </FullscreenNavProvider>
      </body>
    </html>
  );
}
