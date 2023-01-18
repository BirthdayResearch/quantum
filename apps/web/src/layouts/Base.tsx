import Head from "next/head";
import { PropsWithChildren, useEffect, useState } from "react";
import {
  appName,
  longDescription,
  shortDescription,
  siteTitle,
  website,
} from "@components/siteInfo";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WagmiConfig, createClient, configureChains } from "wagmi";
import { localhost, hardhat, mainnet, goerli } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import Footer from "@components/Footer";
import Header from "@components/Header";
import { getInitialTheme, ThemeProvider } from "@contexts/ThemeProvider";
import { NetworkEnvironmentProvider } from "@contexts/NetworkEnvironmentContext";
import { NetworkProvider } from "@contexts/NetworkContext";
import { InjectedConnector } from "wagmi/connectors/injected";

const metamask = new MetaMaskConnector({
  chains: [mainnet, goerli, localhost, hardhat],
});

const { chains, provider } = configureChains(
  [localhost, hardhat],
  [
    jsonRpcProvider({
      rpc: (c) => ({
        http: (process.env.RPC_URL || c.rpcUrls.default) as string,
      }),
    }),
  ]
);

const client = createClient(
  getDefaultClient({
    autoConnect: true,
    appName,
    connectors: [metamask, new InjectedConnector({ chains })],
    provider,
  })
);

function Base({ children }: PropsWithChildren<any>): JSX.Element | null {
  const initialTheme = getInitialTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-dark-00 antialiased">
      <Head>
        <base href="/" />
        <meta name="application-name" content={appName} />
        <meta charSet="UTF-8" />
        <title key="title">{siteTitle}</title>
        <meta key="description" name="description" content={longDescription} />
        <meta key="robots" name="robots" content="follow,index" />
        <meta name="googlebot" content="index,follow" />
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta
          key="apple-mobile-web-app-capable"
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta name="theme-color" content="#5B10FF" />

        <meta name="og:locale" content="en_SG" />
        <meta name="og:title" content={siteTitle} />
        <meta name="og:image" content="/bridge_share.png" />
        <meta name="og:site_name" content={appName} />
        <meta name="og:url" content={website} />
        <meta name="og:description" content={shortDescription} />

        <meta name="twitter:card" content={shortDescription} />
        <meta name="twitter:site" content={website} />
        <meta name="twitter:creator" content="@birthdaydev" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={shortDescription} />
        <meta name="twitter:image" content="/bridge_share.png" />
        <meta name="twitter:image:alt" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />

        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" sizes="64x64" href="/favicon-64x64.png" />
      </Head>

      <WagmiConfig client={client}>
        <ConnectKitProvider mode="dark">
          {mounted && (
            <NetworkProvider>
              <NetworkEnvironmentProvider>
                <ThemeProvider theme={initialTheme}>
                  <div className="relative">
                    <Header />
                    <main className="relative z-[1] flex-grow">{children}</main>
                    <div className="absolute top-0 left-0 z-auto h-full w-full bg-[url('/background/mobile.png')] bg-cover bg-local bg-clip-padding bg-top bg-no-repeat bg-origin-padding mix-blend-screen md:bg-[url('/background/tablet.png')] lg:bg-[url('/background/desktop.png')] lg:bg-center" />
                    <Footer />
                  </div>
                </ThemeProvider>
              </NetworkEnvironmentProvider>
            </NetworkProvider>
          )}
        </ConnectKitProvider>
      </WagmiConfig>
    </div>
  );
}

export default Base;
