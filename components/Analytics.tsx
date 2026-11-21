import Script from "next/script";

const ID = process.env.NEXT_PUBLIC_ANALYTICS_ID;

/** Google Analytics 4 page views. Loads nothing unless NEXT_PUBLIC_ANALYTICS_ID is set. */
export function Analytics() {
  if (!ID || !/^G-[A-Z0-9]+$/.test(ID)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ID}');`}
      </Script>
    </>
  );
}
