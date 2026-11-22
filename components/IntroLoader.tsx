import { IntroCounter } from "@/components/Motion";
import { copy } from "@/content/copy";

// Runs while the HTML is parsed, before first paint: returning visitors in the same
// browser session skip the intro, so it only plays once per visit.
const skipIfSeen = `try{var k="authority-intro";if(sessionStorage.getItem(k)){document.getElementById("intro").hidden=true}else{sessionStorage.setItem(k,"1")}}catch(e){}`;

/**
 * Opening curtain for the home page: a 000 → 100 counter, the wordmark rising in,
 * then the curtain lifts. The exit is pure CSS (see .intro in globals.css), so the
 * page is never stuck behind it, and it is skipped for reduced-motion users.
 */
export function IntroLoader() {
  const word = copy.brand.wordmark;
  return (
    <>
      <div id="intro" className="intro" aria-hidden="true" suppressHydrationWarning>
        <div className="flex items-start justify-between text-xs tracking-[0.3em] text-mute uppercase">
          <span>The founding presentation</span>
          <span lang="ne" className="font-deva tracking-normal text-tika">
            {copy.home.hero.deva}
          </span>
        </div>
        <div className="intro-word">
          {[...word].map((ch, i) => (
            <span key={i} style={{ "--i": i } as React.CSSProperties}>
              {ch}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between">
          <span className="font-serif text-lg italic">{copy.brand.tagline}</span>
          <span className="intro-count">
            <IntroCounter />
          </span>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: skipIfSeen }} />
    </>
  );
}
