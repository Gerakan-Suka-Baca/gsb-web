import Script from "next/script";

/**
 * Google Analytics / GTM loader.
 * Uses `lazyOnload` strategy so the ~150 KiB GTM bundle loads only
 * after the page is fully interactive — prevents blocking LCP and TBT.
 */
export const GoogleAnalytics = () => {
  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=G-53NBZE3ZBB`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-53NBZE3ZBB');
          `,
        }}
      />
    </>
  );
};
