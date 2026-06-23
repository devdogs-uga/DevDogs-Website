import Navigation from "~/components/Navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Navigation prerenderLayout="sidebar">
      {children}
    </Navigation>
  )
}