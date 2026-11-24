import type { Metadata, Viewport } from "next";
import { AppIntro } from "@/components/AppIntro";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { memberNumber } from "@/lib/app";

export const metadata: Metadata = { title: { default: "App", template: "%s · Authority" } };

// The app's header is the brand brown, so the phone's status bar matches it.
export const viewport: Viewport = { themeColor: "#3b1a12", viewportFit: "cover" };

/** The installed app: its own header per screen, the bottom tab bar (root layout) and its own intro. */
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const viewer = await getViewer();
  const number = await memberNumber(viewer);
  const line = number ? copy.app.memberNo(number) : viewer ? (viewer.plan ? copy.app.tierMember : copy.app.tierNotMember) : copy.app.intro.guest;

  return (
    <div className="app-shell min-h-svh bg-ivory">
      <AppIntro name={viewer?.user.name ?? null} line={number || viewer ? line : ""} />
      {children}
    </div>
  );
}
