import "fumadocs-ui/style.css";
import { RootProvider } from "fumadocs-ui/provider/next";

export default function DocsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootProvider theme={{ defaultTheme: "dark" }}>{children}</RootProvider>;
}
