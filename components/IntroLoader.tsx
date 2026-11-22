import { cities } from "@/config/site";
import { copy } from "@/content/copy";

// Runs while the HTML is parsed, before first paint: returning visitors in the same
// browser session skip the intro, so it only plays once per visit.
const skipIfSeen = `try{var k="authority-intro";if(sessionStorage.getItem(k)){document.getElementById("intro").hidden=true}else{sessionStorage.setItem(k,"1")}}catch(e){}`;

/**
 * Opening sequence for the home page (timings in globals.css, "Intro"): the wordmark
 * rises from behind a mask, a gold rule draws beneath it, the tagline settles, and a
 * single ivory curtain lifts. The exit is pure CSS, so the page is never stuck behind
 * it; reduced-motion visitors skip it.
 */
export function IntroLoader() {
  const places = cities.filter((c) => c !== "Other").join(" · ");

  return (
    <>
      <div id="intro" className="intro-wrap" aria-hidden="true" suppressHydrationWarning>
        <div className="intro">
          <div className="intro-center">
            <div className="intro-mask">
              <span className="intro-word wordmark-gradient">{copy.brand.wordmark}</span>
            </div>
            <span className="intro-rule" />
            <span className="intro-tagline">{copy.brand.tagline}</span>
          </div>

          <div className="intro-foot">
            <span>{places}</span>
            <span>Nepal</span>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: skipIfSeen }} />
    </>
  );
}
