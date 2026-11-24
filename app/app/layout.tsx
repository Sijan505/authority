import type { Metadata, Viewport } from "next";
import { AppIntro } from "@/components/AppIntro";
import { getViewer } from "@/lib/access";
import { cardFor } from "@/lib/member-card";

export const metadata: Metadata = { title: { default: "App", template: "%s · Authority" } };

// The app's header is the brand brown, so the phone's status bar matches it.
export const viewport: Viewport = { themeColor: "#3b1a12", viewportFit: "cover" };

/** The installed app: its own header per screen, the bottom tab bar (root layout) and its own intro. */
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const card = await cardFor(await getViewer());

  return (
    <div className="app-shell min-h-svh bg-ivory">
      <AppIntro card={card} />
      {children}
    </div>
  );
}
