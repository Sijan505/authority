import { CardFace } from "@/components/MemberCard";
import { copy } from "@/content/copy";
import type { CardData } from "@/lib/member-card";

// Plays once per app session: hidden before first paint if it already ran.
const skipIfSeen = `try{var k="authority-app-intro";if(sessionStorage.getItem(k)){document.getElementById("app-intro").hidden=true}else{sessionStorage.setItem(k,"1")}}catch(e){}`;

/**
 * The app's opening (timings in globals.css, "App intro"), different from the
 * website's curtain: on soft ivory, the member's own membership card (photo,
 * name, number, QR) rises and tilts into place, the star draws itself, a gold light
 * passes across, and it lifts away into the dashboard. Pure CSS, so the app is never
 * stuck behind it; reduced-motion visitors skip it.
 */
export function AppIntro({ card }: { card: CardData | null }) {
  return (
    <>
      <div id="app-intro" className="app-intro" aria-hidden="true" suppressHydrationWarning>
        <div className="app-intro-card">
          <div className="app-intro-sheen-clip">
            <div className="app-intro-sheen" />
          </div>
          <CardFace card={card} intro />
        </div>
        <p className="app-intro-fade app-intro-tagline font-serif italic">{copy.brand.tagline}</p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: skipIfSeen }} />
    </>
  );
}
