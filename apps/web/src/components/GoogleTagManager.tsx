import Script from "next/script";

export default function GoogleTagManager() {
  return (
    <div>
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-CNVHG8WSHW"
        // eslint-disable-next-line react/jsx-no-comment-textnodes
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-CNVHG8WSHW');
      `}
      </Script>
    </div>
  );
}
