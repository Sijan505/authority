import { LOGO_PATH } from "@/components/Decor";
import { IntroCounter } from "@/components/Motion";
import { letterColour } from "@/components/wordmark";
import { cities } from "@/config/site";
import { copy } from "@/content/copy";

// Runs while the HTML is parsed, before first paint: returning visitors in the same
// browser session skip the intro, so it only plays once per visit.
const skipIfSeen = `try{var k="authority-intro";if(sessionStorage.getItem(k)){document.getElementById("intro").hidden=true}else{sessionStorage.setItem(k,"1")}}catch(e){}`;

/**
 * Opening sequence for the home page (timings in globals.css, "Intro"): the star
 * draws itself, AUTHORITY rises out of a blur in the wordmark colours, the three
 * Nepali words follow, and a cream then a brown curtain lift. The exit is pure CSS,
 * so the page is never stuck behind it; reduced-motion visitors skip it.
 */
export function IntroLoader() {
  const word = [...copy.brand.wordmark];
  const deva = copy.home.hero.deva.split(" · ");
  const places = cities.filter((c) => c !== "Other").join(" · ");

  return (
    <>
      <div id="intro" className="intro-wrap" aria-hidden="true" suppressHydrationWarning>
        <div className="intro-back" />
        <div className="intro">
          <div className="intro-top flex items-start justify-between gap-6 text-[0.6875rem] tracking-[0.32em] text-mute uppercase">
            <span>The founding presentation</span>
            <span className="hidden text-right sm:block">{places}</span>
          </div>

          <div className="intro-center">
            <svg viewBox="0 0 48 48" className="intro-star" fill="none">
              <path d={LOGO_PATH} pathLength={1} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div className="intro-word">
              {word.map((ch, i) => (
                <span key={i} style={{ "--i": i, color: letterColour(i, word.length) } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
            </div>
            <div lang="ne" className="intro-deva">
              {deva.map((w, i) => (
                <span key={w} style={{ "--i": i } as React.CSSProperties}>
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div className="intro-bottom">
            <div className="intro-progress" />
            <div className="flex items-end justify-between gap-6">
              <span className="intro-tagline font-serif text-[clamp(1rem,2vw,1.375rem)] italic">{copy.brand.tagline}</span>
              <span className="intro-count">
                <IntroCounter />
              </span>
            </div>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: skipIfSeen }} />
    </>
  );
}
