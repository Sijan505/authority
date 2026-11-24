import { LOGO_PATH } from "@/components/Decor";
import { copy } from "@/content/copy";

// Plays once per app session: hidden before first paint if it already ran.
const skipIfSeen = `try{var k="authority-app-intro";if(sessionStorage.getItem(k)){document.getElementById("app-intro").hidden=true}else{sessionStorage.setItem(k,"1")}}catch(e){}`;

/**
 * The app's opening (timings in globals.css, "App intro"), different from the
 * website's curtain: on the brand brown, an ivory membership card rises and tilts
 * into place, the star draws itself, the member's name and number appear, a gold
 * light passes across the card, and it lifts away into the dashboard. Pure CSS, so
 * the app is never stuck behind it; reduced-motion visitors skip it.
 */
export function AppIntro({ name, line }: { name: string | null; line: string }) {
  return (
    <>
      <div id="app-intro" className="app-intro" aria-hidden="true" suppressHydrationWarning>
        <div className="app-intro-card">
          <div className="app-intro-sheen-clip">
            <div className="app-intro-sheen" />
          </div>
          <div className="flex items-start justify-between">
            <svg viewBox="0 0 48 48" className="app-intro-star h-9 w-9 text-tika" fill="none">
              <path d={LOGO_PATH} pathLength={1} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <span className="app-intro-fade text-[0.5625rem] tracking-[0.3em] text-mute uppercase">{copy.app.intro.card}</span>
          </div>
          <div>
            <p className="app-intro-word wordmark-gradient font-serif text-[1.875rem] leading-none font-light tracking-[0.24em]">{copy.brand.wordmark}</p>
            <div className="app-intro-rule mt-3 h-px w-full" />
            <div className="app-intro-fade mt-3 flex items-end justify-between gap-3" style={{ animationDelay: "1.35s" }}>
              <span className="truncate font-serif text-[1.0625rem] font-light uppercase tracking-[0.12em] text-ink">{name ?? copy.app.tierGuest}</span>
              <span className="shrink-0 text-[0.625rem] tracking-[0.2em] text-tika uppercase">{line}</span>
            </div>
          </div>
        </div>
        <p className="app-intro-fade app-intro-tagline font-serif italic">{copy.brand.tagline}</p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: skipIfSeen }} />
    </>
  );
}
