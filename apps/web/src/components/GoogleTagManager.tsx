import Script from "next/script";

// eslint-disable-next-line import/prefer-default-export
export function GoogleTagManager() {
  return (
    <>
      <Script
        strategy="lazyOnload"
        src="https://www.googletagmanager.com/gtag/js?id=G-CNVHG8WSHW"
        // eslint-disable-next-line react/jsx-no-comment-textnodes
      />
      <Script id="" strategy="lazyOnload">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-CNVHG8WSHW');
      `}
      </Script>
    </>
  );
}
