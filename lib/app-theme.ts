// Shared by the app layout (server) and the theme switch (browser).
// Appearance: "light" (ivory, like the website), "dark" (the brand-brown header,
// tab bar and intro) or "auto" (follow the phone). Stored on this device only.
export const THEME_KEY = "authority-app-theme";
export const THEME_COLORS = { light: "#fcfbf0", dark: "#3b1a12" } as const;

/** Runs before the first paint so the app never flashes the wrong theme. */
export const themeScript = `try{var c=localStorage.getItem("${THEME_KEY}")||"light";var d=c==="dark"||(c==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.appTheme=d?"dark":"light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?"${THEME_COLORS.dark}":"${THEME_COLORS.light}")}catch(e){}`;
