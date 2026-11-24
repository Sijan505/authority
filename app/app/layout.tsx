import type { Metadata, Viewport } from "next";
import { AppIntro } from "@/components/AppIntro";
import { getViewer } from "@/lib/access";
import { themeScript } from "@/lib/app-theme";
import { cardFor } from "@/lib/member-card";

export const metadata: Metadata = { title: { default: "App", template: "%s · Authority" } };

// The app is ivory like the website, so the phone's status bar matches it.
export const viewport: Viewport = { themeColor: "#fcfbf0", viewportFit: "cover" };

/** The installed app: its own header per screen, the bottom tab bar (root layout) and its own intro. */
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const card = await cardFor(await getViewer());

  return (
    <div className="app-shell min-h-svh bg-ivory">
      {/* Light or dark, before anything is drawn (components/AppTheme.tsx). */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <AppIntro card={card} />
      {children}
    </div>
  );
}
